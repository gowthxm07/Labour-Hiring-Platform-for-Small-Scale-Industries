import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

// 1. Send a Notification
export async function sendNotification(toUserId, title, message) {
  try {
    if (!toUserId) return;
    await addDoc(collection(db, "notifications"), {
      toUserId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// 2. Get Notifications for a User (Ordered by newest first)
export async function getUserNotifications(userId) {
  const q = query(
    collection(db, "notifications"), 
    where("toUserId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
}

// 3. Mark Notification as Read
export async function markNotificationAsRead(notificationId) {
  const notifRef = doc(db, "notifications", notificationId);
  await updateDoc(notifRef, { isRead: true });
}

// 4. Get Unread Count
export async function getUnreadCount(userId) {
  const q = query(
    collection(db, "notifications"), 
    where("toUserId", "==", userId),
    where("isRead", "==", false)
  );
  const snap = await getDocs(q);
  return snap.size;
}