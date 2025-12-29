import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getOwnerProfile } from "../utils/userUtils";
import OwnerProfileForm from "./OwnerProfileForm";

export default function OwnerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (currentUser) {
      const data = await getOwnerProfile(currentUser.uid);
      setProfile(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // If profile is not complete, show the form
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

  // --- MAIN OWNER DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">LabourLink Business</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {profile.ownerName}</span>
              <button onClick={logout} className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Company Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-800">{profile.companyName}</h2>
          <p className="text-gray-600">📍 {profile.factoryLocation.city}, {profile.factoryLocation.state}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Your Job Vacancies</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-md">
            + Post New Job
          </button>
        </div>

        {/* Vacancy List Placeholder */}
        <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500 border-2 border-dashed border-gray-300">
          <p>You haven't posted any jobs yet.</p>
          <p className="text-sm mt-2">Click the button above to hire workers.</p>
        </div>

      </div>
    </div>
  );
}