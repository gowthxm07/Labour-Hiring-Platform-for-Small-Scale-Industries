import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { saveOwnerProfile } from "../utils/userUtils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function OwnerProfileForm({ onProfileComplete }) {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    ownerName: "",
    companyName: "",
    address: "",
    phone: "" // Added Phone
  });
  
  const [loading, setLoading] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);

  useEffect(() => {
    if (currentUser.phoneNumber) {
      setFormData(prev => ({ ...prev, phone: currentUser.phoneNumber }));
    } else {
      setNeedsPhone(true);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profileData = {
        ownerName: formData.ownerName,
        companyName: formData.companyName,
        address: formData.address,
        profileCompleted: true
      };

      await saveOwnerProfile(currentUser.uid, profileData);

      // Save phone if needed
      if (needsPhone) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { phone: formData.phone });
      }

      onProfileComplete();
    } catch (error) {
      console.error(error);
      alert("Error saving profile.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Company / Owner Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Phone Field */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Official Contact Number</label>
            <input 
                type="tel" 
                name="phone"
                required
                disabled={!needsPhone}
                className={`w-full p-2 border rounded ${!needsPhone ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 99999 99999"
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Owner Name</label>
          <input type="text" name="ownerName" required className="w-full p-2 border rounded"
            value={formData.ownerName} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input type="text" name="companyName" placeholder="e.g. Malathi Tex" required 
            className="w-full p-2 border rounded"
            value={formData.companyName} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address / Location</label>
          <textarea name="address" rows="3" required className="w-full p-2 border rounded"
            value={formData.address} onChange={handleChange} />
        </div>

        <button type="submit" disabled={loading} 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {loading ? "Saving..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}