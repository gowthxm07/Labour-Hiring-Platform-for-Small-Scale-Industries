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
// ... existing code ...

// Fetch Worker Profile
export async function getWorkerProfile(uid) {
  const docRef = doc(db, "workers", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// Update Worker Profile
export async function updateWorkerProfile(uid, data) {
  const workerRef = doc(db, "workers", uid);
  // We use { merge: true } so we don't overwrite existing fields like 'verified'
  await setDoc(workerRef, data, { merge: true });
}

// ... existing code ...

// Fetch Owner Profile
export async function getOwnerProfile(uid) {
  const docRef = doc(db, "owners", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// Update Owner Profile
export async function updateOwnerProfile(uid, data) {
  const ownerRef = doc(db, "owners", uid);
  await setDoc(ownerRef, data, { merge: true });
}

// ... existing code ...

// Get User Phone (For revealing contact info)
export async function getUserPhone(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().phone : null;
}