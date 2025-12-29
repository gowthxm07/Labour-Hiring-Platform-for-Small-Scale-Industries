import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function WorkerDashboard() {
  const { logout } = useAuth();
  return (
    <div style={{ padding: "20px" }}>
      <h1>Worker Dashboard</h1>
      <p>Find Jobs here.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}