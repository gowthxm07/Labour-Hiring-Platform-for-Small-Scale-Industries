import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('INPUT_PHONE'); // INPUT_PHONE, INPUT_OTP
  const [role, setRole] = useState('worker'); // 'worker' or 'owner'
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  // 1. Setup Invisible Recaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  // 2. Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setupRecaptcha();
    
    const appVerifier = window.recaptchaVerifier;
    const formatPh = "+91" + phoneNumber; // Assuming India for now

    try {
      const confirmation = await signInWithPhoneNumber(auth, formatPh, appVerifier);
      setConfirmationResult(confirmation);
      setStep('INPUT_OTP');
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Error sending OTP. Ensure phone number is valid.");
    }
    setLoading(false);
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // User is now logged in!
      // In Step 3 we will save their Role to the database. 
      // For now, just navigate to Home.
      localStorage.setItem('userRole', role); // Temporary role storage
      navigate('/');
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className={`p-6 text-white text-center ${role === 'owner' ? 'bg-blue-800' : 'bg-green-700'} transition-colors duration-300`}>
          <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-90" />
          <h2 className="text-2xl font-bold">
            {role === 'worker' ? 'Worker Login' : 'Owner Login'}
          </h2>
          <p className="text-sm opacity-90">Secure OTP Verification</p>
        </div>

        {/* Role Switcher */}
        {step === 'INPUT_PHONE' && (
          <div className="flex border-b">
            <button 
              onClick={() => setRole('worker')}
              className={`flex-1 py-3 font-medium text-sm ${role === 'worker' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              I am a Worker
            </button>
            <button 
              onClick={() => setRole('owner')}
              className={`flex-1 py-3 font-medium text-sm ${role === 'owner' ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              I am an Owner
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-8">
          {step === 'INPUT_PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 ring-offset-1 focus-within:ring-blue-500">
                  <span className="bg-gray-100 px-3 py-3 text-gray-500 border-r border-gray-200">+91</span>
                  <input 
                    type="tel"
                    required
                    maxLength="10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10 digit number"
                    className="flex-1 px-4 py-3 outline-none"
                  />
                </div>
              </div>
              
              <div id="recaptcha-container"></div>

              <button 
                type="submit" 
                disabled={loading || phoneNumber.length < 10}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center space-x-2
                  ${role === 'owner' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-green-700 hover:bg-green-800'} 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <span>Get OTP</span>}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
               <div className="text-center mb-4">
                <p className="text-gray-500 text-sm">OTP sent to +91 {phoneNumber}</p>
                <button type="button" onClick={() => setStep('INPUT_PHONE')} className="text-blue-600 text-xs hover:underline">Change Number</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input 
                  type="text"
                  required
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="------"
                  className="w-full text-center text-2xl tracking-widest px-4 py-3 border rounded-lg outline-none focus:ring-2 ring-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length < 6}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center space-x-2
                  ${role === 'owner' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-green-700 hover:bg-green-800'} 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <span>Verify & Login</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}