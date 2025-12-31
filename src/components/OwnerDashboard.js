import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getOwnerProfile } from "../utils/userUtils";
import { getOwnerVacancies, toggleVacancyStatus } from "../utils/vacancyUtils"; // Added toggleVacancyStatus
import OwnerProfileForm from "./OwnerProfileForm";
import CreateVacancyForm from "./CreateVacancyForm";
import ApplicantsModal from "./ApplicantsModal"; 

export default function OwnerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vacancies, setVacancies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);

  const fetchProfile = async () => {
    if (currentUser) {
      const data = await getOwnerProfile(currentUser.uid);
      setProfile(data);
      if (data && data.profileCompleted) {
        fetchVacancies();
      } else {
        setLoading(false);
      }
    }
  };

  const fetchVacancies = async () => {
    // This function now automatically cleans up expired jobs
    const jobs = await getOwnerVacancies(currentUser.uid);
    setVacancies(jobs);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [currentUser]);

  // --- NEW: Handle Status Toggle ---
  const handleToggleStatus = async (job) => {
    if (job.status === "active") {
        // Deactivating logic
        const confirmDeactivate = window.confirm(
            "⚠️ Make this job INACTIVE?\n\n" +
            "If you do not reactivate this job within 48 hours, it will be PERMANENTLY DELETED.\n\n" +
            "Click OK to stop hiring for this position."
        );
        if (!confirmDeactivate) return;
        
        await toggleVacancyStatus(job.id, "inactive");
    } else {
        // Reactivating logic
        await toggleVacancyStatus(job.id, "active");
    }
    fetchVacancies(); // Refresh UI
  };
  // --------------------------------

  const handleEditClick = (job) => {
    setEditingJob(job);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingJob(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchVacancies();
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!profile || !profile.profileCompleted) {
    return (
      <>
        <div className="absolute top-4 right-4">
          <button onClick={logout} className="text-red-500 underline">Logout</button>
        </div>
        <OwnerProfileForm onProfileComplete={fetchProfile} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">LabourLink Business</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 hidden sm:block">Welcome, {profile.ownerName}</span>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{profile.companyName}</h2>
            <p className="text-gray-500">Manage your hiring and vacancies here.</p>
          </div>
          
          {!showCreateForm && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-md flex items-center gap-2"
            >
              <span>+</span> Post New Job
            </button>
          )}
        </div>

        {showCreateForm ? (
          <div className="max-w-2xl">
            <CreateVacancyForm 
              onSuccess={handleFormSuccess} 
              onCancel={handleFormClose}
              editingJob={editingJob} 
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.length === 0 ? (
              <div className="col-span-full bg-white p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>You haven't posted any jobs yet.</p>
              </div>
            ) : (
              vacancies.map((job) => (
                <div key={job.id} className={`bg-white p-5 rounded-lg shadow border-l-4 relative flex flex-col h-full ${job.status === "active" ? "border-blue-500" : "border-red-500 bg-gray-50"}`}>
                  
                  <button 
                    onClick={() => handleEditClick(job)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
                    title="Edit Job"
                  >
                    ✏️
                  </button>

                  <h3 className="text-lg font-bold text-gray-800 pr-8">{job.jobTitle}</h3>
                  <p className="text-gray-600 text-sm mb-2">{job.location}</p>
                  
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded mb-3">
                    <span>👥 Needs: {job.workerCount}</span>
                    <span className="text-green-600">₹{job.salary}</span>
                  </div>

                  <div className="flex gap-2 mb-3 text-xs">
                    {job.accommodation && job.accommodation !== "None" && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        🏠 {job.accommodation} Room
                      </span>
                    )}
                    {job.water && job.water !== "None" && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        💧 {job.water} Water
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{job.description}</p>
                  
                  <div className="border-t pt-3 mt-auto">
                    <button 
                        onClick={() => setViewingApplicantsFor(job)}
                        className="w-full bg-indigo-50 text-indigo-700 py-2 rounded font-medium hover:bg-indigo-100 border border-indigo-200 mb-3"
                    >
                        View Applicants
                    </button>
                    
                    {/* STATUS TOGGLE BUTTON */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                        
                        <button
                            onClick={() => handleToggleStatus(job)}
                            className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                                job.status === "active" 
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                        >
                            {job.status === "active" ? "🟢 Active" : "🔴 Inactive (Expiring)"}
                        </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- MODAL SECTION --- */}
        {viewingApplicantsFor && (
            <ApplicantsModal 
                vacancy={viewingApplicantsFor} 
                onClose={() => {
                    setViewingApplicantsFor(null);
                    fetchVacancies();
                }} 
            />
        )}

      </div>
    </div>
  );
}