import React from "react";
import { Layers, Calendar, CheckCircle2, BookOpen, Activity } from "lucide-react";

export default function Header({ activeTab, setActiveTab, backendOnline }) {
  return (
    <header className="app-header">
      <div className="logo-group">
        <div className="logo-badge">⚡</div>
        <div className="logo-text">
          <h1>AlgoLab Studio</h1>
          <p>Data Structures & Systems Design — SE Intern Implementation</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="status-badge">
          <span className={`status-dot ${backendOnline ? "online" : "offline"}`} />
          <span>{backendOnline ? "FastAPI Core :8000 Online" : "Backend Offline"}</span>
        </div>
      </div>
    </header>
  );
}
