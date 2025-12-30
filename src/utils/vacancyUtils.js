// src/utils/vacancyUtils.js
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore";
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
  const q = query(
    collection(db, "vacancies"), 
    where("ownerId", "==", ownerId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
}

// ... existing imports and functions ...

// 4. Get ALL Active Vacancies (For Workers)
export async function getAllActiveVacancies() {
  const q = query(
    collection(db, "vacancies"), 
    where("status", "==", "active")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
}