import React, { useState } from "react";

export default function ReportModal({ isOpen, onClose, onSubmit, targetName, targetRole }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!isOpen) return null;

  // 1. Complaints raised by Worker ON Owner (Target is Owner)
  const workerReportingOwner = [
    {
      category: "Job / Hiring related",
      reasons: [
        "❌ Job details are fake or misleading",
        "❌ Salary offered is not as mentioned",
        "❌ Work conditions are different from description",
        "❌ Asked for advance money / fees",
        "❌ Job location is incorrect or fake"
      ]
    },
    {
      category: "Safety & behavior",
      reasons: [
        "🚨 Abusive or threatening behavior",
        "🚨 Inappropriate language or conduct",
        "🚨 Unsafe working environment",
        "🚨 Exploiting workers (long hours, no pay)"
      ]
    },
    {
      category: "Trust & legitimacy",
      reasons: [
        "🚩 Company seems fake or unverified",
        "🚩 Owner identity looks suspicious",
        "🚩 Multiple job posts but no responses",
        "🚩 Not responding after accepting application"
      ]
    },
    {
      category: "Platform misuse",
      reasons: [
        "⚠️ Asking to move conversation outside platform",
        "⚠️ Sharing false information repeatedly"
      ]
    }
  ];

  // 2. Complaints raised by Owner ON Worker (Target is Worker)
  const ownerReportingWorker = [
    {
      category: "Application issues",
      reasons: [
        "❌ Fake profile or incorrect details",
        "❌ Skills mentioned are false",
        "❌ Applied but never responded",
        "❌ Accepted job but didn’t join"
      ]
    },
    {
      category: "Behavior & professionalism",
      reasons: [
        "🚨 Unprofessional behavior",
        "🚨 Abusive language or threats",
        "🚨 Misconduct at workplace"
      ]
    },
    {
      category: "Reliability issues",
      reasons: [
        "⚠️ Frequently applies and withdraws",
        "⚠️ Does not show up after confirmation",
        "⚠️ Repeated no-shows"
      ]
    },
    {
      category: "Platform misuse",
      reasons: [
        "🚩 Spamming job applications",
        "🚩 Creating multiple accounts",
        "🚩 Sharing misleading information"
      ]
    }
  ];

  // Select the correct list based on who we are reporting
  // If targetRole is 'owner', then a Worker is reporting them.
  const reportOptions = targetRole === "owner" ? workerReportingOwner : ownerReportingWorker;

  const handleSubmit = () => {
    let finalReason = selectedReason;
    if (selectedReason === "Other") {
      if (!customReason.trim()) {
        alert("Please specify the reason.");
        return;
      }
      finalReason = `📝 Other: ${customReason}`;
    }

    if (!finalReason) {
      alert("Please select a reason.");
      return;
    }

    onSubmit(finalReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
              🚨 Report {targetName}
            </h3>
            <p className="text-xs text-red-500">This report will be sent to the Admin team.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="p-4 overflow-y-auto">
          <p className="text-sm text-gray-700 font-medium mb-3">Please select a reason:</p>
          
          <div className="space-y-4">
            {reportOptions.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">{section.category}</h4>
                <div className="space-y-2">
                  {section.reasons.map((reason) => (
                    <label 
                      key={reason} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReason === reason 
                          ? "bg-red-50 border-red-500 ring-1 ring-red-500" 
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="reportReason" 
                        value={reason} 
                        checked={selectedReason === reason} 
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* OTHER OPTION */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Other</h4>
              <label 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedReason === "Other" 
                    ? "bg-red-50 border-red-500 ring-1 ring-red-500" 
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input 
                  type="radio" 
                  name="reportReason" 
                  value="Other" 
                  checked={selectedReason === "Other"} 
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">📝 Other (please specify)</span>
              </label>

              {selectedReason === "Other" && (
                <textarea 
                  className="w-full mt-3 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  rows="3"
                  placeholder="Type your complaint here..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                ></textarea>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}