import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Play, Timer, ShieldCheck, Zap } from "lucide-react";

export default function TestSuiteTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/test_suite/run");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      alert("Failed to run test suite on backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const filteredResults = report?.results?.filter(r => {
    if (filter === "ALL") return true;
    return r.category.toUpperCase().includes(filter);
  }) || [];

  return (
    <div>
      {/* Test Runner Banner */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <ShieldCheck size={20} color="#10b981" />
            <span>Automated Edge-Case & Invariant Test Suite</span>
            <span className="badge badge-emerald">Comprehensive Verification</span>
          </div>
          <button className="btn btn-emerald" onClick={runTests} disabled={loading}>
            <Play size={14} /> {loading ? "Running Suite..." : "Run All Tests Live"}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
          Executes edge cases, race-condition simulations, boundary conditions, and invariant tests against the live Python backend algorithms.
        </p>

        {/* Scorecard Metrics */}
        {report && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            <div style={{ background: "var(--bg-surface-elevated)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Test Cases</span>
              <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", color: "#fff" }}>
                {report.total_tests}
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <span style={{ fontSize: "11px", color: "#6ee7b7", textTransform: "uppercase" }}>Passed Scenarios</span>
              <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", color: "var(--accent-emerald)" }}>
                {report.passed} / {report.total_tests}
              </div>
            </div>

            <div style={{ background: "var(--bg-surface-elevated)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Failed Scenarios</span>
              <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", color: report.failed > 0 ? "var(--accent-rose)" : "#94a3b8" }}>
                {report.failed}
              </div>
            </div>

            <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
              <span style={{ fontSize: "11px", color: "#a5b4fc", textTransform: "uppercase" }}>Suite Execution Time</span>
              <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "#818cf8" }}>
                {report.total_time_ms} ms
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          className={`tab-btn ${filter === "ALL" ? "active" : ""}`}
          style={{ padding: "6px 14px", fontSize: "12px" }}
          onClick={() => setFilter("ALL")}
        >
          All Tests ({report?.total_tests || 0})
        </button>
        <button
          className={`tab-btn ${filter === "LRU" ? "active" : ""}`}
          style={{ padding: "6px 14px", fontSize: "12px" }}
          onClick={() => setFilter("LRU")}
        >
          LRU Cache Tests
        </button>
        <button
          className={`tab-btn ${filter === "SCHEDULER" ? "active" : ""}`}
          style={{ padding: "6px 14px", fontSize: "12px" }}
          onClick={() => setFilter("SCHEDULER")}
        >
          Event Scheduler Tests
        </button>
      </div>

      {/* Test Results Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredResults.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              transition: "border-color 0.2s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {item.status === "PASSED" ? (
                <CheckCircle2 color="var(--accent-emerald)" size={20} />
              ) : (
                <XCircle color="var(--accent-rose)" size={20} />
              )}
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  Category: {item.category}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {item.duration_ms} ms
              </span>
              <span className={`badge ${item.status === "PASSED" ? "badge-emerald" : "badge-rose"}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
