import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { saveWorkerProfile, saveOwnerProfile } from "../utils/userUtils";
import LocationPicker from "./LocationPicker"; // ✅ ADDED

export default function ProfileModal({ user, role, onClose, onUpdate }) {

  // --- CLOUDINARY CONFIG ---
  const CLOUD_NAME = "dfof1lcqr";   // (keep as you already have)
  const UPLOAD_PRESET = "labour_link";

  // --- STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // --- FORM STATE (OLD + NEW FIELDS) ---
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    age: "",
    gender: "",
    district: "",
    state: "",
    phone: "",
    skills: "",
    companyName: "",
    address: "",
    lat: null, // ✅ NEW
    lng: null  // ✅ NEW
  });

  // LOAD USER DATA
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
        skills: user.skills ? user.skills.join(", ") : "",
        companyName: user.companyName || "",
        address: user.address || "",
        lat: user.lat ?? null, // ✅ NEW
        lng: user.lng ?? null  // ✅ NEW
      });
    }
  }, [user]);

  // --- PHOTO UPLOAD ---
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
      if (!data.secure_url) throw new Error("Upload failed");

      const collectionName = role === "worker" ? "workers" : "owners";
      const userRef = doc(db, collectionName, user.uid);
      await updateDoc(userRef, { photoURL: data.secure_url });

      alert("Photo Updated Successfully!");
      onUpdate();
      setFile(null);
      setPreview(null);

    } catch (error) {
      console.error("Upload Error:", error);
      alert(`Photo upload failed: ${error.message}`);
    }

    setUploading(false);
  };

  // --- SAVE PROFILE ---
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
          skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean)
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
          lat: formData.lat,   // ✅ NEW
          lng: formData.lng    // ✅ NEW
        };
        await saveOwnerProfile(user.uid, updatedData);
      }

      alert("Profile Updated Successfully!");
      setIsEditing(false);
      onUpdate();

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">

        <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl font-bold">
          &times;
        </button>

        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="px-6 pb-6">

          {/* PROFILE IMAGE */}
          <div className="relative -mt-16 mb-4 flex justify-center">
            <div className="relative group">
              <img
                src={preview || user.photoURL || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer text-white text-sm font-bold">
                Change Photo
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {file && (
            <div className="text-center mb-4">
              <button
                onClick={handleUploadPhoto}
                disabled={uploading}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs"
              >
                {uploading ? "Uploading..." : "⬆ Upload New Photo"}
              </button>
            </div>
          )}

          {/* VIEW MODE */}
          {!isEditing ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{user.name || user.ownerName}</h2>
                <p className="text-gray-500">{role === "worker" ? "Worker" : "Business Owner"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border mb-6">

                <div className="col-span-2">
                  <span className="block text-xs uppercase text-gray-400">Phone</span>
                  <span>{user.phone || "N/A"}</span>
                </div>

                <div>
                  <span className="block text-xs uppercase text-gray-400">Age</span>
                  <span>{user.age || "-"}</span>
                </div>

                <div>
                  <span className="block text-xs uppercase text-gray-400">Gender</span>
                  <span>{user.gender || "-"}</span>
                </div>

                {role === "worker" ? (
                  <>
                    <div className="col-span-2">
                      <span className="block text-xs uppercase text-gray-400">Location</span>
                      <span>{user.district}, {user.state}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="block text-xs uppercase text-gray-400">Skills</span>
                      <span>{user.skills?.join(", ")}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <span className="block text-xs uppercase text-gray-400">Company</span>
                      <span>{user.companyName}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="block text-xs uppercase text-gray-400">Address</span>
                      <span>{user.address}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-600 text-white py-2 rounded"
              >
                ✏️ Edit Profile Details
              </button>
            </>
          ) : (
            /* EDIT MODE */
            <div className="space-y-3">

              <div>
                <label className="text-xs font-bold text-gray-500">
                  {role === "worker" ? "Full Name" : "Owner Name"}
                </label>
                <input
                  type="text"
                  name={role === "worker" ? "name" : "ownerName"}
                  value={role === "worker" ? formData.name : formData.ownerName}
                  onChange={handleChange}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              {/* AGE & GENDER */}
              <div className="grid grid-cols-2 gap-2">
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="Age" />
                <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded text-sm bg-white">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>

              {role === "worker" ? (
                <>
                  <input name="district" value={formData.district} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="District" />
                  <input name="state" value={formData.state} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="State" />
                  <input name="skills" value={formData.skills} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="Skills (comma separated)" />
                </>
              ) : (
                <>
                  <input name="companyName" value={formData.companyName} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="Company Name" />
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="border p-2 rounded text-sm" placeholder="Address" />

                  {/* ✅ LOCATION PICKER ADDED SAFELY */}
                  <div>
                    <label className="text-xs font-bold text-gray-500">Pin Company Location</label>
                    <LocationPicker
                      initialLat={formData.lat}
                      initialLng={formData.lng}
                      onLocationSelect={(lat, lng) =>
                        setFormData(prev => ({ ...prev, lat, lng }))
                      }
                    />
                  </div>
                </>
              )}

              <input name="phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded text-sm" placeholder="Phone" />

              <div className="flex gap-2 mt-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 py-2 rounded">
                  Cancel
                </button>
                <button onClick={handleSaveChanges} className="flex-1 bg-blue-600 text-white py-2 rounded">
                  💾 Save Changes
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
