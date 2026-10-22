import React from "react";
import { Database, Calendar, Zap, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export default function DashboardView({ onSelectTab }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-hero-card">
        <div className="hero-text">
          <span className="hero-badge">SE Intern Systems Studio</span>
          <h2>Data Structures & Systems Design Playground</h2>
          <p>
            Interactive visual execution engine backed by production-grade Python algorithms.
            Explore $O(1)$ Hash Map & Doubly Linked List caching alongside $O(n \log n)$ Greedy Min-Heap event scheduling.
          </p>
        </div>
        <div className="hero-quick-actions">
          <button className="btn-dash-action primary" onClick={() => onSelectTab("lru")}>
            <Database size={15} />
            <span>Open LRU Cache</span>
            <ArrowRight size={14} />
          </button>
          <button className="btn-dash-action secondary" onClick={() => onSelectTab("scheduler")}>
            <Calendar size={15} />
            <span>Open Meeting Rooms</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="dash-cards-grid">
        {/* Card 1: LRU Cache */}
        <div className="dash-feature-card" onClick={() => onSelectTab("lru")}>
          <div className="card-top-row">
            <div className="dash-icon-box blue">
              <Database size={20} />
            </div>
            <span className="badge-pill-green">O(1) Time Guarantee</span>
          </div>
          <h3>1. LRU Cache Simulator</h3>
          <p>
            Experience constant-time operations using a Doubly Linked List with Sentinel nodes (HEAD and TAIL) coupled with an internal Hash Map for instantaneous key lookups.
          </p>
          <ul className="dash-feature-list">
            <li><CheckCircle2 size={13} className="bullet-icon" /> Dynamic capacity resizing & auto-eviction</li>
            <li><CheckCircle2 size={13} className="bullet-icon" /> Live step-by-step visual animation & log</li>
            <li><CheckCircle2 size={13} className="bullet-icon" /> Python thread-safe <code>RLock</code> backend</li>
          </ul>
        </div>

        {/* Card 2: Meeting Rooms */}
        <div className="dash-feature-card" onClick={() => onSelectTab("scheduler")}>
          <div className="card-top-row">
            <div className="dash-icon-box purple">
              <Calendar size={20} />
            </div>
            <span className="badge-pill-purple">O(n log n) Min-Heap</span>
          </div>
          <h3>2. Meeting Room Scheduler</h3>
          <p>
            Determine meeting attendance feasibility and calculate optimal room assignments using chronological start-time sorting and a Priority Queue of active meeting end times.
          </p>
          <ul className="dash-feature-list">
            <li><CheckCircle2 size={13} className="bullet-icon" /> Simultaneous meeting conflict detection</li>
            <li><CheckCircle2 size={13} className="bullet-icon" /> Dynamic room allocation with timeline scan</li>
            <li><CheckCircle2 size={13} className="bullet-icon" /> Heap operations visualizer with laser tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
