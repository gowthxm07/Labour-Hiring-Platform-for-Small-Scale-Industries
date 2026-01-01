import React, { useEffect, useState } from "react";
import { getWorkerProfile, getOwnerProfile, getUserReviews, getUserRating } from "../utils/userUtils";

export default function PublicProfileModal({ targetId, targetRole, onClose }) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        let data = null;
        if (targetRole === "worker") {
          data = await getWorkerProfile(targetId);
        } else {
          data = await getOwnerProfile(targetId);
        }
        setProfile(data);

        // Fetch Reviews & Rating
        const reviewsData = await getUserReviews(targetId);
        setReviews(reviewsData);
        
        const avg = await getUserRating(targetId);
        setAverageRating(avg);

      } catch (error) {
        console.error("Error fetching public profile:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, [targetId, targetRole]);

  if (!targetId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeIn">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        {loading ? (
           <div className="p-10 text-center text-gray-500">Loading Profile...</div>
        ) : !profile ? (
           <div className="p-10 text-center text-gray-500">Profile not found.</div>
        ) : (
          <>
            {/* HEADER WITH PHOTO */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative shrink-0">
               <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <img 
                    src={profile.photoURL || `https://ui-avatars.com/api/?name=${targetRole === 'worker' ? profile.name : profile.companyName}&background=random`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
               </div>
            </div>

            {/* BODY CONTENT */}
            <div className="pt-14 px-6 pb-6 overflow-y-auto">
              
              {/* BASIC INFO */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {targetRole === 'worker' ? profile.name : profile.companyName}
                </h2>
                <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">
                    {targetRole === 'worker' ? "Skilled Worker" : "Verified Company"}
                </p>
                
                {/* RATING BADGE */}
                <div className="flex justify-center items-center gap-1 mt-2 text-amber-500 font-bold bg-amber-50 inline-flex px-3 py-1 rounded-full mx-auto">
                    <span>★</span> <span>{averageRating > 0 ? averageRating : "New"}</span> 
                    <span className="text-gray-400 font-normal text-xs ml-1">({reviews.length} reviews)</span>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                 
                 {/* --- WORKER LAYOUT --- */}
                 {targetRole === 'worker' ? (
                    <>
                        <div>
                            <span className="block text-gray-400 text-xs uppercase font-bold">Location</span>
                            <span className="font-medium text-gray-700">{profile.district}, {profile.state}</span>
                        </div>
                        <div>
                           <span className="block text-gray-400 text-xs uppercase font-bold">Age / Gender</span>
                           <span className="font-medium text-gray-700">{profile.age} yrs / {profile.gender}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-gray-400 text-xs uppercase font-bold">Skills</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {profile.skills?.map((skill, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </>
                 ) : (
                    /* --- OWNER LAYOUT (FIXED OVERLAP) --- */
                    <>
                        <div className="col-span-2">
                           <span className="block text-gray-400 text-xs uppercase font-bold">Owner Name</span>
                           <span className="font-medium text-gray-700">{profile.ownerName}</span>
                        </div>
                        
                        {/* Address now spans full width + breaks words */}
                        <div className="col-span-2">
                            <span className="block text-gray-400 text-xs uppercase font-bold">Location / Address</span>
                            <span className="font-medium text-gray-700 break-words leading-relaxed">
                                {profile.address}
                            </span>
                        </div>

                        <div className="col-span-2">
                           <span className="block text-gray-400 text-xs uppercase font-bold">About Company</span>
                           <span className="font-medium text-gray-700 italic">"We are hiring skilled workers for our unit."</span>
                        </div>
                    </>
                 )}
              </div>

              {/* REVIEWS SECTION */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Ratings & Reviews</h3>
                {reviews.length === 0 ? (
                    <p className="text-gray-400 text-center italic py-2">No reviews yet.</p>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex text-amber-400 text-sm">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">"{rev.comment}"</p>
                            </div>
                        ))}
                    </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}