import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkerProfile } from "../utils/userUtils";
import WorkerProfileForm from "./WorkerProfileForm";

export default function WorkerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (currentUser) {
      const data = await getWorkerProfile(currentUser.uid);
      setProfile(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!profile || !profile.profileCompleted) {
    return (
      <>
        <div className="absolute top-4 right-4">
          <button onClick={logout} className="text-red-500 underline">Logout</button>
        </div>
        <WorkerProfileForm onProfileComplete={fetchProfile} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">LabourLink</h1>
            <button onClick={logout} className="text-gray-600 hover:text-red-500">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {profile.name} 👋</h2>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <p>📍 {profile.district}, {profile.state}</p>
            <p>🛠 {profile.skills.join(", ")}</p>
          </div>
        </div>

        {/* Jobs Section */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Find Jobs</h3>
        <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500 border-2 border-dashed border-gray-300">
          <p>Job listings will appear here in the next steps.</p>
        </div>

      </div>
    </div>
  );
}