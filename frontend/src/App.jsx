import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import LRUSection from "./components/LRUSection";
import SchedulerSection from "./components/SchedulerSection";
import DashboardView from "./components/DashboardView";
import DocumentationView from "./components/DocumentationView";

export default function App() {
  const [activeView, setActiveView] = useState("lru");
  const [theme, setTheme] = useState("dark");
  const [demoTrigger, setDemoTrigger] = useState(0);

  // Toggle theme
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    // Default to dark mode as shown in the reference image
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Global "Run Demo" button in top bar
  const handleRunDemo = () => {
    setDemoTrigger((prev) => prev + 1);
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
          onRunDemo={handleRunDemo}
        />

        <main className="content-body">
          {activeView === "dashboard" && (
            <DashboardView onSelectTab={(tabId) => setActiveView(tabId)} />
          )}
          {activeView === "lru" && (
            <LRUSection
              key={`lru-${demoTrigger}`}
              autoStartDemo={demoTrigger > 0}
              onSwitchToScheduler={() => setActiveView("scheduler")}
            />
          )}
          {activeView === "scheduler" && (
            <SchedulerSection
              key={`sched-${demoTrigger}`}
              autoStartDemo={demoTrigger > 0}
              onSwitchToLRU={() => setActiveView("lru")}
            />
          )}
          {activeView === "docs" && <DocumentationView />}
        </main>
      </div>
    </div>
  );
}
