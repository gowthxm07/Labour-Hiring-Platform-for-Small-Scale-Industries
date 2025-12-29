// src/utils/userUtils.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// Check if user exists and return their role
export async function getUserRole(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().role; // Returns "worker" or "owner"
  } else {
    return null; // User is new
  }
}

// Create the initial user profile
export async function createUserProfile(uid, phoneNumber, role) {
  const userRef = doc(db, "users", uid);
  
  // Basic data common to both roles
  const userData = {
    uid: uid,
    phone: phoneNumber,
    role: role,
    status: "pending", // Verify later
    createdAt: new Date().toISOString()
  };

  await setDoc(userRef, userData);

  // Also create a placeholder in the specific collection
  if (role === "worker") {
    await setDoc(doc(db, "workers", uid), { verified: false });
  } else if (role === "owner") {
    await setDoc(doc(db, "owners", uid), { verified: false });
  }
}