import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createUserProfile } from "../utils/userUtils";

export default function RoleSelection() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role) => {
    setLoading(true);
    try {
      await createUserProfile(currentUser.uid, currentUser.phoneNumber, role);
      if (role === "worker") navigate("/worker-dashboard");
      else navigate("/owner-dashboard");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="mb-2 text-3xl font-bold text-gray-800">Select Your Role</h2>
      <p className="mb-8 text-gray-600">Are you looking for a job or looking to hire?</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Worker Card */}
        <button 
          onClick={() => handleRoleSelect("worker")}
          disabled={loading}
          className="p-8 transition bg-white border-2 border-transparent rounded-xl shadow-lg hover:border-blue-500 hover:shadow-xl w-64 text-center"
        >
          <div className="text-4xl mb-4">👷</div>
          <h3 className="text-xl font-bold text-gray-800">I am a Worker</h3>
          <p className="text-sm text-gray-500 mt-2">Looking for jobs in factories or mills.</p>
        </button>

        {/* Owner Card */}
        <button 
          onClick={() => handleRoleSelect("owner")}
          disabled={loading}
          className="p-8 transition bg-white border-2 border-transparent rounded-xl shadow-lg hover:border-blue-500 hover:shadow-xl w-64 text-center"
        >
          <div className="text-4xl mb-4">🏭</div>
          <h3 className="text-xl font-bold text-gray-800">I am an Owner</h3>
          <p className="text-sm text-gray-500 mt-2">Hiring workers for my unit.</p>
        </button>
      </div>
    </div>
  );
}