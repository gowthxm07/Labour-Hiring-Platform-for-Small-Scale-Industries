import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { saveWorkerProfile, saveOwnerProfile } from "../utils/userUtils";
import LocationPicker from "./LocationPicker"; 
import { SKILL_LIST } from "../constants/skillList"; // <--- IMPORT MASTER SKILL LIST

export default function ProfileModal({ user, role, onClose, onUpdate }) {
  // --- CLOUDINARY CONFIG ---
  const CLOUD_NAME = "dfof1lcqr"; 
  const UPLOAD_PRESET = "labour_link"; 

  // --- STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // Custom Skill Input State
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    age: "",
    gender: "",
    district: "",
    state: "",
    phone: "",
    skills: [], // <--- CHANGED TO ARRAY BY DEFAULT
    companyName: "",
    address: "",
    lat: null, 
    lng: null
  });

  // Load Data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        ownerName: user.ownerName || "",
        age: user.age || "",
        gender: user.gender || "Male",
        district: user.district || "",
        state: user.state || "",
        phone: user.phone || "",
        // Ensure skills is always an array
        skills: Array.isArray(user.skills) ? user.skills : (user.skills ? user.skills.split(",").map(s=>s.trim()) : []), 
        companyName: user.companyName || "",
        address: user.address || "",
        lat: user.lat || null, 
        lng: user.lng || null
      });
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUploadPhoto = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formDataUpload }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const collectionName = role === "worker" ? "workers" : "owners";
      const userRef = doc(db, collectionName, user.uid);
      await updateDoc(userRef, { photoURL: data.secure_url });
      
      alert("Photo Updated!");
      onUpdate();
      setFile(null);
    } catch (error) {
      console.error(error);
      alert(`Photo upload failed: ${error.message}`);
    }
    setUploading(false);
  };

  const handleSaveChanges = async () => {
    try {
      if (role === "worker") {
        const updatedData = {
          name: formData.name,
          age: Number(formData.age),
          gender: formData.gender,
          district: formData.district,
          state: formData.state,
          phone: formData.phone,
          skills: formData.skills // Save the array directly
        };
        await saveWorkerProfile(user.uid, updatedData);
      } else {
        const updatedData = {
          ownerName: formData.ownerName,
          age: Number(formData.age),
          gender: formData.gender,
          companyName: formData.companyName,
          address: formData.address,
          phone: formData.phone,
          lat: formData.lat, 
          lng: formData.lng 
        };
        await saveOwnerProfile(user.uid, updatedData);
      }

      alert("Profile Updated Successfully!");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- WORKER SKILL HANDLERS ---
  const toggleSkill = (skill) => {
    setFormData(prev => {
        const newSkills = prev.skills.includes(skill)
            ? prev.skills.filter(s => s !== skill)
            : [...prev.skills, skill];
        return { ...prev, skills: newSkills };
    });
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    if (customSkillInput.trim() && !formData.skills.includes(customSkillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, customSkillInput.trim()] }));
        setCustomSkillInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl z-10 font-bold">×</button>
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="px-6 pb-6">
          {/* PROFILE IMAGE */}
          <div className="relative -mt-16 mb-4 flex justify-center">
            <div className="relative group">
                <img src={preview || user.photoURL || "https://via.placeholder.com/150?text=User"} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"/>
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-sm">Change Photo<input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
            </div>
          </div>
          
          {file && (<div className="text-center mb-4"><button onClick={handleUploadPhoto} disabled={uploading} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">{uploading ? "Uploading..." : "⬆ Upload New Photo"}</button></div>)}

          {!isEditing ? (
            <>
                {/* --- VIEW MODE --- */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{user.name || user.ownerName}</h2>
                    <p className="text-gray-500">{role === "worker" ? "Worker" : "Business Owner"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                    <div className="col-span-2"><span className="block text-gray-400 text-xs uppercase">Phone</span><span className="font-medium text-gray-700">{user.phone || "N/A"}</span></div>
                    <div><span className="block text-gray-400 text-xs uppercase">Age</span><span className="font-medium text-gray-700">{user.age || "-"}</span></div>
                    <div><span className="block text-gray-400 text-xs uppercase">Gender</span><span className="font-medium text-gray-700">{user.gender || "-"}</span></div>

                    {role === "worker" ? (
                        <>
                            <div className="col-span-2"><span className="block text-gray-400 text-xs uppercase">Location</span><span className="font-medium text-gray-700">{user.district}, {user.state}</span></div>
                            <div className="col-span-2">
                                <span className="block text-gray-400 text-xs uppercase">Skills</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {user.skills?.map((skill, i) => (
                                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2"><span className="block text-gray-400 text-xs uppercase">Company</span><span className="font-medium text-gray-700">{user.companyName}</span></div>
                            <div className="col-span-2"><span className="block text-gray-400 text-xs uppercase">Address</span><span className="font-medium text-gray-700">{user.address}</span></div>
                        </>
                    )}
                </div>
                
                <button onClick={() => setIsEditing(true)} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mb-3 shadow-sm">✏️ Edit Profile Details</button>
            </>
          ) : (
            <div className="space-y-3">
                {/* --- EDIT MODE --- */}
                <div><label className="text-xs font-bold text-gray-500">{role === "worker" ? "Full Name" : "Owner Name"}</label><input type="text" name={role === "worker" ? "name" : "ownerName"} value={role === "worker" ? formData.name : formData.ownerName} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
                
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-gray-500">Age</label><input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
                    <div><label className="text-xs font-bold text-gray-500">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>

                {role === "worker" ? (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs font-bold text-gray-500">District</label><input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
                            <div><label className="text-xs font-bold text-gray-500">State</label><input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
                        </div>
                        
                        {/* --- NEW SKILLS SELECTION FOR WORKER --- */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Your Skills</label>
                            
                            {/* Selected Skills View */}
                            <div className="flex flex-wrap gap-1 mb-2 p-2 border border-gray-200 rounded min-h-[40px] bg-gray-50">
                                {formData.skills.map(skill => (
                                    <span key={skill} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                                        {skill}
                                        <button onClick={() => toggleSkill(skill)} className="text-blue-900 hover:text-red-500 font-bold">×</button>
                                    </span>
                                ))}
                                {formData.skills.length === 0 && <span className="text-gray-400 text-xs italic">No skills selected...</span>}
                            </div>

                            {/* Add Custom Skill */}
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={customSkillInput} 
                                    onChange={(e) => setCustomSkillInput(e.target.value)} 
                                    placeholder="Type a custom skill..." 
                                    className="flex-1 border p-1.5 rounded text-sm"
                                />
                                <button onClick={addCustomSkill} className="bg-gray-200 px-3 py-1 text-xs font-bold rounded hover:bg-gray-300">Add</button>
                            </div>

                            {/* Standard List */}
                            <div className="h-32 overflow-y-auto border p-2 rounded bg-white">
                                <div className="flex flex-wrap gap-1">
                                    {SKILL_LIST.map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                                formData.skills.includes(skill)
                                                ? "bg-blue-600 text-white border-blue-600 hidden" // Hide from list if selected
                                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            + {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div><label className="text-xs font-bold text-gray-500">Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
                        <div><label className="text-xs font-bold text-gray-500">Address (Text)</label><textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded text-sm"></textarea></div>
                        <div><label className="text-xs font-bold text-gray-500">Pin Location on Map</label><LocationPicker initialLat={formData.lat} initialLng={formData.lng} onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))} /></div>
                    </>
                )}

                <div><label className="text-xs font-bold text-gray-500">Phone Number</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>

                <div className="flex gap-2 mt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
                    <button onClick={handleSaveChanges} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm">💾 Save Changes</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}