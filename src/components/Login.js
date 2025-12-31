import React, { useState } from "react";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("INPUT_PHONE"); // INPUT_PHONE | VERIFY_OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- PHONE AUTH LOGIC ---
  const generateRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    generateRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const formatPh = "+91" + phoneNumber;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formatPh, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep("VERIFY_OTP");
      alert("OTP Sent!");
    } catch (error) {
      console.error(error);
      alert("Error sending OTP. Make sure the number is correct.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      await ensureUserDoc(result.user);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Invalid OTP");
    }
    setLoading(false);
  };

  // --- GOOGLE AUTH LOGIC ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureUserDoc(result.user);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Google Sign-In failed.");
    }
    setLoading(false);
  };

  // Helper: Create 'users' doc if it doesn't exist
  const ensureUserDoc = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // If logging in via Google, phone might be null initially
      await setDoc(userRef, {
        uid: user.uid,
        phone: user.phoneNumber || null, 
        email: user.email || null,
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome to LabourLink
        </h2>

        {/* PHONE LOGIN SECTION */}
        {step === "INPUT_PHONE" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="bg-gray-100 px-3 py-2 text-gray-500 font-medium flex items-center border-r">+91</span>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 outline-none"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "VERIFY_OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-lg"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium transition-colors">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" onClick={() => setStep("INPUT_PHONE")} className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2">
              Change Number
            </button>
          </form>
        )}

        <div id="recaptcha-container"></div>

        {/* GOOGLE LOGIN SECTION */}
        <div className="mt-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
            </div>

            <button 
                onClick={handleGoogleSignIn}
                type="button" 
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
            </button>
        </div>

      </div>
    </div>
  );
}