import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkerProfile } from "../utils/userUtils";
import { 
  getAllActiveVacancies, 
  submitInterest, 
  getWorkerApplications, 
  withdrawInterest, 
  getWorkerApplicationDetails,
  saveJob,       
  unsaveJob,     
  getSavedJobIds, 
  getSavedJobsDetails 
} from "../utils/vacancyUtils";
import { hasUserRated } from "../utils/userUtils";
import { openWhatsAppChat, shareJobOnWhatsApp } from "../utils/whatsappUtils";
import WorkerProfileForm from "./WorkerProfileForm";
import RateUserModal from "./RateUserModal";
import NotificationBell from "./NotificationBell"; 
import ProfileModal from "./ProfileModal";
import PublicProfileModal from "./PublicProfileModal"; 

export default function WorkerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vacancies, setVacancies] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]); 
  const [savedJobIds, setSavedJobIds] = useState([]); 
  const [savedJobsList, setSavedJobsList] = useState([]); 
  
  const [myApplications, setMyApplications] = useState([]); 
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("findJobs"); 
  const [ratingModal, setRatingModal] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [viewProfileId, setViewProfileId] = useState(null);

  // --- NEW: APPLICATION FILTER STATE ---
  const [appFilter, setAppFilter] = useState("All"); 

  const [filters, setFilters] = useState({
    keyword: "", location: "", minSalary: "", accommodation: "All", water: "All"
  });

  const fetchData = async () => {
    if (currentUser) {
      const userProfile = await getWorkerProfile(currentUser.uid);
      if (userProfile) {
        setProfile({ ...userProfile, uid: currentUser.uid });
      }
      if (userProfile && userProfile.profileCompleted) {
        const jobs = await getAllActiveVacancies();
        setVacancies(jobs);
        
        const appliedIds = await getWorkerApplications(currentUser.uid);
        setAppliedJobIds(appliedIds);

        const apps = await getWorkerApplicationDetails(currentUser.uid);
        setMyApplications(apps);

        const savedIds = await getSavedJobIds(currentUser.uid);
        setSavedJobIds(savedIds);
        
        if (activeTab === "saved") {
            const savedDetails = await getSavedJobsDetails(currentUser.uid);
            setSavedJobsList(savedDetails);
        }
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentUser, activeTab]); 

  const handleApply = async (job) => {
    if (!window.confirm(`Show interest in "${job.jobTitle}"?`)) return;
    setActionLoading(job.id);
    try {
      await submitInterest(currentUser.uid, job.id, job.ownerId, profile.name, job.jobTitle);
      setAppliedJobIds([...appliedJobIds, job.id]);
      fetchData(); 
    } catch (error) {
      console.error(error);
      alert("Failed to send interest.");
    }
    setActionLoading(null);
  };

  const handleWithdraw = async (vacancyId, jobTitle) => {
    if (!window.confirm(`Withdraw application for "${jobTitle}"?`)) return;
    setActionLoading(vacancyId);
    try {
      await withdrawInterest(currentUser.uid, vacancyId);
      setAppliedJobIds(appliedJobIds.filter(id => id !== vacancyId));
      fetchData(); 
    } catch (error) {
      console.error(error);
      alert("Failed to withdraw interest.");
    }
    setActionLoading(null);
  };

  const handleToggleSave = async (jobId) => {
    if (savedJobIds.includes(jobId)) {
        setSavedJobIds(prev => prev.filter(id => id !== jobId)); 
        await unsaveJob(currentUser.uid, jobId);
    } else {
        setSavedJobIds(prev => [...prev, jobId]); 
        await saveJob(currentUser.uid, jobId);
    }
    fetchData(); 
  };

  const handleRateOwner = async (ownerId, companyName) => {
    if(!ownerId) return;
    const alreadyRated = await hasUserRated(currentUser.uid, ownerId);
    if (alreadyRated) {
        alert("You have already rated this company.");
        return;
    }
    setRatingModal({ toId: ownerId, targetName: companyName });
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const clearFilters = () => setFilters({ keyword: "", location: "", minSalary: "", accommodation: "All", water: "All" });

  const filteredVacancies = vacancies.filter((job) => {
    if (filters.keyword && !job.jobTitle.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.minSalary && Number(job.salary) < Number(filters.minSalary)) return false;
    if (filters.accommodation !== "All" && job.accommodation !== filters.accommodation) return false;
    if (filters.water !== "All" && job.water !== filters.water) return false;
    return true;
  });

  // --- NEW: Filter Logic for Applications Tab ---
  const filteredApplications = myApplications.filter(app => {
    if (appFilter === "All") return true;
    return app.status === appFilter.toLowerCase();
  });

  const renderJobCard = (job) => {
    const isApplied = appliedJobIds.includes(job.id);
    const isSaved = savedJobIds.includes(job.id);
    const isLoading = actionLoading === job.id;

    return (
        <div key={job.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col relative group">
            <button 
                onClick={(e) => { e.stopPropagation(); handleToggleSave(job.id); }}
                className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                title={isSaved ? "Unsave Job" : "Save Job"}
            >
                {isSaved ? <span className="text-xl text-red-500">❤️</span> : <span className="text-xl text-gray-300 hover:text-red-400">🤍</span>}
            </button>

            <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-2 pr-10">
                <h3 className="text-lg font-bold text-gray-800 leading-tight">{job.jobTitle}</h3>
            </div>
            <div onClick={() => setViewProfileId(job.ownerId)} className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 cursor-pointer inline-flex items-center gap-1">🏭 View Company Profile</div>
            <p className="text-gray-500 text-sm mb-4">📍 {job.location}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-bold border border-green-100 whitespace-nowrap">₹{job.salary}</span>
                {job.accommodation !== "None" && <span className="text-xs px-2 py-1 rounded border bg-indigo-50 text-indigo-700 border-indigo-100">🏠 {job.accommodation}</span>}
                {job.water !== "None" && <span className="text-xs px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-100">💧 {job.water}</span>}
            </div>
            <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => shareJobOnWhatsApp(job)} className="text-green-500 hover:text-green-600 flex items-center gap-1 text-xs font-bold border border-green-200 px-2 py-1 rounded bg-green-50">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.575 1.933.889 3.19.891l.005-.001c3.181 0 5.767-2.587 5.767-5.766.001-3.185-2.575-5.771-5.765-5.771zm7.418 5.767c0 4.062-3.326 7.388-7.418 7.388-.005 0-.009 0-.014 0-.004 0-.009 0-.014 0-2.51.002-3.886-.921-4.542-1.396l-3.076.81 1.054-3.834c-1.406-2.126-1.373-5.266 1.418-7.397 2.317-1.859 5.86-1.874 8.196.403 1.942 1.895 1.944 4.025 1.944 4.026z"/></svg>Share
                </button>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3">{job.description}</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Wanted: {job.workerCount}</span>
            {isApplied ? (
                <button onClick={() => handleWithdraw(job.id, job.jobTitle)} disabled={isLoading} className="text-sm px-4 py-2 rounded-lg font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50">{isLoading ? "..." : "Withdraw"}</button>
            ) : (
                <button onClick={() => handleApply(job)} disabled={isLoading} className="text-sm px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-md">{isLoading ? "..." : "Show Interest"}</button>
            )}
            </div>
        </div>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!profile || !profile.profileCompleted) {
    return (
      <>
        <div className="absolute top-4 right-4"><button onClick={logout} className="text-red-500 underline">Logout</button></div>
        <WorkerProfileForm onProfileComplete={fetchData} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">🏭 LabourLink</h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div onClick={() => setShowProfile(true)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <img src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.name} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-300"/>
                  <span className="text-gray-600 hidden sm:block font-medium text-sm">{profile.name}</span>
              </div>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
         <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
                <img src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.name + "&background=random"} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white/50 object-cover"/>
                <div>
                    <h2 className="text-2xl font-bold">Welcome back, {profile.name} 👋</h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-blue-100 text-sm font-medium">
                        <span className="flex items-center gap-1">📍 {profile.district}, {profile.state}</span>
                        <span className="flex items-center gap-1">🛠 {profile.skills.join(", ")}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex space-x-6 border-b border-gray-200 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab("findJobs")} className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "findJobs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            🔍 Find Jobs
          </button>
          <button onClick={() => setActiveTab("saved")} className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "saved" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            ❤️ Saved ({savedJobIds.length})
          </button>
          <button onClick={() => setActiveTab("myApps")} className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "myApps" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            📂 My Applications ({myApplications.length})
          </button>
        </div>

        {activeTab === "findJobs" && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                    <div className="relative"><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Role</label><input type="text" name="keyword" placeholder="Search role..." value={filters.keyword} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"/></div>
                    <div className="relative"><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</label><input type="text" name="location" placeholder="City" value={filters.location} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"/></div>
                    <div className="relative"><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min Salary</label><input type="number" name="minSalary" placeholder="10000" value={filters.minSalary} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"/></div>
                    <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Room</label><select name="accommodation" value={filters.accommodation} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"><option value="All">Any</option><option value="Free">Free</option><option value="Paid">Paid</option></select></div>
                    <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Water</label><select name="water" value={filters.water} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"><option value="All">Any</option><option value="Free">Free</option><option value="Paid">Paid</option></select></div>
                </div>
                <div className="mt-4 flex justify-end"><button onClick={clearFilters} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">Clear Filters</button></div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVacancies.length === 0 ? (
                <div className="col-span-full bg-white p-12 text-center border-2 border-dashed border-gray-300 rounded-xl"><p className="text-gray-500">No jobs found.</p></div>
              ) : (
                filteredVacancies.map((job) => renderJobCard(job))
              )}
            </div>
          </>
        )}

        {activeTab === "saved" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {savedJobsList.length === 0 ? (
                <div className="col-span-full bg-white p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="text-4xl mb-4">❤️</div>
                    <p className="text-gray-500">You haven't saved any jobs yet.</p>
                </div>
             ) : (
                savedJobsList.map((job) => renderJobCard(job))
             )}
          </div>
        )}

        {activeTab === "myApps" && (
          <div className="space-y-4">
             {/* --- NEW FILTERS ROW --- */}
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {["All", "Pending", "Accepted", "Rejected"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setAppFilter(status)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                            appFilter === status 
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {status}
                    </button>
                ))}
             </div>

             {filteredApplications.length === 0 ? (
                <div className="bg-white p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="text-lg font-medium text-gray-900">No {appFilter !== "All" ? appFilter.toLowerCase() : ""} applications found</h3>
                </div>
             ) : (
                filteredApplications.map((app) => (
                    <div key={app.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{app.jobTitle}</h3>
                            <p onClick={() => setViewProfileId(app.ownerId)} className="text-blue-600 hover:underline font-medium cursor-pointer w-fit">{app.companyName}</p>
                            <p className="text-sm text-gray-500">📍 {app.location} • ₹{app.salary}/mo</p>
                            <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col items-center min-w-[150px] gap-2">
                            {app.status === "pending" && <span className="bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full text-sm font-bold border border-yellow-200">⏳ Pending</span>}
                            {app.status === "rejected" && <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-full text-sm font-bold border border-red-200">❌ Rejected</span>}
                            {app.status === "accepted" && (
                                <div className="text-center">
                                    <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 block mb-2">✅ Accepted!</span>
                                    <div className="flex gap-2 mb-2 w-full justify-center">
                                      <button onClick={() => openWhatsAppChat(app.ownerPhone, `Hello, I'm ${profile.name}. I saw your job posting for ${app.jobTitle}.`)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 flex items-center justify-center flex-1" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.575 1.933.889 3.19.891l.005-.001c3.181 0 5.767-2.587 5.767-5.766.001-3.185-2.575-5.771-5.765-5.771zm7.418 5.767c0 4.062-3.326 7.388-7.418 7.388-.005 0-.009 0-.014 0-.004 0-.009 0-.014 0-2.51.002-3.886-.921-4.542-1.396l-3.076.81 1.054-3.834c-1.406-2.126-1.373-5.266 1.418-7.397 2.317-1.859 5.86-1.874 8.196.403 1.942 1.895 1.944 4.025 1.944 4.026z"/></svg></button>
                                      <a href={`tel:${app.ownerPhone}`} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 flex items-center justify-center flex-1" title="Call Directly">📞</a>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{app.ownerPhone}</div>
                                    <button onClick={() => handleRateOwner(app.ownerId, app.companyName)} className="text-xs text-yellow-600 font-bold hover:underline">⭐ Rate Company</button>
                                </div>
                            )}
                        </div>
                        {app.status !== "rejected" && (
                            <button onClick={() => handleWithdraw(app.vacancyId, app.jobTitle)} className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-700 px-3 py-2 rounded-lg transition-colors shadow-sm">Withdraw</button>
                        )}
                    </div>
                ))
             )}
          </div>
        )}

      </div>

      {ratingModal && <RateUserModal fromId={currentUser.uid} toId={ratingModal.toId} targetName={ratingModal.targetName} userRole="worker" onClose={() => setRatingModal(null)} />}
      {showProfile && profile && <ProfileModal user={profile} role="worker" onClose={() => setShowProfile(false)} onUpdate={fetchData} />}
      {viewProfileId && <PublicProfileModal targetId={viewProfileId} targetRole="owner" onClose={() => setViewProfileId(null)} />}

    </div>
  );
}