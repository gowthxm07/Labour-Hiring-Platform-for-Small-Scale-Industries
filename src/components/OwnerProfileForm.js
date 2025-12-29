import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateOwnerProfile } from "../utils/userUtils";

export default function OwnerProfileForm({ onProfileComplete }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    address: "",
    city: "",
    state: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateOwnerProfile(currentUser.uid, {
        companyName: formData.companyName,
        ownerName: formData.ownerName,
        factoryLocation: {
          address: formData.address,
          city: formData.city,
          state: formData.state
        },
        profileCompleted: true
      });
      onProfileComplete();
    } catch (error) {
      console.error(error);
      alert("Error saving profile");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-gray-800">Register Your Company</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Company / Factory Name</label>
            <input type="text" name="companyName" required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.companyName} onChange={handleChange} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Owner Full Name</label>
            <input type="text" name="ownerName" required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.ownerName} onChange={handleChange} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Factory Address</label>
            <textarea name="address" required 
              className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.address} onChange={handleChange} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" name="city" required 
                className="w-full p-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.city} onChange={handleChange} 
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

          <button type="submit" disabled={loading} 
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Company Details"}
          </button>
        </form>
      </div>
    </div>
  );
}