
# Deploying Your Face Recognition System

This guide explains how to deploy your face recognition model with two options:
1. As a Firebase Cloud Function (serverless)
2. As a Flask backend server (more control over deployment)

## Option 1: Firebase Cloud Function Deployment

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project with Firestore and Storage set up
3. Python 3.7+ installed on your development machine

### Step 1: Initialize Firebase Cloud Functions

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory (select Functions)
firebase init functions

# When prompted, choose Python as your language
```

### Step 2: Set Up Your Python Environment

1. Navigate to the functions directory:
   ```bash
   cd functions
   ```

2. Create requirements.txt with these dependencies:
   ```
   firebase-admin==6.2.0
   opencv-python-headless==4.8.0.74
   numpy==1.24.3
   insightface==0.7.3
   faiss-cpu==1.7.4
   ```

### Step 3: Copy Your Cloud Function Code

Copy the `cloudFunction.py` code from this project into your `main.py` file in the functions directory.

### Step 4: Deploy Your Cloud Function

```bash
firebase deploy --only functions
```

### Step 5: Set Up Firestore Trigger

Your function is triggered when new documents are created in the "attendance_requests" collection. Make sure your database has this collection with proper security rules.

### Step 6: Configure Environment Variables

Set your Firebase storage bucket name as an environment variable:

```bash
firebase functions:config:set firebase.storage_bucket="your-project-id.appspot.com"
```

## Option 2: Flask Backend Deployment

For more control over the deployment and processing pipeline, you can use the Flask backend approach.

### Prerequisites

1. Python 3.7+ installed
2. pip (Python package manager)
3. Firebase service account key (downloaded from Firebase Console)

### Step 1: Install Required Packages

Create a requirements.txt file with the following dependencies:

```
flask==2.0.1
flask-cors==3.0.10
firebase-admin==6.2.0
opencv-python-headless==4.8.0.74
numpy==1.24.3
insightface==0.7.3
faiss-cpu==1.7.4
gunicorn==20.1.0
```

Install the packages:
```bash
pip install -r requirements.txt
```

### Step 2: Copy Flask Server Code

Copy the `flaskServer.py` code from this project to your server environment.

### Step 3: Configure Firebase Authentication

Place your Firebase service account key file in the same directory as your Flask server and name it `serviceAccountKey.json`.

### Step 4: Deploy the Flask App

For detailed deployment options (Google Cloud Run, Heroku, VPS), refer to the `flaskDeployment.md` guide.

### Step 5: Update Frontend Configuration

In your React application, update the `FLASK_API_URL` in `TakeAttendance.tsx` to point to your deployed Flask backend.

## Troubleshooting

- If you encounter memory errors, consider upgrading your Cloud Functions plan or using a higher-tier server for Flask
- For debugging, check logs in the Firebase Console or your Flask server logs
- Ensure your Firestore has "embeddings" collection with student embeddings
- Make sure your storage/CORS permissions allow access from your frontend

## Next Steps

1. Set up regular embedding updates for students
2. Implement a dashboard to view attendance reports
3. Add notifications when attendance is marked
