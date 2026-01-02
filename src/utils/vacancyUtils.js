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
import { sendNotification } from "./notificationUtils";

// --- HELPER: CHECK IF JOB IS OLDER THAN 30 DAYS ---
const isJobExpired = (createdAt) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 30; // Expire after 30 days
};

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

// 3. Toggle Job Status (Active <-> Inactive)
export async function toggleVacancyStatus(vacancyId, newStatus) {
  const jobRef = doc(db, "vacancies", vacancyId);
  await updateDoc(jobRef, { status: newStatus });
}

// 4. NEW: RENEW VACANCY (Resets date to today)
export async function renewVacancy(vacancyId) {
  const jobRef = doc(db, "vacancies", vacancyId);
  await updateDoc(jobRef, {
    createdAt: new Date().toISOString(), // Reset clock
    status: "active" // Ensure it's active
  });
}

// 5. Get Jobs posted by Owner (Returns all, marked if expired)
export async function getOwnerVacancies(ownerId) {
  const q = query(collection(db, "vacancies"), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Calculate if expired dynamically
    const expired = isJobExpired(data.createdAt);
    return { id: doc.id, ...data, isExpired: expired };
  });
}

// 6. Get ALL Active Vacancies (Filtered for Workers)
export async function getAllActiveVacancies() {
  const q = query(collection(db, "vacancies"), where("status", "==", "active"));
  const querySnapshot = await getDocs(q);
  
  // Filter out expired jobs on the client side
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(job => !isJobExpired(job.createdAt));
}

// 7. Submit Interest
export async function submitInterest(workerId, vacancyId, ownerId, workerName, jobTitle) {
  const interestData = {
    workerId, vacancyId, ownerId, workerName,
    status: "pending", 
    createdAt: new Date().toISOString()
  };
  await addDoc(collection(db, "interests"), interestData);
  await sendNotification(ownerId, "New Job Application", `${workerName} has applied for your position: ${jobTitle}`);
}

// 8. Get Applied Job IDs
export async function getWorkerApplications(workerId) {
  const q = query(collection(db, "interests"), where("workerId", "==", workerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().vacancyId);
}

// 9. Withdraw Interest
export async function withdrawInterest(workerId, vacancyId) {
  const q = query(collection(db, "interests"), where("workerId", "==", workerId), where("vacancyId", "==", vacancyId));
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// 10. Get Applications for a Job
export async function getJobApplications(vacancyId) {
  const q = query(collection(db, "interests"), where("vacancyId", "==", vacancyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 11. Update Application Status
export async function updateApplicationStatus(interestId, newStatus) {
  const ref = doc(db, "interests", interestId);
  await updateDoc(ref, { status: newStatus });
}

// 12. Get Detailed Worker Applications
export async function getWorkerApplicationDetails(workerId) {
  const q = query(collection(db, "interests"), where("workerId", "==", workerId));
  const querySnapshot = await getDocs(q);
  
  const applications = await Promise.all(querySnapshot.docs.map(async (interestDoc) => {
    const interest = interestDoc.data();
    
    const vacancyRef = doc(db, "vacancies", interest.vacancyId);
    const vacancySnap = await getDoc(vacancyRef);
    const vacancyData = vacancySnap.exists() ? vacancySnap.data() : { jobTitle: "Job Closed", location: "-", salary: "-" };

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
      vacancyId: interest.vacancyId,
      ownerId: interest.ownerId 
    };
  }));

  return applications;
}

// 13. Update Vacancy Worker Count
export async function updateVacancyCounts(vacancyId, change) {
  const vacancyRef = doc(db, "vacancies", vacancyId);
  const vacancySnap = await getDoc(vacancyRef);

  if (vacancySnap.exists()) {
    const currentCount = Number(vacancySnap.data().workerCount) || 0;
    const currentFilled = Number(vacancySnap.data().filledCount) || 0;
    await updateDoc(vacancyRef, {
      workerCount: currentCount + change,
      filledCount: currentFilled - change
    });
  }
}

// 14. Save a Job
export async function saveJob(workerId, vacancyId) {
  try {
    const data = { workerId, vacancyId, savedAt: new Date().toISOString() };
    await addDoc(collection(db, "savedJobs"), data);
  } catch (error) { console.error("Error saving job:", error); }
}

// 15. Unsave a Job
export async function unsaveJob(workerId, vacancyId) {
  try {
    const q = query(collection(db, "savedJobs"), where("workerId", "==", workerId), where("vacancyId", "==", vacancyId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) { console.error("Error unsaving job:", error); }
}

// 16. Get Saved IDs
export async function getSavedJobIds(workerId) {
  const q = query(collection(db, "savedJobs"), where("workerId", "==", workerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().vacancyId);
}

// 17. Get Saved Details
export async function getSavedJobsDetails(workerId) {
  const savedIds = await getSavedJobIds(workerId);
  if (savedIds.length === 0) return [];
  const jobs = [];
  for (const id of savedIds) {
    const docRef = doc(db, "vacancies", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().status === 'active' && !isJobExpired(docSnap.data().createdAt)) {
      jobs.push({ id: docSnap.id, ...docSnap.data() });
    }
  }
  return jobs;
}