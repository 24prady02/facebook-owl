
from flask import Flask, request, jsonify, send_file
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
import pandas as pd
import io

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

def get_collection_names(class_name, slot):
    """Generate consistent collection names based on class and slot"""
    # Remove spaces and special characters but preserve case
    clean_class = ''.join(e for e in class_name if e.isalnum())
    clean_slot = ''.join(e for e in slot if e.isalnum())
    
    embeddings_collection = f"{clean_class}_{clean_slot}_embeddings"
    attendance_collection = f"{clean_class}_{clean_slot}_attendance"
    
    return embeddings_collection, attendance_collection

# Function to build a FAISS index from Firestore embeddings
def build_faiss_index(db, embeddings_collection):
    try:
        # Fetch all embeddings from Firestore
        docs = list(db.collection(embeddings_collection).stream())
        
        if not docs:
            print(f"No embeddings found in {embeddings_collection}.")
            return None, None

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
            print("No valid embeddings found in Firestore.")
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
def mark_attendance(db, student_id, attendance_collection, class_name, slot):
    try:
        # Create attendance record
        record = {
            'student_id': student_id,
            'class': class_name,
            'slot': slot,
            'timestamp': datetime.now(),
            'status': 'present',
            'date': datetime.now().strftime("%Y-%m-%d")
        }
        
        # Add to attendance collection
        db.collection(attendance_collection).document(student_id).set(record, merge=True)
        print(f"Attendance marked for {student_id} in {attendance_collection}")
        return True
    except Exception as e:
        print(f"Error marking attendance: {e}")
        return False

# Function to export attendance records to Excel
def export_attendance_to_excel(db, attendance_collection, class_name, slot):
    try:
        # Get all attendance records for today
        today = datetime.now().strftime("%Y-%m-%d")
        records_ref = db.collection(attendance_collection).where('date', '==', today)
        docs = records_ref.stream()
        
        # Prepare data for DataFrame
        attendance_data = []
        for doc in docs:
            record = doc.to_dict()
            attendance_data.append({
                'Student ID': record.get('student_id', ''),
                'Class': record.get('class', ''),
                'Slot': record.get('slot', ''),
                'Timestamp': record.get('timestamp', datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                'Status': record.get('status', '')
            })
        
        if not attendance_data:
            print("No attendance records found for today.")
            return None
        
        # Create DataFrame and export to Excel
        df = pd.DataFrame(attendance_data)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        return excel_buffer
    except Exception as e:
        print(f"Error exporting attendance: {e}")
        return None

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
    
    # Generate collection names
    embeddings_collection, attendance_collection = get_collection_names(class_name, time_slot)
    print(f"Using collections: {embeddings_collection}, {attendance_collection}")
    
    # Save the image to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_image:
        image_file.save(temp_image.name)
        temp_image_path = temp_image.name
    
    try:
        # Initialize FAISS index
        index, student_ids = build_faiss_index(db, embeddings_collection)
        if index is None:
            return jsonify({"error": f"No embeddings found in collection {embeddings_collection}"}), 400
        
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
        marked_students = set()  # To avoid duplicate marking
        
        for face in faces:
            embedding = face['embedding']
            
            # Search for matching student
            student_id, distance = search_student_with_faiss(embedding, index, student_ids, threshold=1.0)
            
            if student_id and student_id not in marked_students:
                # Mark attendance
                mark_attendance(db, student_id, attendance_collection, class_name, time_slot)
                marked_students.add(student_id)
                
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
            "facesDetected": len(faces),
            "collectionName": attendance_collection
        })
        
    except Exception as e:
        # Clean up temporary file if it exists
        if os.path.exists(temp_image_path):
            os.unlink(temp_image_path)
        
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/export-attendance', methods=['GET'])
def export_attendance():
    if not initialize_firebase():
        return jsonify({"error": "Failed to initialize Firebase"}), 500
    
    # Initialize Firestore
    db = firestore.Client()
    
    # Get parameters from the request
    class_name = request.args.get('className')
    time_slot = request.args.get('timeSlot')
    
    if not class_name or not time_slot:
        return jsonify({"error": "Missing className or timeSlot"}), 400
    
    # Generate collection names
    _, attendance_collection = get_collection_names(class_name, time_slot)
    
    # Export attendance to Excel
    excel_buffer = export_attendance_to_excel(db, attendance_collection, class_name, time_slot)
    if excel_buffer is None:
        return jsonify({"error": "No attendance records found"}), 404
    
    # Create a sanitized filename
    filename = f"attendance_{class_name.replace(' ', '')}_{time_slot}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    # Return the Excel file
    return send_file(
        excel_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

if __name__ == '__main__':
    initialize_firebase()
    app.run(host='0.0.0.0', port=5000, debug=True)
