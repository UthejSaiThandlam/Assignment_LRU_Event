import React from "react";
import { Database, Calendar, BookOpen, Info, Box } from "lucide-react";

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: "lru", label: "1. LRU Cache", icon: Database },
    { id: "scheduler", label: "2. Meeting Rooms", icon: Calendar },
    { id: "docs", label: "Documentation", icon: BookOpen },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-cube">
          <Box size={26} strokeWidth={2.2} />
        </div>
        <div className="logo-title">
          <span>Algorithm</span>
          <span>Visualizer</span>
        </div>
      </div>

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
