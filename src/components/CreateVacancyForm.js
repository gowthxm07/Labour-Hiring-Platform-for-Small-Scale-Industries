// src/components/CreateVacancyForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createVacancy, updateVacancy } from "../utils/vacancyUtils";

export default function CreateVacancyForm({ onSuccess, onCancel, editingJob }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Initial State
  const [formData, setFormData] = useState({
    jobTitle: "",
    workerCount: "",
    salary: "",
    description: "",
    location: "",
    accommodation: "None", // None | Free | Paid
    water: "None"          // None | Free | Paid
  });

  // If we are editing, pre-fill the form
  useEffect(() => {
    if (editingJob) {
      setFormData({
        jobTitle: editingJob.jobTitle,
        workerCount: editingJob.workerCount,
        salary: editingJob.salary,
        description: editingJob.description,
        location: editingJob.location,
        accommodation: editingJob.accommodation || "None",
        water: editingJob.water || "None",
      });
    }
  }, [editingJob]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFacilityChange = (type, value) => {
    setFormData(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        jobTitle: formData.jobTitle,
        workerCount: Number(formData.workerCount),
        salary: formData.salary,
        description: formData.description,
        location: formData.location,
        accommodation: formData.accommodation,
        water: formData.water
      };

      if (editingJob) {
        // Update existing job
        await updateVacancy(editingJob.id, payload);
      } else {
        // Create new job
        await createVacancy(currentUser.uid, payload);
      }
      onSuccess(); 
    } catch (error) {
      console.error(error);
      alert("Error saving job.");
    }
    setLoading(false);
  };

  // Helper for Facility Buttons
  const FacilityButton = ({ label, currentVal, type, val }) => (
    <button
      type="button"
      onClick={() => handleFacilityChange(type, val)}
      className={`px-3 py-1 text-sm border rounded-md transition-colors ${
        currentVal === val 
          ? "bg-blue-600 text-white border-blue-600" 
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {editingJob ? "Edit Job Post" : "Post a New Job"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Title / Role</label>
          <input type="text" name="jobTitle" placeholder="e.g. Power Loom Operator" required 
            className="w-full p-2 border rounded focus:ring-blue-500"
            value={formData.jobTitle} onChange={handleChange} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Workers Needed</label>
            <input type="number" name="workerCount" placeholder="e.g. 5" required 
              className="w-full p-2 border rounded focus:ring-blue-500"
              value={formData.workerCount} onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Salary (₹)</label>
            <input type="text" name="salary" placeholder="e.g. 15000" required 
              className="w-full p-2 border rounded focus:ring-blue-500"
              value={formData.salary} onChange={handleChange} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Location</label>
          <input type="text" name="location" placeholder="e.g. Tiruppur Main Road" required 
            className="w-full p-2 border rounded focus:ring-blue-500"
            value={formData.location} onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" rows="3" placeholder="Details about the work..." required
            className="w-full p-2 border rounded focus:ring-blue-500"
            value={formData.description} onChange={handleChange} 
          />
        </div>

        {/* --- NEW FACILITY SECTION --- */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Accommodation</label>
            <div className="flex gap-2">
              <FacilityButton label="No" currentVal={formData.accommodation} type="accommodation" val="None" />
              <FacilityButton label="Free" currentVal={formData.accommodation} type="accommodation" val="Free" />
              <FacilityButton label="Paid" currentVal={formData.accommodation} type="accommodation" val="Paid" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">💧 Drinking Water</label>
            <div className="flex gap-2">
              <FacilityButton label="No" currentVal={formData.water} type="water" val="None" />
              <FacilityButton label="Free" currentVal={formData.water} type="water" val="Free" />
              <FacilityButton label="Paid" currentVal={formData.water} type="water" val="Paid" />
            </div>
          </div>
        </div>
        {/* --------------------------- */}

        <div className="flex gap-3 pt-4 border-t mt-4">
          <button type="submit" disabled={loading} 
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">
            {loading ? "Saving..." : (editingJob ? "Update Job" : "Post Job")}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}