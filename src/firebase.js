// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBP6m3Ha9hIL590hfZQyL9G8zkJDdPw3to",
  authDomain: "labour-platform-app.firebaseapp.com",
  projectId: "labour-platform-app",
  storageBucket: "labour-platform-app.firebasestorage.app",
  messagingSenderId: "757591343376",
  appId: "1:757591343376:web:cf4006b45bb3d757146595",
  measurementId: "G-SHXR4R1TD7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services so we can use them in other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);