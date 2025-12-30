import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./components/LandingPage"; // Import the new Landing Page
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleSelection from "./components/RoleSelection";
import WorkerDashboard from "./components/WorkerDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import { getUserRole } from "./utils/userUtils";

// Main Redirect Logic
function MainRedirect() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (currentUser) {
        const role = await getUserRole(currentUser.uid);
        if (!role) {
          navigate("/role-selection");
        } else if (role === "worker") {
          navigate("/worker-dashboard");
        } else if (role === "owner") {
          navigate("/owner-dashboard");
        }
      }
      setChecking(false);
    }
    checkRole();
  }, [currentUser, navigate]);

  if (checking) return <div className="p-10 text-center">Loading User Data...</div>;
  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
             <ProtectedRoute><MainRedirect /></ProtectedRoute> 
          } />

          <Route path="/role-selection" element={
            <ProtectedRoute><RoleSelection /></ProtectedRoute>
          } />
          
          <Route path="/worker-dashboard" element={
            <ProtectedRoute><WorkerDashboard /></ProtectedRoute>
          } />

          <Route path="/owner-dashboard" element={
            <ProtectedRoute><OwnerDashboard /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;