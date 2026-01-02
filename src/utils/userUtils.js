import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy // <--- Moved to top (Fixed)
} from "firebase/firestore";
import { db } from "../firebase";

// 1. Get User Role
export async function getUserRole(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().role : null;
}

// 2. Get User Phone
export async function getUserPhone(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().phone : null;
}

// 3. Create Base User Profile
export async function createUserProfile(uid, role) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { role, uid }, { merge: true });
}

// 4. Save/Update Worker Profile
export async function saveWorkerProfile(uid, profileData) {
  const workerRef = doc(db, "workers", uid);
  await setDoc(workerRef, profileData, { merge: true });
}

// 5. Save/Update Owner Profile
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

// 8. Submit a Review
export async function submitReview(fromId, toId, rating, comment, role) {
  await addDoc(collection(db, "reviews"), {
    fromId,
    toId,
    rating, // Number 1-5
    comment,
    role, // 'worker' or 'owner' (who is being rated)
    createdAt: new Date().toISOString()
  });
}

// 9. Get Average Rating for a User
export async function getUserRating(userId) {
  const q = query(
    collection(db, "reviews"), 
    where("toId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return 0;

  const total = querySnapshot.docs.reduce((acc, doc) => acc + doc.data().rating, 0);
  return (total / querySnapshot.size).toFixed(1);
}

// 10. Check if already rated
export async function hasUserRated(fromId, toId) {
  const q = query(
    collection(db, "reviews"), 
    where("fromId", "==", fromId),
    where("toId", "==", toId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// 11. Get All Reviews for a User (Public Profile Feature)
export async function getUserReviews(userId) {
  const q = query(
    collection(db, "reviews"), 
    where("toId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ... existing imports ...

// 12. Report a User
export async function reportUser(fromId, toId, reason, reportedName) {
  await addDoc(collection(db, "reports"), {
    fromId,
    toId,
    reportedName, // Name of the bad actor
    reason,
    status: "open", // open, resolved, ignored
    createdAt: new Date().toISOString()
  });
}