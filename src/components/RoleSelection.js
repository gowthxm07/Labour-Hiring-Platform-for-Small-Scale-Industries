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
      // Redirect based on role
      if (role === "worker") navigate("/worker-dashboard");
      else navigate("/owner-dashboard");
    } catch (error) {
      console.error("Error creating profile:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Select Your Role</h2>
      <p>Are you looking for a job or looking to hire?</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        <button 
          onClick={() => handleRoleSelect("worker")}
          disabled={loading}
          style={{ padding: "20px", fontSize: "18px", cursor: "pointer" }}
        >
          I am a Worker <br/> (Looking for Job)
        </button>

        <button 
          onClick={() => handleRoleSelect("owner")}
          disabled={loading}
          style={{ padding: "20px", fontSize: "18px", cursor: "pointer" }}
        >
          I am an Owner <br/> (Hiring Workers)
        </button>
      </div>
    </div>
  );
}