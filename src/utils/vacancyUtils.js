import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase";

// Helper: Check if 48 hours have passed
const isExpired = (lastUpdated) => {
  if (!lastUpdated) return false;
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffTime = Math.abs(now - updated);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60)); 
  return diffHours >= 48;
};

// 1. Post a new Job
export async function createVacancy(ownerId, vacancyData) {
  const data = {
    ...vacancyData,
    ownerId: ownerId,
    createdAt: new Date().toISOString(),
    status: "active", 
    statusUpdatedAt: new Date().toISOString(), // Track when status changed
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

// 3. Toggle Job Status (Active <-> Inactive)
export async function toggleVacancyStatus(vacancyId, newStatus) {
  const jobRef = doc(db, "vacancies", vacancyId);
  await updateDoc(jobRef, {
    status: newStatus,
    statusUpdatedAt: new Date().toISOString()
  });
}

// 4. Get Jobs posted by Owner (With Auto-Cleanup Logic)
export async function getOwnerVacancies(ownerId) {
  const q = query(
    collection(db, "vacancies"), 
    where("ownerId", "==", ownerId)
  );
  
  const querySnapshot = await getDocs(q);
  const validJobs = [];

  for (const document of querySnapshot.docs) {
    const job = { id: document.id, ...document.data() };
    
    // CHECK: Is it Inactive AND older than 48 hours?
    if (job.status === "inactive" && isExpired(job.statusUpdatedAt)) {
       // Delete it silently
       await deleteDoc(document.ref);
       console.log(`Auto-deleted expired job: ${job.jobTitle}`);
    } else {
       validJobs.push(job);
    }
  }

  return validJobs;
}

// 5. Get ALL Active Vacancies (For Workers)
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

// 6. Submit Interest
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

// 7. Get Applied Job IDs
export async function getWorkerApplications(workerId) {
  const q = query(
    collection(db, "interests"), 
    where("workerId", "==", workerId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().vacancyId);
}

// 8. Withdraw Interest
export async function withdrawInterest(workerId, vacancyId) {
  const q = query(
    collection(db, "interests"), 
    where("workerId", "==", workerId),
    where("vacancyId", "==", vacancyId)
  );
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// 9. Get Applications for a Job
export async function getJobApplications(vacancyId) {
  const q = query(
    collection(db, "interests"), 
    where("vacancyId", "==", vacancyId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 10. Update Application Status
export async function updateApplicationStatus(interestId, newStatus) {
  const ref = doc(db, "interests", interestId);
  await updateDoc(ref, { status: newStatus });
}

// 11. Get Detailed Worker Applications
export async function getWorkerApplicationDetails(workerId) {
  const q = query(collection(db, "interests"), where("workerId", "==", workerId));
  const querySnapshot = await getDocs(q);
  
  const applications = await Promise.all(querySnapshot.docs.map(async (interestDoc) => {
    const interest = interestDoc.data();
    
    // Handle case where job might have been deleted
    const vacancyRef = doc(db, "vacancies", interest.vacancyId);
    const vacancySnap = await getDoc(vacancyRef);
    const vacancyData = vacancySnap.exists() ? vacancySnap.data() : { jobTitle: "Job Closed/Expired", location: "-", salary: "-" };

    const ownerRef = doc(db, "owners", interest.ownerId);
    const ownerSnap = await getDoc(ownerRef);
    const ownerData = ownerSnap.exists() ? ownerSnap.data() : { companyName: "Unknown Company" };

    let ownerPhone = null;
    if (interest.status === "accepted") {
        const userRef = doc(db, "users", interest.ownerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) ownerPhone = userSnap.data().phone;
    }

    return {
      id: interestDoc.id,
      status: interest.status,
      appliedAt: interest.createdAt,
      jobTitle: vacancyData.jobTitle,
      location: vacancyData.location,
      salary: vacancyData.salary,
      companyName: ownerData.companyName,
      ownerPhone: ownerPhone,
      vacancyId: interest.vacancyId
    };
  }));

  return applications;
}

// 12. Update Vacancy Worker Count (RESTORED)
export async function updateVacancyCounts(vacancyId, change) {
  const vacancyRef = doc(db, "vacancies", vacancyId);
  const vacancySnap = await getDoc(vacancyRef);

  if (vacancySnap.exists()) {
    const currentCount = Number(vacancySnap.data().workerCount) || 0;
    const currentFilled = Number(vacancySnap.data().filledCount) || 0;
    
    const newWorkerCount = currentCount + change;
    const newFilledCount = currentFilled - change;

    await updateDoc(vacancyRef, {
      workerCount: newWorkerCount,
      filledCount: newFilledCount
    });
  }
}