import React, { useEffect, useState } from "react";
import { getJobApplications, updateApplicationStatus, updateVacancyCounts } from "../utils/vacancyUtils";
import { getWorkerProfile, getUserPhone, hasUserRated } from "../utils/userUtils";
import { useAuth } from "../contexts/AuthContext";
import { sendNotification } from "../utils/notificationUtils";
import { openWhatsAppChat } from "../utils/whatsappUtils"; 
import RateUserModal from "./RateUserModal";
import PublicProfileModal from "./PublicProfileModal"; // <--- ADDED

export default function ApplicantsModal({ vacancy, onClose }) {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [viewProfileId, setViewProfileId] = useState(null); // <--- ADDED

  useEffect(() => {
    async function fetchData() {
      try {
        const interests = await getJobApplications(vacancy.id);
        const detailedApps = await Promise.all(interests.map(async (app) => {
            const workerProfile = await getWorkerProfile(app.workerId);
            let phone = null;
            if (app.status === "accepted") {
                phone = await getUserPhone(app.workerId);
            }
            return {
                ...app,
                workerProfile,
                workerPhone: phone
            };
        }));
        setApplications(detailedApps);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    fetchData();
  }, [vacancy.id]);

  const handleStatusChange = async (appId, newStatus, workerId, currentStatus) => {
    // ... (Keep existing status change logic exact same) ...
    if (newStatus === "rejected" && !window.confirm("Are you sure you want to reject/revoke this worker?")) return;
    setLoading(true);
    await updateApplicationStatus(appId, newStatus);

    let countChange = 0;
    if (newStatus === "accepted" && currentStatus !== "accepted") countChange = -1; 
    if (currentStatus === "accepted" && newStatus === "rejected") countChange = 1; 
    if (countChange !== 0) await updateVacancyCounts(vacancy.id, countChange);

    if (newStatus === "accepted") {
        await sendNotification(workerId, "Application Accepted! 🎉", `Congratulations! You have been selected for the job: ${vacancy.jobTitle}. Check "My Applications" for contact details.`);
    }
    
    let phone = null;
    if (newStatus === "accepted") phone = await getUserPhone(workerId);

    setApplications(prev => prev.map(app => {
        if (app.id === appId) {
            return { ...app, status: newStatus, workerPhone: phone };
        }
        return app;
    }));
    setLoading(false);
  };

  const handleRateWorker = async (workerId, workerName) => {
    const alreadyRated = await hasUserRated(currentUser.uid, workerId);
    if (alreadyRated) {
        alert("You have already rated this worker.");
        return;
    }
    setRatingModal({ toId: workerId, targetName: workerName });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div><h3 className="text-xl font-bold text-gray-800">Applicants</h3><p className="text-sm text-gray-500">For: {vacancy.jobTitle}</p></div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading details...</p>
          ) : applications.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No applications received yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 bg-white shadow-sm">
                  <div>
                    {/* CLICKABLE WORKER NAME */}
                    <h4 
                        onClick={() => setViewProfileId(app.workerId)}
                        className="font-bold text-lg text-blue-600 hover:underline cursor-pointer flex items-center gap-2"
                    >
                        {app.workerProfile?.name || "Unknown"} 
                        <span className="text-sm font-normal text-gray-500 no-underline">({app.workerProfile?.age} yrs)</span>
                    </h4>

                    <p className="text-sm text-gray-600">📍 {app.workerProfile?.district}, {app.workerProfile?.state}</p>
                    <p className="text-sm text-gray-600">🛠 {app.workerProfile?.skills?.join(", ")}</p>
                    <div className="mt-2">
                        {app.status === "accepted" ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <button onClick={() => openWhatsAppChat(app.workerPhone, `Hello, we have accepted your application for ${vacancy.jobTitle}.`)} className="bg-green-500 text-white px-3 py-1.5 rounded font-bold hover:bg-green-600 flex items-center gap-1" title="Chat"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.575 1.933.889 3.19.891l.005-.001c3.181 0 5.767-2.587 5.767-5.766.001-3.185-2.575-5.771-5.765-5.771zm7.418 5.767c0 4.062-3.326 7.388-7.418 7.388-.005 0-.009 0-.014 0-.004 0-.009 0-.014 0-2.51.002-3.886-.921-4.542-1.396l-3.076.81 1.054-3.834c-1.406-2.126-1.373-5.266 1.418-7.397 2.317-1.859 5.86-1.874 8.196.403 1.942 1.895 1.944 4.025 1.944 4.026z"/></svg>Chat</button>
                                  <a href={`tel:${app.workerPhone}`} className="bg-blue-500 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-600 flex items-center gap-1" title="Call">📞 Call</a>
                                </div>
                                <div className="text-xs text-gray-500">Phone: {app.workerPhone}</div>
                            </div>
                        ) : (
                            <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded inline-block text-sm">🔒 Contact Locked</div>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                    {app.status === "pending" && (
                        <>
                            <button onClick={() => handleStatusChange(app.id, "accepted", app.workerId, app.status)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm font-medium">✅ Accept</button>
                            <button onClick={() => handleStatusChange(app.id, "rejected", app.workerId, app.status)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-sm hover:bg-red-100 font-medium">❌ Reject</button>
                        </>
                    )}
                    {app.status === "accepted" && (
                        <div className="flex flex-col gap-2">
                            <span className="text-center text-green-600 font-bold text-sm border border-green-200 bg-green-50 rounded py-1">Accepted</span>
                            <button onClick={() => handleRateWorker(app.workerId, app.workerProfile?.name)} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded hover:bg-yellow-100 transition-colors">⭐ Rate Worker</button>
                            <button onClick={() => handleStatusChange(app.id, "rejected", app.workerId, app.status)} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition-colors">↩ Revoke</button>
                        </div>
                    )}
                    {app.status === "rejected" && (
                         <div className="flex flex-col gap-2">
                            <span className="text-center text-red-500 font-bold text-sm bg-red-50 rounded py-1 border border-red-100">Rejected</span>
                            <button onClick={() => handleStatusChange(app.id, "accepted", app.workerId, app.status)} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors">↺ Re-Accept</button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {ratingModal && <RateUserModal fromId={currentUser.uid} toId={ratingModal.toId} targetName={ratingModal.targetName} userRole="owner" onClose={() => setRatingModal(null)} />}
      
      {/* PUBLIC PROFILE MODAL (READ ONLY) */}
      {viewProfileId && <PublicProfileModal targetId={viewProfileId} targetRole="worker" onClose={() => setViewProfileId(null)} />}
      
    </div>
  );
}