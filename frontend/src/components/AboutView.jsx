import React from "react";
import { Info, CheckCircle2, ShieldCheck } from "lucide-react";

export default function AboutView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="algo-card">
        <div className="algo-card-header">
          <div className="title-row">
            <Info size={20} color="#2563eb" />
            <h2 style={{ fontSize: "18px" }}>About Algorithm Visualizer</h2>
          </div>
          <span className="pill-concept">SE Intern Assignment</span>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.7", marginBottom: "16px" }}>
          This visualizer was crafted for the <strong>Data Structures & Systems Design (SE Intern)</strong> technical assessment. It presents live visual models of two classic systems:
        </p>

        <ul style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: "1.8", paddingLeft: "20px", marginBottom: "20px" }}>
          <li><strong>System A: LRU Cache</strong> — In-memory caching engine combining a Hash Map for expected O(1) lookup with a Doubly Linked List for O(1) recency updates and eviction.</li>
          <li><strong>System B: Meeting Room Scheduler</strong> — Greedy interval scheduling algorithm using Chronological Sorting and a Priority Queue (Min-Heap) to determine maximum concurrent occupancy and room assignments.</li>
        </ul>

        <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "var(--text-heading)" }}>
            ⚡ Architecture Highlights
          </h3>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.6" }}>
            The frontend connects to a real <strong>FastAPI Python backend</strong> running at <code style={{ color: "var(--blue-primary)" }}>http://127.0.0.1:8001</code>. Every interaction runs the actual Python algorithms and returns live state mutations.
          </p>
        </div>
      </div>
    </div>
  );
}
