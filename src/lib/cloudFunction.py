
# Import libraries
import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
from google.cloud import firestore
import firebase_admin
from firebase_admin import credentials, storage
from datetime import datetime
import os
import tempfile
import faiss

def normalize_embedding(embedding):
    """Normalize embedding vector"""
    return embedding / np.linalg.norm(embedding)

def build_faiss_index(db):
    """Build a FAISS index from Firestore embeddings"""
    try:
        # Fetch all embeddings from Firestore
        docs = db.collection("embeddings").stream()

        embeddings_list = []
        student_ids = []

        for doc in docs:
            stored_embedding = doc.to_dict().get("embedding")
            if stored_embedding:
                # Convert stored embedding to a numpy array and normalize it
                stored_embedding_array = normalize_embedding(np.array(stored_embedding, dtype="float32"))
                embeddings_list.append(stored_embedding_array)
                student_ids.append(doc.id)

        if not embeddings_list:
            print("No embeddings found in Firestore.")
            return None, None

        # Convert list of embeddings to a numpy array
        embeddings_array = np.vstack(embeddings_list)

        # Build a FAISS index
        dimension = embeddings_array.shape[1]  # Dimension of embeddings (e.g., 512)
        index = faiss.IndexFlatL2(dimension)  # L2 distance (Euclidean)
        index.add(embeddings_array)  # Add embeddings to the index

        return index, student_ids
    except Exception as e:
        print(f"Error building FAISS index: {e}")
        return None, None

def search_student_with_faiss(embedding, index, student_ids, threshold=1.0):
    """Search for a student using FAISS with a threshold"""
    try:
        # Normalize the query embedding
        query_embedding = normalize_embedding(np.array([embedding], dtype="float32"))

        # Search the FAISS index
        distances, indices = index.search(query_embedding, k=1)  # k=1 for the closest match

        if indices.size > 0:
            matched_index = indices[0][0]
            min_distance = distances[0][0]

            # Apply threshold logic
            if min_distance <= threshold:
                matched_student_id = student_ids[matched_index]
                return matched_student_id, min_distance
            else:
                print(f"No match found: Distance {min_distance:.4f} exceeds threshold {threshold}.")
                return None, None
    except Exception as e:
        print(f"Error searching FAISS index: {e}")
    return None, None

def mark_attendance(db, student_id, class_name, slot):
    """Mark attendance in Firestore with class and slot"""
    # Get the current date
    date = datetime.now().strftime("%Y-%m-%d")

    # Mark attendance in Firestore with class and slot
    db.collection("attendance").document(student_id).set({
        "date": date,
        "status": "present",
        "class": class_name,
        "slot": slot,
        "timestamp": datetime.now()
    }, merge=True)
    print(f"Attendance marked for student ID: {student_id} in class {class_name}, slot {slot}")

def process_attendance_image(event, context):
    """Cloud Function triggered by a new document in the attendance_requests collection"""
    # Initialize Firebase if not already initialized
    if not firebase_admin._apps:
        # Use the default credentials
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET')
        })
    
    # Initialize Firestore and Storage clients
    db = firestore.Client()
    bucket = storage.bucket()
    
    # Get the document data
    resource_string = context.resource
    # Format: projects/{project_id}/databases/{database_id}/documents/{document_path}
    document_path = resource_string.split('/documents/')[1]
    document_id = document_path.split('/')[-1]
    
    # Get the document
    doc_ref = db.collection('attendance_requests').document(document_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        print(f"Document {document_id} does not exist.")
        return
    
    doc_data = doc.to_dict()
    photo_url = doc_data.get('photoURL')
    class_name = doc_data.get('className')
    time_slot = doc_data.get('timeSlot')
    
    if not photo_url or not class_name or not time_slot:
        print("Missing required fields in document.")
        doc_ref.update({
            'status': 'error',
            'message': 'Missing required fields'
        })
        return
    
    try:
        # Download the image from Storage
        blob = bucket.blob(photo_url.replace('gs://' + bucket.name + '/', ''))
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp:
            blob.download_to_file(temp)
            temp_path = temp.name
        
        # Process the image
        # Initialize FAISS index
        index, student_ids = build_faiss_index(db)
        if index is None:
            doc_ref.update({
                'status': 'error',
                'message': 'Failed to build FAISS index'
            })
            return
        
        # Load the image
        image = cv2.imread(temp_path)
        if image is None:
            doc_ref.update({
                'status': 'error',
                'message': 'Failed to load image'
            })
            return
        
        # Convert to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Initialize InsightFace
        app = FaceAnalysis()
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Detect faces
        faces = app.get(image_rgb)
        
        if not faces:
            doc_ref.update({
                'status': 'completed',
                'message': 'No faces detected',
                'attendance': []
            })
            return
        
        # Process each detected face
        attendance_results = []
        
        for face in faces:
            embedding = face['embedding']
            
            # Search for matching student
            student_id, distance = search_student_with_faiss(embedding, index, student_ids, threshold=1.0)
            
            if student_id:
                # Mark attendance
                mark_attendance(db, student_id, class_name, time_slot)
                
                # Add to results
                attendance_results.append({
                    'studentId': student_id,
                    'distance': float(distance),
                    'status': 'present'
                })
        
        # Update the document with results
        doc_ref.update({
            'status': 'completed',
            'processedAt': datetime.now(),
            'attendance': attendance_results,
            'facesDetected': len(faces)
        })
        
        # Clean up temporary file
        os.unlink(temp_path)
        
    except Exception as e:
        print(f"Error processing image: {e}")
        doc_ref.update({
            'status': 'error',
            'message': str(e)
        })

