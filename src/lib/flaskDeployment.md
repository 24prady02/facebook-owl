
# Deploying the Flask Backend for Face Recognition

This guide explains how to deploy your Flask backend server for the face recognition application.

## Prerequisites

1. Python 3.7+ installed
2. pip (Python package manager)
3. Firebase service account key (downloaded from Firebase Console)
4. A server or cloud platform to host your Flask application

## Step 1: Install Required Packages

Create a requirements.txt file with the following dependencies:

```
flask==2.0.1
flask-cors==3.0.10
firebase-admin==6.2.0
opencv-python-headless==4.8.0.74
numpy==1.24.3
insightface==0.7.3
faiss-cpu==1.7.4
pandas==2.0.3
gunicorn==20.1.0
```

Install the packages:
```bash
pip install -r requirements.txt
```

## Step 2: Set Up Firebase Authentication

Place your Firebase service account key file (downloaded from Firebase Console) in the same directory as your Flask server and name it `serviceAccountKey.json`.

If deploying to a cloud provider, make sure to set up the appropriate credentials:
- For Google Cloud Run or App Engine, you can use the default credentials
- For other providers, securely add the service account key to your environment

## Step 3: Configure Collection Naming

The updated backend automatically generates collection names based on class and time slot:
```
[ClassNameWithoutSpaces]_[TimeSlotWithoutSpaces]_embeddings
[ClassNameWithoutSpaces]_[TimeSlotWithoutSpaces]_attendance
```

For example, "Math 101" class with "Morning" slot will use:
- Math101_Morning_embeddings
- Math101_Morning_attendance

Ensure your Firestore database has the appropriate collections with student embeddings.

## Step 4: Deploy the Flask App

### Local Development

To run the server locally for testing:
```bash
python flaskServer.py
```

The server will start at `http://localhost:5000`

### Production Deployment Options

#### Option 1: Google Cloud Run

1. Create a Dockerfile:
```
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flaskServer.py .
COPY serviceAccountKey.json .

ENV PYTHONUNBUFFERED True

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 flaskServer:app
```

2. Build and deploy:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/face-recognition-api
gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/face-recognition-api --platform managed
```

#### Option 2: Heroku

1. Create a Procfile:
```
web: gunicorn flaskServer:app
```

2. Deploy using the Heroku CLI:
```bash
heroku create
git push heroku main
```

#### Option 3: Traditional VPS/Server

1. Set up a server with Python installed
2. Copy your Flask app and service account key
3. Install requirements
4. Set up a production WSGI server:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 flaskServer:app
```
5. Configure Nginx as a reverse proxy (recommended)

## Step 5: Update Frontend Configuration

In your React application, update the API endpoint in the environment configuration:

```
REACT_APP_FLASK_API_URL=https://your-deployed-flask-app-url
```

## API Endpoints

The updated Flask backend provides two main endpoints:

1. **POST /process-attendance**
   - Processes a classroom image to mark attendance
   - Parameters (form data):
     - `image`: The classroom photo file
     - `className`: Class name (e.g., "Math 101")
     - `timeSlot`: Time slot (e.g., "Morning")

2. **GET /export-attendance**
   - Exports attendance records to Excel
   - Parameters (query string):
     - `className`: Class name
     - `timeSlot`: Time slot

## Troubleshooting

- **Memory Issues**: InsightFace and FAISS can be memory-intensive. Ensure your server has sufficient RAM.
- **Collection Naming**: Check collection names are generated correctly according to the naming pattern.
- **Missing Dependencies**: Some packages may require additional system libraries. Install them on your server.
- **Excel Export Issues**: If pandas is causing problems, ensure you have openpyxl installed.

## Monitoring and Scaling

- Set up logging to monitor application performance and errors
- For high-traffic applications, consider implementing a queue system
- Scale your server resources according to the expected number of concurrent requests
