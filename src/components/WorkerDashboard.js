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
  const [actionLoading, setActionLoading] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    minSalary: "",
    accommodation: "All",
    water: "All"
  });

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
      setAppliedJobIds([...appliedJobIds, job.id]); 
    } catch (error) {
      console.error(error);
      alert("Failed to send interest.");
    }
    setActionLoading(null);
  };

  // Handle Withdraw
  const handleWithdraw = async (job) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${job.jobTitle}"?`)) return;
    setActionLoading(job.id);
    try {
      await withdrawInterest(currentUser.uid, job.id);
      setAppliedJobIds(appliedJobIds.filter(id => id !== job.id)); 
    } catch (error) {
      console.error(error);
      alert("Failed to withdraw interest.");
    }
    setActionLoading(null);
  };

  // Handle Filter Change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Reset Filters
  const clearFilters = () => {
    setFilters({
      keyword: "",
      location: "",
      minSalary: "",
      accommodation: "All",
      water: "All"
    });
  };

  // Filtering Logic
  const filteredVacancies = vacancies.filter((job) => {
    if (filters.keyword && !job.jobTitle.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.minSalary && Number(job.salary) < Number(filters.minSalary)) return false;

    if (filters.accommodation !== "All") {
        if (filters.accommodation === "Free" && job.accommodation !== "Free") return false;
        if (filters.accommodation === "Paid" && job.accommodation !== "Paid") return false;
    }

    if (filters.water !== "All") {
        if (filters.water === "Free" && job.water !== "Free") return false;
        if (filters.water === "Paid" && job.water !== "Paid") return false;
    }

    return true;
  });


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
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              🏭 LabourLink
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 hidden sm:block">Hello, {profile.name}</span>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Profile Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold">Welcome back, {profile.name} 👋</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-blue-100 text-sm font-medium">
              <span className="flex items-center gap-1">📍 {profile.district}, {profile.state}</span>
              <span className="flex items-center gap-1">🛠 {profile.skills.join(", ")}</span>
            </div>
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-gray-800">Find Jobs</h3>
          <span className="text-sm text-gray-500">Showing {filteredVacancies.length} active jobs</span>
        </div>
        
        {/* --- STYLED FILTER SECTION --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                
                {/* Search Keyword */}
                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Role</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                      <input 
                          type="text" name="keyword" placeholder="Search role..." 
                          value={filters.keyword} onChange={handleFilterChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                </div>

                {/* Location */}
                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <input 
                          type="text" name="location" placeholder="City or District" 
                          value={filters.location} onChange={handleFilterChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                </div>

                {/* Min Salary */}
                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min Salary</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-lg">₹</span>
                      </div>
                      <input 
                          type="number" name="minSalary" placeholder="10000" 
                          value={filters.minSalary} onChange={handleFilterChange}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                </div>

                {/* Accommodation */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Room</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                      </div>
                      <select 
                          name="accommodation" 
                          value={filters.accommodation} onChange={handleFilterChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                      >
                          <option value="All">Any</option>
                          <option value="Free">Free Room</option>
                          <option value="Paid">Paid Room</option>
                      </select>
                    </div>
                </div>

                {/* Water */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Water</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                       </div>
                      <select 
                          name="water" 
                          value={filters.water} onChange={handleFilterChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                      >
                          <option value="All">Any</option>
                          <option value="Free">Free Water</option>
                          <option value="Paid">Paid Water</option>
                      </select>
                    </div>
                </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Clear Filters
                </button>
            </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVacancies.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center bg-white p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
              <button onClick={clearFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Clear all filters</button>
            </div>
          ) : (
            filteredVacancies.map((job) => {
              const isApplied = appliedJobIds.includes(job.id);
              const isLoading = actionLoading === job.id;

              return (
                <div key={job.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">{job.jobTitle}</h3>
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-bold border border-green-100 whitespace-nowrap">
                        ₹{job.salary}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {job.location}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.accommodation && job.accommodation !== "None" && (
                        <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${job.accommodation === "Free" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>
                          🏠 {job.accommodation} Room
                        </span>
                      )}
                      {job.water && job.water !== "None" && (
                        <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${job.water === "Free" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>
                          💧 {job.water} Water
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                      Wanted: {job.workerCount}
                    </span>
                    
                    {isApplied ? (
                      <button 
                        onClick={() => handleWithdraw(job)}
                        disabled={isLoading}
                        className="text-sm px-4 py-2 rounded-lg font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                      >
                        {isLoading ? "Processing..." : "Withdraw"}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(job)}
                        disabled={isLoading}
                        className="text-sm px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
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