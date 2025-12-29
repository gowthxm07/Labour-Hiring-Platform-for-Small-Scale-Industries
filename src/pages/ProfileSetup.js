import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { UserCircle, MapPin, Building2, Briefcase } from 'lucide-react';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole'); // 'worker' or 'owner'
  const [loading, setLoading] = useState(false);

  // Common State
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // Worker Specific State
  const [age, setAge] = useState('');
  const [skills, setSkills] = useState(''); // Comma separated string for now

  // Owner Specific State
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const uid = auth.currentUser.uid;
    const phone = auth.currentUser.phoneNumber;

    try {
      // 1. Create the Main User Document
      // This helps us know if a user exists later
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        phone: phone,
        role: userRole,
        name: name,
        status: 'pending', // Waiting for verification
        createdAt: new Date().toISOString()
      });

      // 2. Create the Role Specific Document
      if (userRole === 'worker') {
        await setDoc(doc(db, "workers", uid), {
          uid: uid,
          name: name,
          age: age,
          state: state,
          district: district,
          skills: skills.split(',').map(s => s.trim()), // Convert "Weaving, Cutting" to Array
          noShowCount: 0,
          verified: false
        });
      } else {
        await setDoc(doc(db, "owners", uid), {
          uid: uid,
          companyName: companyName,
          ownerName: name,
          factoryLocation: {
            address: address,
            state: state,
            district: district
          },
          verified: false
        });
      }

      // 3. Redirect to Dashboard
      alert("Profile Saved Successfully!");
      navigate('/');

    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
        <p className="text-gray-500 mb-8">Please provide your details to join the platform as a <span className="uppercase font-bold text-blue-600">{userRole}</span>.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Common Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <UserCircle className="text-gray-400 w-5 h-5 mr-2" />
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full outline-none" placeholder="Enter your name" />
              </div>
            </div>

            {userRole === 'worker' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                <input required type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" placeholder="25" />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <MapPin className="text-gray-400 w-5 h-5 mr-2" />
                <input required type="text" value={state} onChange={e => setState(e.target.value)} className="w-full outline-none" placeholder="e.g. Tamil Nadu" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
              <input required type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" placeholder="e.g. Tirurpur" />
            </div>
          </div>

          {/* Worker Specific Fields */}
          {userRole === 'worker' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Skills (Comma Separated)</label>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Briefcase className="text-gray-400 w-5 h-5 mr-2" />
                <input required type="text" value={skills} onChange={e => setSkills(e.target.value)} className="w-full outline-none" placeholder="e.g. Powerloom Operator, Cutting, Packing" />
              </div>
            </div>
          )}

          {/* Owner Specific Fields */}
          {userRole === 'owner' && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                <div className="flex items-center border rounded-lg px-3 py-2">
                  <Building2 className="text-gray-400 w-5 h-5 mr-2" />
                  <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full outline-none" placeholder="e.g. Sri Balaji Textiles" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Factory Address</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none h-24" placeholder="Enter complete address..." />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            {loading ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}