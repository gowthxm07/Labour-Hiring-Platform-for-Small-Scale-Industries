import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

// A simple placeholder for the Dashboard (we will build this in Step 3)
const Dashboard = () => {
  const { logout, currentUser } = useAuth();
  const role = localStorage.getItem('userRole') || 'unknown';

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome, {role}!</h1>
      <p className="mb-4">User ID: {currentUser.uid}</p>
      <button 
        onClick={logout} 
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

// Component to protect routes (only allow logged-in users)
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Route */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;