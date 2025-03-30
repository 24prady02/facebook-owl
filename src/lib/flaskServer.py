
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import firebase_admin
from firebase_admin import credentials, firestore, storage
from datetime import datetime
import tempfile
import faiss

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Firebase (will be done when the server starts)
firebase_initialized = False

def initialize_firebase():
    global firebase_initialized
    if not firebase_initialized:
        try:
            # Use the default credentials or environment variable
            if os.path.exists('serviceAccountKey.json'):
                cred = credentials.Certificate('serviceAccountKey.json')
            else:
                cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            return False
    return True

# Initialize InsightFace
def initialize_face_model():
    face_app = FaceAnalysis()
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    return face_app

# Function to normalize embedding
def normalize_embedding(embedding):
    return embedding / np.linalg.norm(embedding)

# Function to build a FAISS index from Firestore embeddings
def build_faiss_index(db):
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

# Function to search for a student using FAISS with a threshold
def search_student_with_faiss(embedding, index, student_ids, threshold=1.0):
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

# Function to Mark Attendance
def mark_attendance(db, student_id, class_name, slot):
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

@app.route('/process-attendance', methods=['POST'])
def process_attendance():
    if not initialize_firebase():
        return jsonify({"error": "Failed to initialize Firebase"}), 500
    
    # Initialize Firestore
    db = firestore.Client()
    
    # Check if we have the file in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    # Get the image file
    image_file = request.files['image']
    
    # Get parameters from the request
    class_name = request.form.get('className')
    time_slot = request.form.get('timeSlot')
    
    if not class_name or not time_slot:
        return jsonify({"error": "Missing className or timeSlot"}), 400
    
    # Save the image to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_image:
        image_file.save(temp_image.name)
        temp_image_path = temp_image.name
    
    try:
        # Initialize FAISS index
        index, student_ids = build_faiss_index(db)
        if index is None:
            return jsonify({"error": "Failed to build FAISS index"}), 500
        
        # Load the image
        image = cv2.imread(temp_image_path)
        if image is None:
            return jsonify({"error": "Failed to load image"}), 500
        
        # Convert to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Initialize InsightFace
        face_app = initialize_face_model()
        
        # Detect faces
        faces = face_app.get(image_rgb)
        
        if not faces:
            return jsonify({
                "status": "completed",
                "message": "No faces detected",
                "attendance": [],
                "facesDetected": 0
            })
        
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
        
        # Clean up temporary file
        os.unlink(temp_image_path)
        
        # Return the results
        return jsonify({
            "status": "completed",
            "message": f"Processed {len(faces)} faces",
            "attendance": attendance_results,
            "facesDetected": len(faces)
        })
        
    except Exception as e:
        # Clean up temporary file if it exists
        if os.path.exists(temp_image_path):
            os.unlink(temp_image_path)
        
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    initialize_firebase()
    app.run(host='0.0.0.0', port=5000, debug=True)
