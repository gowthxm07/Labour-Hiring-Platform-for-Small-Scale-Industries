import React, { useEffect, useState } from "react";
import { getJobApplications, updateApplicationStatus, updateVacancyCounts } from "../utils/vacancyUtils";
import { getWorkerProfile, getUserPhone } from "../utils/userUtils";

export default function ApplicantsModal({ vacancy, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load applications
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

  // Handle Accept/Reject with Count Logic
  const handleStatusChange = async (appId, newStatus, workerId, currentStatus) => {
    if (newStatus === "rejected" && !window.confirm("Are you sure you want to reject/revoke this worker?")) {
        return;
    }

    setLoading(true);

    // 1. Update Application Status in DB
    await updateApplicationStatus(appId, newStatus);

    // 2. Calculate Count Change
    let countChange = 0;

    // Case A: HIRING (Going from Pending/Rejected -> Accepted)
    if (newStatus === "accepted" && currentStatus !== "accepted") {
        console.log("Hiring Worker: Decreasing Count");
        countChange = -1; // Decrease needed count
    }
    
    // Case B: FIRING/REVOKING (Going from Accepted -> Rejected)
    if (currentStatus === "accepted" && newStatus === "rejected") {
        console.log("Revoking Worker: Increasing Count");
        countChange = 1; // Increase needed count
    }

    // 3. Update Vacancy Count in DB if needed
    if (countChange !== 0) {
        await updateVacancyCounts(vacancy.id, countChange);
    }
    
    // 4. Fetch Phone if Accepted
    let phone = null;
    if (newStatus === "accepted") {
        phone = await getUserPhone(workerId);
    }

    // 5. Update Local UI State
    setApplications(prev => prev.map(app => {
        if (app.id === appId) {
            return { 
                ...app, 
                status: newStatus, 
                workerPhone: phone 
            };
        }
        return app;
    }));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Applicants</h3>
            <p className="text-sm text-gray-500">For: {vacancy.jobTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {/* List */}
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading details...</p>
          ) : applications.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No applications received yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 bg-white shadow-sm">
                  
                  {/* Worker Details */}
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">
                      {app.workerProfile?.name || "Unknown Worker"} 
                      <span className="text-sm font-normal text-gray-500 ml-2">({app.workerProfile?.age} yrs)</span>
                    </h4>
                    <p className="text-sm text-gray-600">📍 {app.workerProfile?.district}, {app.workerProfile?.state}</p>
                    <p className="text-sm text-gray-600">🛠 {app.workerProfile?.skills?.join(", ")}</p>
                    
                    <div className="mt-2">
                        {app.status === "accepted" ? (
                            <div className="bg-green-50 text-green-800 px-3 py-1 rounded inline-block font-bold border border-green-200">
                                📞 {app.workerPhone || "Loading..."}
                            </div>
                        ) : (
                            <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded inline-block text-sm">
                                🔒 Contact Locked
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                    
                    {/* CASE 1: PENDING */}
                    {app.status === "pending" && (
                        <>
                            <button 
                                onClick={() => handleStatusChange(app.id, "accepted", app.workerId, app.status)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm font-medium"
                            >
                                ✅ Accept
                            </button>
                            <button 
                                onClick={() => handleStatusChange(app.id, "rejected", app.workerId, app.status)}
                                className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-sm hover:bg-red-100 font-medium"
                            >
                                ❌ Reject
                            </button>
                        </>
                    )}
                    
                    {/* CASE 2: ACCEPTED */}
                    {app.status === "accepted" && (
                        <div className="flex flex-col gap-2">
                            <span className="text-center text-green-600 font-bold text-sm border border-green-200 bg-green-50 rounded py-1">
                                Accepted
                            </span>
                            <button 
                                onClick={() => handleStatusChange(app.id, "rejected", app.workerId, app.status)}
                                className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                            >
                                ↩ Revoke
                            </button>
                        </div>
                    )}

                    {/* CASE 3: REJECTED */}
                    {app.status === "rejected" && (
                         <div className="flex flex-col gap-2">
                            <span className="text-center text-red-500 font-bold text-sm bg-red-50 rounded py-1 border border-red-100">
                                Rejected
                            </span>
                            <button 
                                onClick={() => handleStatusChange(app.id, "accepted", app.workerId, app.status)}
                                className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                ↺ Re-Accept
                            </button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}