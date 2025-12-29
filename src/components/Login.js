import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("INPUT_PHONE");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  
  const { sendOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (phoneNumber.length < 10) return setError("Please enter a valid phone number.");
    try {
      const formattedNumber = "+91" + phoneNumber; 
      const confirmation = await sendOtp(formattedNumber);
      setConfirmationResult(confirmation);
      setStep("INPUT_OTP");
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Try using test number.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await confirmationResult.confirm(otp);
      navigate("/dashboard"); 
    } catch (err) {
      console.error(err);
      setError("Invalid OTP.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Login</h2>
        {error && <p className="mb-4 text-sm text-center text-red-500">{error}</p>}
        <div id="recaptcha-container"></div>

        {step === "INPUT_PHONE" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  +91
                </span>
                <input
                  type="tel"
                  className="flex-1 block w-full p-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
              <input
                type="text"
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}