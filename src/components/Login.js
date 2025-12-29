// src/components/Login.js
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("INPUT_PHONE"); // INPUT_PHONE or INPUT_OTP
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  
  const { sendOtp } = useAuth();
  const navigate = useNavigate();

  // Handle Sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (phoneNumber.length < 10) return setError("Please enter a valid phone number.");

    try {
      // Appending country code +91 manually for now
      const formattedNumber = "+91" + phoneNumber; 
      const confirmation = await sendOtp(formattedNumber);
      setConfirmationResult(confirmation);
      setStep("INPUT_OTP");
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Try using the test number +91 1234567890.");
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      await confirmationResult.confirm(otp);
      // Success! User is logged in.
      navigate("/dashboard"); 
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. For testing, use 123456.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Hidden container for Recaptcha */}
      <div id="recaptcha-container"></div>

      {step === "INPUT_PHONE" ? (
        <form onSubmit={handleSendOtp}>
          <label>Phone Number (without +91)</label>
          <input
            type="tel"
            placeholder="1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
          <button type="submit" style={{ width: "100%", padding: "10px" }}>Send OTP</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <label>Enter OTP</label>
          <input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
          <button type="submit" style={{ width: "100%", padding: "10px" }}>Verify OTP</button>
        </form>
      )}
    </div>
  );
}