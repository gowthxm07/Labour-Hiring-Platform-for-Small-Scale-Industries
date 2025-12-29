import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleSelection from "./components/RoleSelection";
import WorkerDashboard from "./components/WorkerDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import { getUserRole } from "./utils/userUtils";

// This component decides where to send the user
function MainRedirect() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (currentUser) {
        const role = await getUserRole(currentUser.uid);
        if (!role) {
          navigate("/role-selection"); // New User
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

  if (checking) return <div>Loading User Data...</div>;
  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          
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