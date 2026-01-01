import React, { useEffect, useState } from "react";
import { getWorkerProfile, getOwnerProfile, getUserReviews, getUserRating } from "../utils/userUtils";

// ✅ LEAFLET IMPORTS
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

// ✅ FIX LEAFLET DEFAULT ICON ISSUE
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading Profile...</div>
        ) : !profile ? (
          <div className="p-10 text-center text-gray-500">Profile not found.</div>
        ) : (
          <>
            {/* HEADER */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative shrink-0">
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                <img
                  src={
                    profile.photoURL ||
                    `https://ui-avatars.com/api/?name=${
                      targetRole === "worker" ? profile.name : profile.companyName
                    }&background=random`
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
              </div>
            </div>

            {/* BODY */}
            <div className="pt-14 px-6 pb-6 overflow-y-auto">

              {/* BASIC INFO */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {targetRole === "worker" ? profile.name : profile.companyName}
                </h2>
                <p className="text-gray-500 text-sm uppercase font-semibold">
                  {targetRole === "worker" ? "Skilled Worker" : "Verified Company"}
                </p>

                <div className="flex justify-center items-center gap-1 mt-2 text-amber-500 font-bold bg-amber-50 inline-flex px-3 py-1 rounded-full">
                  ★ {averageRating > 0 ? averageRating : "New"}
                  <span className="text-gray-400 text-xs ml-1">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border mb-6">

                {/* WORKER */}
                {targetRole === "worker" ? (
                  <>
                    <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">
                        Location
                      </span>
                      <span className="font-medium text-gray-700">
                        {profile.district}, {profile.state}
                      </span>
                    </div>

                    <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">
                        Age / Gender
                      </span>
                      <span className="font-medium text-gray-700">
                        {profile.age} yrs / {profile.gender}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="block text-gray-400 text-xs font-bold uppercase">
                        Skills
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.skills?.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OWNER DETAILS */}
                    <div className="col-span-2">
                      <span className="block text-gray-400 text-xs font-bold uppercase">
                        Owner Name
                      </span>
                      <span className="font-medium text-gray-700">
                        {profile.ownerName}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="block text-gray-400 text-xs font-bold uppercase">
                        Address
                      </span>
                      <span className="font-medium text-gray-700 break-words">
                        {profile.address}
                      </span>
                    </div>

                    {/* ✅ SATELLITE MAP (VISIBLE TO WORKERS) */}
                    {profile.lat && profile.lng && (
                      <div className="col-span-2 mt-2">
                        <span className="block text-gray-400 text-xs uppercase font-bold mb-1">
                          Company Location (Satellite View)
                        </span>

                        <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-200 relative z-0">
                          <MapContainer
                            center={[profile.lat, profile.lng]}
                            zoom={15}
                            scrollWheelZoom={false}
                            style={{ height: "100%", width: "100%" }}
                          >
                            <TileLayer
                              attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                            <Marker position={[profile.lat, profile.lng]} />
                          </MapContainer>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${profile.lat},${profile.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-center bg-blue-50 text-blue-600 font-bold text-sm py-2 mt-2 rounded border border-blue-100 hover:bg-blue-100"
                        >
                          📍 Open Navigation
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* REVIEWS */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
                  Ratings & Reviews
                </h3>

                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-center italic">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between">
                          <div className="text-amber-400 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          "{rev.comment}"
                        </p>
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
