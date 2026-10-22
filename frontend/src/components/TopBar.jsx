import React from "react";
import { Sun, Moon, Play } from "lucide-react";

export default function TopBar({ theme, toggleTheme, onRunAllDemos }) {
  return (
    <header className="top-header">
      <div className="header-title-group">
        <h1>Algorithm Visualizer</h1>
        <p>Interactive visualization of two classic problems: LRU Cache and Meeting Room Scheduler</p>
      </div>

      <div className="header-actions">
        {/* Light / Dark Mode Toggle */}
        <div className="theme-switch">
          <button
            className={`theme-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => toggleTheme("light")}
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            className={`theme-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => toggleTheme("dark")}
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
        </div>

        {/* Run All Demos Button */}
        <button className="btn-run-all" onClick={onRunAllDemos}>
          <Play size={13} fill="#ffffff" />
          <span>Run All Demos</span>
        </button>
      </div>
    </header>
  );
}
