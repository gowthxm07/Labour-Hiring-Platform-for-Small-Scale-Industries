import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkerProfile } from "../utils/userUtils";
import { getAllActiveVacancies, submitInterest, getWorkerApplications, withdrawInterest } from "../utils/vacancyUtils";
import WorkerProfileForm from "./WorkerProfileForm";

export default function WorkerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vacancies, setVacancies] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]); 
  const [actionLoading, setActionLoading] = useState(null); // Track loading state for specific job ID

  // Fetch Data
  const fetchData = async () => {
    if (currentUser) {
      const userProfile = await getWorkerProfile(currentUser.uid);
      setProfile(userProfile);

      if (userProfile && userProfile.profileCompleted) {
        const jobs = await getAllActiveVacancies();
        setVacancies(jobs);
        const appliedIds = await getWorkerApplications(currentUser.uid);
        setAppliedJobIds(appliedIds);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentUser]);

  // Handle Apply
  const handleApply = async (job) => {
    if (!window.confirm(`Show interest in "${job.jobTitle}"? The owner will see your profile.`)) return;

    setActionLoading(job.id);
    try {
      await submitInterest(currentUser.uid, job.id, job.ownerId, profile.name);
      setAppliedJobIds([...appliedJobIds, job.id]); // Update local state
    } catch (error) {
      console.error(error);
      alert("Failed to send interest.");
    }
    setActionLoading(null);
  };

  // Handle Withdraw - NEW FEATURE
  const handleWithdraw = async (job) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${job.jobTitle}"?`)) return;

    setActionLoading(job.id);
    try {
      await withdrawInterest(currentUser.uid, job.id);
      setAppliedJobIds(appliedJobIds.filter(id => id !== job.id)); // Remove from local state
    } catch (error) {
      console.error(error);
      alert("Failed to withdraw interest.");
    }
    setActionLoading(null);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!profile || !profile.profileCompleted) {
    return (
      <>
        <div className="absolute top-4 right-4">
          <button onClick={logout} className="text-red-500 underline">Logout</button>
        </div>
        <WorkerProfileForm onProfileComplete={fetchData} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">LabourLink</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 hidden sm:block">Hello, {profile.name}</span>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white shadow rounded-lg p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Your Profile</h2>
            <div className="text-gray-600 mt-1 flex flex-wrap gap-4 text-sm">
              <span>📍 {profile.district}, {profile.state}</span>
              <span>🛠 {profile.skills.join(", ")}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Available Jobs</h3>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.length === 0 ? (
            <div className="col-span-full bg-white p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p>No active jobs found at the moment.</p>
            </div>
          ) : (
            vacancies.map((job) => {
              const isApplied = appliedJobIds.includes(job.id);
              const isLoading = actionLoading === job.id;

              return (
                <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{job.jobTitle}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        ₹{job.salary}/mo
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">📍 {job.location}</p>
                    
                    <div className="flex gap-2 mb-4 text-xs">
                      {job.accommodation && job.accommodation !== "None" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded">
                          🏠 {job.accommodation} Room
                        </span>
                      )}
                      {job.water && job.water !== "None" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded">
                          💧 {job.water} Water
                        </span>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Needed: {job.workerCount}</span>
                    
                    {/* Toggle between Apply and Withdraw Buttons */}
                    {isApplied ? (
                      <button 
                        onClick={() => handleWithdraw(job)}
                        disabled={isLoading}
                        className="text-sm px-4 py-2 rounded transition-colors font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        {isLoading ? "Processing..." : "Withdraw Interest"}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(job)}
                        disabled={isLoading}
                        className="text-sm px-4 py-2 rounded transition-colors font-medium bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isLoading ? "Processing..." : "Show Interest"}
                      </button>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}