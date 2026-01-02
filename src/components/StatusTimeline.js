import React from "react";

export default function StatusTimeline({ status }) {
  // Determine active step index
  // 0: Pending/Applied, 1: Viewed, 2: Decision (Accepted/Rejected)
  let stepIndex = 0;
  if (status === "viewed") stepIndex = 1;
  if (status === "accepted" || status === "rejected") stepIndex = 2;

  // Colors based on final status
  const finalColor = status === "rejected" ? "bg-red-500" : "bg-green-500";
  const finalBorder = status === "rejected" ? "border-red-500" : "border-green-500";
  const finalText = status === "rejected" ? "text-red-600" : "text-green-600";
  const finalLabel = status === "rejected" ? "Rejected" : "Accepted";

  return (
    <div className="w-full max-w-xs mt-3 mb-4">
      <div className="flex items-center justify-between relative">
        
        {/* PROGRESS LINE BACKGROUND */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
        
        {/* PROGRESS LINE FILL */}
        <div 
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 transition-all duration-500 -z-10 ${status === 'rejected' ? 'bg-red-200' : 'bg-green-200'}`}
            style={{ width: stepIndex === 0 ? '0%' : stepIndex === 1 ? '50%' : '100%' }}
        ></div>

        {/* STEP 1: APPLIED */}
        <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ✓
            </div>
            <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Applied</span>
        </div>

        {/* STEP 2: VIEWED */}
        <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${stepIndex >= 1 ? "bg-blue-500 border-white text-white" : "bg-white border-gray-300 text-gray-300"}`}>
                {stepIndex >= 1 ? "✓" : "2"}
            </div>
            <span className={`text-[10px] font-bold mt-1 uppercase ${stepIndex >= 1 ? "text-blue-600" : "text-gray-400"}`}>Viewed</span>
        </div>

        {/* STEP 3: DECISION */}
        <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${stepIndex === 2 ? `${finalColor} border-white text-white` : "bg-white border-gray-300 text-gray-300"}`}>
                {stepIndex === 2 ? (status === "rejected" ? "✕" : "✓") : "3"}
            </div>
            <span className={`text-[10px] font-bold mt-1 uppercase ${stepIndex === 2 ? finalText : "text-gray-400"}`}>
                {stepIndex === 2 ? finalLabel : "Decision"}
            </span>
        </div>

      </div>
    </div>
  );
}