import React, { useState } from "react";
import { db } from "../firebase"; // Only need DB, not Storage
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileModal({ user, role, onClose, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  // --- CONFIGURATION ---
  const CLOUD_NAME = "dfof1lcqr"; // <--- REPLACE THIS
  const UPLOAD_PRESET = "labour_link"; // <--- REPLACE THIS (e.g., "labour_link")

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // 1. Upload to Cloudinary via their API (No SDK needed)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      
      if (!data.secure_url) {
          throw new Error("Cloudinary upload failed");
      }

      const imageUrl = data.secure_url;

      // 2. Save the Image URL to Firestore (workers or owners collection)
      const collectionName = role === "worker" ? "workers" : "owners";
      const userRef = doc(db, collectionName, user.uid);
      
      await updateDoc(userRef, { photoURL: imageUrl });
      
      alert("Profile Picture Updated!");
      onUpdate(); // Refresh parent data
      onClose();

    } catch (error) {
      console.error("Error uploading:", error);
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">
            &times;
        </button>

        {/* HEADER / COVER */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="px-6 pb-6">
          {/* PROFILE IMAGE UPLOAD */}
          <div className="relative -mt-16 mb-4 flex justify-center">
            <div className="relative group">
                <img 
                    src={preview || user.photoURL || "https://via.placeholder.com/150?text=User"} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-sm">
                    Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{user.name || user.ownerName}</h2>
            <p className="text-gray-500">{role === "worker" ? "Worker" : "Business Owner"}</p>
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
             <div>
                <span className="block text-gray-400 text-xs uppercase">Location</span>
                <span className="font-medium text-gray-700">{user.district || user.address}</span>
             </div>
             <div>
                <span className="block text-gray-400 text-xs uppercase">Contact</span>
                <span className="font-medium text-gray-700">{user.phone || "N/A"}</span>
             </div>
             {role === "worker" && (
                <div className="col-span-2">
                    <span className="block text-gray-400 text-xs uppercase">Skills</span>
                    <span className="font-medium text-gray-700">{user.skills?.join(", ")}</span>
                </div>
             )}
             {role === "owner" && (
                <div className="col-span-2">
                    <span className="block text-gray-400 text-xs uppercase">Company</span>
                    <span className="font-medium text-gray-700">{user.companyName}</span>
                </div>
             )}
          </div>

          {/* ACTION BUTTONS */}
          {file && (
            <button 
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mb-3 shadow-sm"
            >
                {uploading ? "Uploading to Cloud..." : "Save New Photo"}
            </button>
          )}

          <button onClick={onClose} className="w-full text-gray-500 hover:text-gray-700 text-sm">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}