import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function OwnerDashboard() {
  const { logout } = useAuth();
  return (
    <div style={{ padding: "20px" }}>
      <h1>Owner Dashboard</h1>
      <p>Post Jobs here.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}