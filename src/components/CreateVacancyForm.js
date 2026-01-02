import React, { useState } from "react";
import { createVacancy, updateVacancy } from "../utils/vacancyUtils";
import { useAuth } from "../contexts/AuthContext";
import { SKILL_LIST } from "../constants/skillList"; // <--- Import Skills

export default function CreateVacancyForm({ onSuccess, onCancel, editingJob }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    jobTitle: editingJob?.jobTitle || "",
    description: editingJob?.description || "",
    salary: editingJob?.salary || "",
    location: editingJob?.location || "",
    workerCount: editingJob?.workerCount || 1,
    accommodation: editingJob?.accommodation || "None",
    water: editingJob?.water || "None",
    requiredSkills: editingJob?.requiredSkills || [] // <--- New Field
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SKILL TOGGLE LOGIC ---
  const handleSkillToggle = (skill) => {
    setFormData(prev => {
        if (prev.requiredSkills.includes(skill)) {
            return { ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) };
        } else {
            return { ...prev, requiredSkills: [...prev.requiredSkills, skill] };
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      if (editingJob) {
        await updateVacancy(editingJob.id, formData);
        alert("Job Updated Successfully!");
      } else {
        await createVacancy(currentUser.uid, formData);
        alert("Job Posted Successfully!");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Error saving job.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{editingJob ? "Edit Job" : "Post a New Job"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Title & Salary */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">Job Title</label>
                <input type="text" name="jobTitle" required value={formData.jobTitle} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. Power Loom Operator" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Salary (₹/month)</label>
                <input type="number" name="salary" required value={formData.salary} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. 15000" />
            </div>
        </div>

        {/* Location & Count */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">Location</label>
                <input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full border p-2 rounded" placeholder="City / Area" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Workers Needed</label>
                <input type="number" name="workerCount" required value={formData.workerCount} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
        </div>

        {/* Amenities */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">Accommodation</label>
                <select name="accommodation" value={formData.accommodation} onChange={handleChange} className="w-full border p-2 rounded bg-white">
                    <option value="None">None</option>
                    <option value="Free">Free Room</option>
                    <option value="Paid">Paid Room</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Water Facility</label>
                <select name="water" value={formData.water} onChange={handleChange} className="w-full border p-2 rounded bg-white">
                    <option value="None">None</option>
                    <option value="Free">Free Water</option>
                    <option value="Paid">Paid Water</option>
                </select>
            </div>
        </div>

        {/* --- NEW SKILLS SELECTOR --- */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills (Select all that apply)</label>
            <div className="flex flex-wrap gap-2 border p-3 rounded bg-gray-50 max-h-40 overflow-y-auto">
                {SKILL_LIST.map(skill => (
                    <button
                        type="button"
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            formData.requiredSkills.includes(skill)
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}
                    >
                        {formData.requiredSkills.includes(skill) ? "✓ " : "+ "} 
                        {skill}
                    </button>
                ))}
            </div>
        </div>

        {/* Description */}
        <div>
            <label className="block text-sm font-bold text-gray-700">Description</label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Describe the work..." />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md">
                {loading ? "Saving..." : (editingJob ? "Update Job" : "Post Job")}
            </button>
        </div>
      </form>
    </div>
  );
}