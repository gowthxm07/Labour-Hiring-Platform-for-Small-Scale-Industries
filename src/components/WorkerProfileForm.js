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
    skills: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(",").map(skill => skill.trim());
      await updateWorkerProfile(currentUser.uid, {
        name: formData.name,
        age: formData.age,
        state: formData.state,
        district: formData.district,
        skills: skillsArray,
        profileCompleted: true 
      });
      onProfileComplete();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-gray-800">Complete Your Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.name} onChange={handleChange} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input type="number" name="age" required 
                className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.age} onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input type="text" name="state" required 
                className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.state} onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <input type="text" name="district" required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.district} onChange={handleChange} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
            <input type="text" name="skills" placeholder="Weaving, Packing..." required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.skills} onChange={handleChange} 
            />
          </div>

          <button type="submit" disabled={loading} 
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}