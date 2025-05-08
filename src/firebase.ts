import { initializeApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDsRZKRnkM6LH0lHQb1QmdQDjRtA_5vw5c",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "face-detection-452311.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "face-detection-452311",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "face-detection-452311.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "432404957310",
  appId: process.env.FIREBASE_APP_ID || "1:432404957310:web:5e9b9f9c9f9f9f9c9f9f9c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
