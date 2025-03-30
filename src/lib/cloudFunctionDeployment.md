
# Deploying Your Face Recognition Cloud Function

This guide explains how to deploy your face recognition model as a Firebase Cloud Function.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project with Firestore and Storage set up
3. Python 3.7+ installed on your development machine

## Step 1: Initialize Firebase Cloud Functions

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory (select Functions)
firebase init functions

# When prompted, choose Python as your language
```

## Step 2: Set Up Your Python Environment

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

## Step 3: Copy Your Cloud Function Code

Copy the `cloudFunction.py` code from this project into your `main.py` file in the functions directory.

## Step 4: Deploy Your Cloud Function

```bash
firebase deploy --only functions
```

## Step 5: Set Up Firestore Trigger

Your function is triggered when new documents are created in the "attendance_requests" collection. Make sure your database has this collection with proper security rules.

## Step 6: Configure Environment Variables

Set your Firebase storage bucket name as an environment variable:

```bash
firebase functions:config:set firebase.storage_bucket="your-project-id.appspot.com"
```

## Step 7: Test Your Function

Upload an image through the app's interface. The cloud function will:
1. Download the image from Firebase Storage
2. Detect faces using InsightFace
3. Compare detected faces with stored embeddings using FAISS
4. Mark attendance for recognized students
5. Update the request document with results

## Troubleshooting

- If you encounter memory errors, consider upgrading your Cloud Functions plan
- For debugging, check Firebase Functions logs in the Firebase Console
- Ensure your Firestore has "embeddings" collection with student embeddings
- Make sure your storage permissions allow the function to access images

## Next Steps

1. Set up regular embedding updates for students
2. Implement a dashboard to view attendance reports
3. Add notifications when attendance is marked

