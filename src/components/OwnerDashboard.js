import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getOwnerProfile } from "../utils/userUtils";
import { getOwnerVacancies, toggleVacancyStatus, renewVacancy } from "../utils/vacancyUtils"; // <--- Import Renew
import { shareJobOnWhatsApp } from "../utils/whatsappUtils";
import OwnerProfileForm from "./OwnerProfileForm";
import CreateVacancyForm from "./CreateVacancyForm";
import ApplicantsModal from "./ApplicantsModal"; 
import NotificationBell from "./NotificationBell";
import ProfileModal from "./ProfileModal"; 

export default function OwnerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vacancies, setVacancies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // --- NEW: TAB STATE ---
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'expired'

  const fetchProfile = async () => {
    if (currentUser) {
      const data = await getOwnerProfile(currentUser.uid);
      if (data) {
        setProfile({ ...data, uid: currentUser.uid });
      } else {
        setProfile(null);
      }
      
      if (data && data.profileCompleted) {
        fetchVacancies();
      } else {
        setLoading(false);
      }
    }
  };

  const fetchVacancies = async () => {
    const jobs = await getOwnerVacancies(currentUser.uid);
    // Sort jobs: Active/Newest first
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setVacancies(jobs);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [currentUser]);

  const handleToggleStatus = async (job) => {
    if (job.status === "active") {
        if (!window.confirm("Pause this job? Workers won't see it until you reactivate.")) return;
        await toggleVacancyStatus(job.id, "inactive");
    } else {
        await toggleVacancyStatus(job.id, "active");
    }
    fetchVacancies(); 
  };

  // --- NEW: RENEW HANDLER ---
  const handleRenew = async (job) => {
    if (!window.confirm("Renew this job for another 30 days? This will move it to the top of the list.")) return;
    await renewVacancy(job.id);
    alert("Job renewed successfully!");
    fetchVacancies();
  };

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

  // --- FILTER JOBS BASED ON TABS ---
  const displayVacancies = vacancies.filter(job => {
    if (activeTab === "active") {
        return !job.isExpired && job.status !== "archived";
    } else {
        return job.isExpired;
    }
  });

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
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">LabourLink Business</h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div onClick={() => setShowProfile(true)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <img src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.ownerName} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-300"/>
                  <span className="text-gray-600 hidden sm:block font-medium text-sm">{profile.ownerName}</span>
              </div>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img 
                src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.ownerName + "&background=random"} 
                alt="Profile"
                className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover"
            />
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{profile.companyName}</h2>
                <p className="text-gray-500">Manage your hiring and vacancies here.</p>
            </div>
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
            <CreateVacancyForm onSuccess={handleFormSuccess} onCancel={handleFormClose} editingJob={editingJob} />
          </div>
        ) : (
          <>
            {/* --- OWNER TABS --- */}
            <div className="flex space-x-6 border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab("active")} className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "active" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                    Active Jobs
                </button>
                <button onClick={() => setActiveTab("expired")} className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "expired" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                    Expired / Old
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayVacancies.length === 0 ? (
                <div className="col-span-full bg-white p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p>No {activeTab} jobs found.</p>
                </div>
                ) : (
                displayVacancies.map((job) => (
                    <div key={job.id} className={`bg-white p-5 rounded-lg shadow border-l-4 relative flex flex-col h-full ${job.isExpired ? "border-red-300 opacity-75" : job.status === "active" ? "border-blue-500" : "border-gray-400 bg-gray-50"}`}>
                    
                    {/* EDIT BUTTON (Only for Active) */}
                    {!job.isExpired && (
                        <button onClick={() => handleEditClick(job)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600" title="Edit Job">✏️</button>
                    )}

                    <h3 className="text-lg font-bold text-gray-800 pr-8 flex items-center gap-2">
                        {job.jobTitle}
                        <button onClick={() => shareJobOnWhatsApp(job)} className="text-green-500 hover:text-green-600" title="Share on WhatsApp">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.575 1.933.889 3.19.891l.005-.001c3.181 0 5.767-2.587 5.767-5.766.001-3.185-2.575-5.771-5.765-5.771zm7.418 5.767c0 4.062-3.326 7.388-7.418 7.388-.005 0-.009 0-.014 0-.004 0-.009 0-.014 0-2.51.002-3.886-.921-4.542-1.396l-3.076.81 1.054-3.834c-1.406-2.126-1.373-5.266 1.418-7.397 2.317-1.859 5.86-1.874 8.196.403 1.942 1.895 1.944 4.025 1.944 4.026z"/></svg>
                        </button>
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-2">{job.location}</p>
                    
                    {/* EXPIRED BANNER */}
                    {job.isExpired && (
                        <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded w-fit mb-2">⚠ EXPIRED</div>
                    )}

                    <div className="flex justify-between items-center text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded mb-3"><span>👥 Needs: {job.workerCount}</span><span className="text-green-600">₹{job.salary}</span></div>
                    <div className="flex gap-2 mb-3 text-xs">
                        {job.accommodation && job.accommodation !== "None" && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">🏠 {job.accommodation} Room</span>}
                        {job.water && job.water !== "None" && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">💧 {job.water} Water</span>}
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{job.description}</p>
                    
                    <div className="border-t pt-3 mt-auto">
                        
                        {/* BUTTONS LOGIC */}
                        {job.isExpired ? (
                            <button 
                                onClick={() => handleRenew(job)}
                                className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 shadow-sm"
                            >
                                ↻ Renew (30 Days)
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setViewingApplicantsFor(job)} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded font-medium hover:bg-indigo-100 border border-indigo-200 mb-3">View Applicants</button>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <button onClick={() => handleToggleStatus(job)} className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${job.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>{job.status === "active" ? "🟢 Active" : "⚫ Paused"}</button>
                                </div>
                            </>
                        )}

                    </div>
                    </div>
                ))
                )}
            </div>
          </>
        )}

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

      {showProfile && profile && <ProfileModal user={profile} role="owner" onClose={() => setShowProfile(false)} onUpdate={fetchProfile} />}
    </div>
  );
}