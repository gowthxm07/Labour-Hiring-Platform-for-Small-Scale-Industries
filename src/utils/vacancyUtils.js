// src/utils/vacancyUtils.js
import { collection, addDoc, deleteDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// 1. Post a new Job
export async function createVacancy(ownerId, vacancyData) {
  const data = {
    ...vacancyData,
    ownerId: ownerId,
    createdAt: new Date().toISOString(),
    status: "active", 
    filledCount: 0,
    applicants: [] 
  };
  const docRef = await addDoc(collection(db, "vacancies"), data);
  return docRef.id;
}

// 2. Update an existing Job
export async function updateVacancy(vacancyId, updatedData) {
  const jobRef = doc(db, "vacancies", vacancyId);
  await updateDoc(jobRef, updatedData);
}

// 3. Get Jobs posted by a specific Owner
export async function getOwnerVacancies(ownerId) {
  const q = query(collection(db, "vacancies"), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 4. Get ALL Active Vacancies (For Workers)
export async function getAllActiveVacancies() {
  const q = query(collection(db, "vacancies"), where("status", "==", "active"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 5. Submit Interest (Worker applies for job)
export async function submitInterest(workerId, vacancyId, ownerId, workerName) {
  const interestData = {
    workerId,
    vacancyId,
    ownerId,
    workerName,
    status: "pending", 
    createdAt: new Date().toISOString()
  };
  await addDoc(collection(db, "interests"), interestData);
}

// 6. Get Jobs the worker has ALREADY applied for
export async function getWorkerApplications(workerId) {
  const q = query(collection(db, "interests"), where("workerId", "==", workerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().vacancyId);
}

// 7. Withdraw Interest (Worker cancels application) - NEW FEATURE
export async function withdrawInterest(workerId, vacancyId) {
  // Find the specific interest document to delete
  const q = query(
    collection(db, "interests"), 
    where("workerId", "==", workerId),
    where("vacancyId", "==", vacancyId)
  );
  
  const querySnapshot = await getDocs(q);
  
  // Delete the document(s) found
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}