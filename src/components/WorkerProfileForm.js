import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateWorkerProfile } from "../utils/userUtils";

export default function WorkerProfileForm({ onProfileComplete }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    state: "",
    district: "",
    skills: "" // We will save this as a comma-separated string for simplicity
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Split skills string into an array
      const skillsArray = formData.skills.split(",").map(skill => skill.trim());
      
      await updateWorkerProfile(currentUser.uid, {
        name: formData.name,
        age: formData.age,
        state: formData.state,
        district: formData.district,
        skills: skillsArray,
        profileCompleted: true // Flag to know they finished setup
      });

      // Notify parent component to refresh
      onProfileComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", padding: "20px", border: "1px solid #ddd" }}>
      <h3>Complete Your Profile</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Full Name:</label><br/>
          <input 
            type="text" name="name" required 
            value={formData.name} onChange={handleChange} 
            style={{ width: "100%", padding: "8px" }} 
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Age:</label><br/>
          <input 
            type="number" name="age" required 
            value={formData.age} onChange={handleChange} 
            style={{ width: "100%", padding: "8px" }} 
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>State:</label><br/>
          <input 
            type="text" name="state" placeholder="e.g. Tamil Nadu" required 
            value={formData.state} onChange={handleChange} 
            style={{ width: "100%", padding: "8px" }} 
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>District:</label><br/>
          <input 
            type="text" name="district" placeholder="e.g. Coimbatore" required 
            value={formData.district} onChange={handleChange} 
            style={{ width: "100%", padding: "8px" }} 
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Skills (separate by comma):</label><br/>
          <input 
            type="text" name="skills" placeholder="e.g. Weaving, Packing, Helper" required 
            value={formData.skills} onChange={handleChange} 
            style={{ width: "100%", padding: "8px" }} 
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}