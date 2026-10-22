import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import LRUSection from "./components/LRUSection";
import SchedulerSection from "./components/SchedulerSection";
import DocumentationView from "./components/DocumentationView";
import AboutView from "./components/AboutView";

export default function App() {
  const [activeView, setActiveView] = useState("lru");
  const [theme, setTheme] = useState("light");
  const [demoKey, setDemoKey] = useState(0);

  // Toggle theme
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Global "Run All Demos" trigger: triggers live demo in the current view or switches
  const handleRunAllDemos = () => {
    setDemoKey((prev) => prev + 1);
  };

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <TopBar
          theme={theme}
          toggleTheme={toggleTheme}
          onRunAllDemos={handleRunAllDemos}
        />

        <main className="content-body">
          {activeView === "lru" && <LRUSection key={`lru-${demoKey}`} autoStartDemo={demoKey > 0} />}
          {activeView === "scheduler" && <SchedulerSection key={`sched-${demoKey}`} autoStartDemo={demoKey > 0} />}
          {activeView === "docs" && <DocumentationView />}
          {activeView === "about" && <AboutView />}
        </main>
      </div>
    </div>
  );
}
