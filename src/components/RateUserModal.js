import React, { useState } from "react";
import { submitReview } from "../utils/userUtils";

export default function RateUserModal({ fromId, toId, targetName, onClose, userRole }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a star rating.");
    setLoading(true);
    try {
      // If I am a worker, I am rating an 'owner', and vice-versa
      const targetRole = userRole === "worker" ? "owner" : "worker";
      await submitReview(fromId, toId, rating, comment, targetRole);
      alert("Review submitted!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error submitting review.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Rate {targetName}</h3>
        <p className="text-gray-500 text-sm mb-4">How was your experience?</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
          rows="3"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            {loading ? "..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}