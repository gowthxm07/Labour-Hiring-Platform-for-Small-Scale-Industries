import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { saveWorkerProfile } from "../utils/userUtils";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import needed
import { db } from "../firebase";

export default function WorkerProfileForm({ onProfileComplete }) {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    district: "",
    state: "Tamil Nadu",
    skills: "",
    phone: "" // Added Phone field
  });
  
  const [loading, setLoading] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);

  // Check if we already have the user's phone number
  useEffect(() => {
    if (currentUser.phoneNumber) {
      setFormData(prev => ({ ...prev, phone: currentUser.phoneNumber }));
    } else {
      setNeedsPhone(true); // Google Login users need to add phone
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(",").map(s => s.trim());
      
      const profileData = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        district: formData.district,
        state: formData.state,
        skills: skillsArray,
        profileCompleted: true
      };

      // 1. Save Profile
      await saveWorkerProfile(currentUser.uid, profileData);

      // 2. If user didn't have a phone (Google Login), update it in 'users' collection now
      if (needsPhone) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { phone: formData.phone });
      }

      onProfileComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Worker Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Phone Field (Only editable if logged in with Google) */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number (For employers to contact you)</label>
            <input 
                type="tel" 
                name="phone"
                required
                disabled={!needsPhone} // Disabled if Phone Auth
                className={`w-full p-2 border rounded ${!needsPhone ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 99999 99999"
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="name" required className="w-full p-2 border rounded"
            value={formData.name} onChange={handleChange} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input type="number" name="age" required className="w-full p-2 border rounded"
              value={formData.age} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" className="w-full p-2 border rounded"
              value={formData.gender} onChange={handleChange}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <input type="text" name="district" required className="w-full p-2 border rounded"
              value={formData.district} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input type="text" name="state" required className="w-full p-2 border rounded"
              value={formData.state} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
          <input type="text" name="skills" placeholder="e.g. Power Loom, Cutting, Packaging" required 
            className="w-full p-2 border rounded"
            value={formData.skills} onChange={handleChange} />
        </div>

        <button type="submit" disabled={loading} 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}