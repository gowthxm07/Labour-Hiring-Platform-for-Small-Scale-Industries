import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkerProfile } from "../utils/userUtils";
import WorkerProfileForm from "./WorkerProfileForm";

export default function WorkerDashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch profile
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

  if (loading) return <div>Loading...</div>;

  // If profile is not completed (or doesn't have the 'profileCompleted' flag)
  if (!profile || !profile.profileCompleted) {
    return (
      <div>
        <div style={{ textAlign: "right", padding: "10px" }}>
          <button onClick={logout}>Logout</button>
        </div>
        <WorkerProfileForm onProfileComplete={fetchProfile} />
      </div>
    );
  }

  // --- MAIN DASHBOARD CONTENT (Visible only after profile is done) ---
  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Worker Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ background: "#f0f0f0", padding: "15px", borderRadius: "8px" }}>
        <h3>Welcome, {profile.name}</h3>
        <p><strong>Location:</strong> {profile.district}, {profile.state}</p>
        <p><strong>Skills:</strong> {profile.skills.join(", ")}</p>
      </div>

      <hr />
      
      <h3>Find Jobs</h3>
      <p>Job listings will appear here in the next steps.</p>
    </div>
  );
}