import React from "react";
import { Sun, Moon, Play } from "lucide-react";

export default function TopBar({ theme, toggleTheme, onRunDemo }) {
  return (
    <header className="top-header">
      <div className="header-title-group">
        <h1 className="header-main-title">Algorithm Playground</h1>
        <p className="header-subtitle">Explore how the algorithms work, step by step.</p>
      </div>

      <div className="header-actions">
        {/* Segmented Light / Dark Mode Toggle */}
        <div className="theme-switch-pill">
          <button
            className={`theme-pill-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => toggleTheme("light")}
            type="button"
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            className={`theme-pill-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => toggleTheme("dark")}
            type="button"
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
        </div>

        {/* Run Demo Button */}
        <button className="btn-run-demo-primary" onClick={onRunDemo} type="button">
          <Play size={13} fill="currentColor" />
          <span>Run Demo</span>
        </button>
      </div>
    </header>
  );
}
