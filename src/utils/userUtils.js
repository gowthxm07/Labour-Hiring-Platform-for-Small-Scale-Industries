import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// 1. Get User Role (Worker or Owner)
export async function getUserRole(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().role : null;
}

// 2. Get User Phone (Used for displaying contact info)
export async function getUserPhone(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().phone : null;
}

// 3. Create Base User Profile (Sets Role)
export async function createUserProfile(uid, role) {
  const userRef = doc(db, "users", uid);
  // We use merge: true to avoid overwriting phone/email data from Login
  await setDoc(userRef, { role, uid }, { merge: true });
}

// 4. Save/Update Worker Profile (The missing function)
export async function saveWorkerProfile(uid, profileData) {
  const workerRef = doc(db, "workers", uid);
  await setDoc(workerRef, profileData, { merge: true });
}

// 5. Save/Update Owner Profile (The missing function)
export async function saveOwnerProfile(uid, profileData) {
  const ownerRef = doc(db, "owners", uid);
  await setDoc(ownerRef, profileData, { merge: true });
}

// 6. Get Worker Profile Data
export async function getWorkerProfile(uid) {
  const docRef = doc(db, "workers", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// 7. Get Owner Profile Data
export async function getOwnerProfile(uid) {
  const docRef = doc(db, "owners", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}