from typing import Optional, Tuple, List, Dict, Any
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
CORS(app)

SERVICE_ACCOUNT_KEY = "firebase.json"

class FaceAttendanceSystem:
    def __init__(self, service_account_key_path: Optional[str] = None):
        self.firebase_initialized = False
        self.face_app = None
        self.db = None
        self.bucket = None
        self._init_face_model()
        if service_account_key_path:
            self._init_firebase(service_account_key_path)

    def _init_firebase(self, key_path: str):
        if not os.path.exists(key_path):
            raise FileNotFoundError(f"Key not found at {key_path}")
        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'face-detection-452311.appspot.com'
            })
        self.db = firestore.client()
        self.bucket = storage.bucket()
        self.firebase_initialized = True

    def _init_face_model(self):
        self.face_app = FaceAnalysis(name='buffalo_l')
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))

    @staticmethod
    def _normalize(e: np.ndarray) -> np.ndarray:
        return e / np.linalg.norm(e)

    @staticmethod
    def _collections(class_name: str, slot: str) -> Tuple[str, str]:
        clean = lambda s: ''.join(ch for ch in s if ch.isalnum())
        c = clean(class_name); s = clean(slot)
        return f"{c}_{s}_embeddings", f"{c}_{s}_attendance"

    def _build_index(self, embeddings_col: str) -> Tuple[Optional[faiss.Index], Optional[List[str]]]:
        if not self.firebase_initialized:
            raise RuntimeError("Firebase not initialized")
        docs = list(self.db.collection(embeddings_col).stream())
        if not docs:
            return None, None
        embs, ids = [], []
        for d in docs:
            emb = d.to_dict().get("embedding")
            if emb:
                embs.append(self._normalize(np.array(emb, dtype="float32")))
                ids.append(d.id)
        if not embs:
            return None, None
        arr = np.vstack(embs)
        idx = faiss.IndexFlatL2(arr.shape[1])
        idx.add(arr)
        return idx, ids

    def _search(self, emb: np.ndarray, idx: faiss.Index, ids: List[str], thr: float=1.0):
        q = self._normalize(np.array([emb], dtype="float32"))
        dist, loc = idx.search(q, 1)
        if loc.size and dist[0][0] <= thr:
            return ids[loc[0][0]], float(dist[0][0])
        return None, None

    def process_attendance(self, image_path: str, class_name: str, slot: str) -> Dict[str, Any]:
        if not self.firebase_initialized:
            return {"error": "Firebase not initialized", "status": "error"}
        emb_col, att_col = self._collections(class_name, slot)
        idx, ids = self._build_index(emb_col)
        if idx is None:
            return {"error": f"No embeddings in {emb_col}", "status": "error"}

        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Failed to load image", "status": "error"}
        faces = self.face_app.get(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if not faces:
            return {"status":"completed", "message":"No faces detected", "attendance":[], "facesDetected":0}

        results, marked = [], set()
        for f in faces:
            sid, dist = self._search(f['embedding'], idx, ids)
            if sid and sid not in marked:
                rec = {
                    'student_id': sid,
                    'class': class_name,
                    'slot': slot,
                    'timestamp': datetime.now(),
                    'status': 'present',
                    'date': datetime.now().strftime("%Y-%m-%d")
                }
                self.db.collection(att_col).document(sid).set(rec, merge=True)
                results.append({'studentId': sid, 'distance': dist, 'status': 'present'})
                marked.add(sid)
        return {
            "status": "completed",
            "message": f"Processed {len(faces)} faces",
            "attendance": results,
            "facesDetected": len(faces),
            "collectionName": att_col
        }

    def export_attendance_to_excel(self, class_name: str, slot: str) -> Optional[io.BytesIO]:
        if not self.firebase_initialized:
            raise RuntimeError("Firebase not initialized")
        _, att_col = self._collections(class_name, slot)
        today = datetime.now().strftime("%Y-%m-%d")
        docs = self.db.collection(att_col).where('date', '==', today).stream()
        rows = []
        for d in docs:
            r = d.to_dict()
            rows.append({
                'Student ID': r.get('student_id',''),
                'Class':    r.get('class',''),
                'Slot':     r.get('slot',''),
                'Timestamp': r.get('timestamp').strftime("%Y-%m-%d %H:%M:%S"),
                'Status':   r.get('status','')
            })
        if not rows:
            return None
        df = pd.DataFrame(rows)
        buf = io.BytesIO()
        df.to_excel(buf, index=False)
        buf.seek(0)
        return buf

# initialize once
fb_system = FaceAttendanceSystem(SERVICE_ACCOUNT_KEY)

@app.route('/process-attendance', methods=['POST'])
def process_attendance_route():
    if not fb_system.firebase_initialized:
        return jsonify({"error": "Firebase init failed"}), 500
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400
    img = request.files['image']
    cls = request.form.get('className')
    slot = request.form.get('timeSlot')
    if not cls or not slot:
        return jsonify({"error": "Missing className or timeSlot"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        img.save(tmp.name)
        path = tmp.name
    try:
        result = fb_system.process_attendance(path, cls, slot)
        status = 200 if result.get("status")=="completed" else 400
        return jsonify(result), status
    finally:
        os.remove(path)

@app.route('/export-attendance', methods=['GET'])
def export_attendance_route():
    if not fb_system.firebase_initialized:
        return jsonify({"error": "Firebase init failed"}), 500
    cls = request.args.get('className')
    slot = request.args.get('timeSlot')
    if not cls or not slot:
        return jsonify({"error": "Missing className or timeSlot"}), 400
    buf = fb_system.export_attendance_to_excel(cls, slot)
    if buf is None:
        return jsonify({"error": "No records"}), 404
    fname = f"attendance_{cls.replace(' ','')}_{slot}_{datetime.now():%Y%m%d}.xlsx"
    return send_file(buf, as_attachment=True, download_name=fname,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Welcome to the Attendance API"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
