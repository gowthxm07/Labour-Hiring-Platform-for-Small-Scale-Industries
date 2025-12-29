// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut 
} from "firebase/auth";
import { app } from "../firebase"; // Import the app instance you created in Step 1

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // 1. Setup Recaptcha (Required for Phone Auth)
  function setupRecaptcha(elementId) {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
    return window.recaptchaVerifier;
  }

  // 2. Send OTP
  function sendOtp(phoneNumber) {
    const appVerifier = setupRecaptcha("recaptcha-container");
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  }

  // 3. Logout
  function logout() {
    return signOut(auth);
  }

  // 4. Monitor User State (Keep user logged in on refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    sendOtp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}