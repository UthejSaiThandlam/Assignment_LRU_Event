import React from "react";
import { LayoutDashboard, Database, Calendar, FileText, Box } from "lucide-react";

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "lru", label: "LRU Cache", icon: Database },
    { id: "scheduler", label: "Meeting Rooms", icon: Calendar },
    { id: "docs", label: "Documentation", icon: FileText },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="logo-cube">
          <Box size={22} className="cube-icon" />
        </div>
        <div className="logo-title">
          <span className="logo-playground">Algorithm</span>
          <span className="logo-playground-sub">Playground</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
