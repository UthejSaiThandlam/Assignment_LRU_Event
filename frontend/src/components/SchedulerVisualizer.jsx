import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, Users, Building, Tag, CheckCircle2, AlertTriangle, Plus, Trash2 } from "lucide-react";

export default function SchedulerVisualizer() {
  const [events, setEvents] = useState([
    [9, 11],
    [10, 12],
    [11, 13]
  ]);

  const [attendResult, setAttendResult] = useState(null);
  const [roomsResult, setRoomsResult] = useState(null);
  const [assignResult, setAssignResult] = useState(null);

  const [story, setStory] = useState({
    icon: "📅",
    title: "The Meeting Room Problem",
    desc: "We have meetings with start and end times. We need to know: Can one person go to all of them? And what is the fewest number of rooms needed to host them all?"
  });

  // Run all 3 calculations together whenever events change or button clicked
  const analyzeSchedule = async (currentEvents = events) => {
    try {
      // 1. can_attend_all
      const resAttend = await fetch("http://127.0.0.1:8000/api/scheduler/can_attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: currentEvents })
      });
      const dataAttend = await resAttend.json();
      setAttendResult(dataAttend);

      // 2. min_rooms_required
      const resRooms = await fetch("http://127.0.0.1:8000/api/scheduler/min_rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: currentEvents })
      });
      const dataRooms = await resRooms.json();
      setRoomsResult(dataRooms);

      // 3. assign_rooms
      const resAssign = await fetch("http://127.0.0.1:8000/api/scheduler/assign_rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: currentEvents })
      });
      const dataAssign = await resAssign.json();
      setAssignResult(dataAssign);

      if (dataAttend.can_attend) {
        setStory({
          icon: "✅",
          title: "All Clear! One person can attend all meetings.",
          desc: "None of the meetings overlap in time. Only 1 room is needed to host everything!"
        });
      } else {
        setStory({
          icon: "🏢",
          title: `Overlap Found! We need ${dataRooms.min_rooms} rooms.`,
          desc: `Some meetings happen at the same time, so 1 person cannot attend them all. The organization needs ${dataRooms.min_rooms} rooms.`
        });
      }
    } catch (err) {
      console.error("Scheduler analysis error", err);
    }
  };

  useEffect(() => {
    analyzeSchedule(events);
  }, []);

  // Quick Scenarios
  const loadScenario = (type) => {
    let newEvts = [];
    if (type === "adjacent") {
      newEvts = [[9, 10], [10, 11], [11, 12]];
    } else if (type === "standard") {
      newEvts = [[9, 11], [10, 12], [11, 13]];
    } else if (type === "nested") {
      newEvts = [[9, 15], [10, 11], [12, 13]];
    }
    setEvents(newEvts);
    analyzeSchedule(newEvts);
  };

  // Timeline bounds calculation
  const allTimes = events.flatMap(e => [e[0], e[1]]);
  const minTime = events.length > 0 ? Math.min(...allTimes) : 8;
  const maxTime = events.length > 0 ? Math.max(...allTimes) : 18;
  const totalSpan = Math.max(maxTime - minTime, 1);

  const getRoomColor = (roomName) => {
    if (!roomName) return "#6366f1";
    if (roomName.includes("Room A")) return "#6366f1"; // Blue
    if (roomName.includes("Room B")) return "#06b6d4"; // Cyan
    if (roomName.includes("Room C")) return "#f59e0b"; // Amber
    return "#10b981"; // Emerald
  };

  return (
    <div>
      {/* Visual Story Banner */}
      <div className="story-banner">
        <div className="story-icon">{story.icon}</div>
        <div className="story-text">
          <h4>{story.title}</h4>
          <p>{story.desc}</p>
        </div>
      </div>

      {/* 3 Main Answers Displayed as Big Clear Cards */}
      <div className="metrics-grid-3">
        {/* Answer 1: Can attend all? */}
        <div className="metric-card" style={{ borderColor: attendResult?.can_attend ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)" }}>
          <div className="metric-card-title">1. Can 1 Person Attend All?</div>
          <div className="metric-card-value" style={{ color: attendResult?.can_attend ? "var(--emerald)" : "var(--rose)" }}>
            {attendResult?.can_attend ? "YES ✅" : "NO ❌"}
          </div>
          <div className="metric-card-desc">
            {attendResult?.can_attend
              ? "No overlapping meetings! You just walk from one to the next."
              : `Conflict! Meeting ${attendResult?.conflict?.event1[0]}-${attendResult?.conflict?.event1[1]} clashes with ${attendResult?.conflict?.event2[0]}-${attendResult?.conflict?.event2[1]}.`}
          </div>
        </div>

        {/* Answer 2: Min rooms needed? */}
        <div className="metric-card" style={{ borderColor: "rgba(6, 182, 212, 0.4)" }}>
          <div className="metric-card-title">2. Min Rooms Needed</div>
          <div className="metric-card-value" style={{ color: "var(--cyan)" }}>
            {roomsResult?.min_rooms || 0} Room{roomsResult?.min_rooms === 1 ? "" : "s"}
          </div>
          <div className="metric-card-desc">
            The largest number of meetings taking place at the exact same moment.
          </div>
        </div>

        {/* Answer 3: Assigned room numbers */}
        <div className="metric-card" style={{ borderColor: "rgba(99, 102, 241, 0.4)" }}>
          <div className="metric-card-title">3. Room Assignments</div>
          <div className="metric-card-value" style={{ fontSize: "18px", color: "#a5b4fc" }}>
            {assignResult?.assignments ? assignResult.assignments.join(", ") : "Calculating..."}
          </div>
          <div className="metric-card-desc">
            Notice how finished rooms are automatically reused instead of creating new ones!
          </div>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="card-title">Interactive Meeting Schedule</div>
            <div className="card-desc" style={{ marginBottom: 0 }}>
              Look at the timeline below. Each meeting shows its time and its assigned room color.
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="button-row" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} color="#818cf8" /> Try Scenarios:
            </span>
            <button className="btn-pill btn-pill-primary" onClick={() => loadScenario("adjacent")}>
              1. Back-to-Back (1 Room)
            </button>
            <button className="btn-pill btn-pill-cyan" onClick={() => loadScenario("standard")}>
              2. Overlap (2 Rooms, Reused!)
            </button>
            <button className="btn-pill btn-pill-emerald" onClick={() => loadScenario("nested")}>
              3. Nested [9-15]
            </button>
          </div>
        </div>

        {/* The Visual Timeline (Gantt Chart) */}
        <div className="timeline-wrap">
          {/* Hours header */}
          <div className="timeline-hours-bar">
            {Array.from({ length: Math.ceil(totalSpan) + 1 }).map((_, i) => {
              const h = Math.floor(minTime) + i;
              return <span key={h}>{h}:00</span>;
            })}
          </div>

          {/* Meeting bars */}
          {events.map(([start, end], idx) => {
            const leftPct = ((start - minTime) / totalSpan) * 100;
            const widthPct = Math.max(((end - start) / totalSpan) * 100, 5);
            const assignedRoom = assignResult?.assignments[idx];
            const barBg = getRoomColor(assignedRoom);

            return (
              <div key={idx} className="meeting-row">
                <div
                  className="meeting-block"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: barBg
                  }}
                >
                  <span>Meeting #{idx + 1} ({start}:00 - {end}:00)</span>
                  {assignedRoom && (
                    <span className="room-badge">{assignedRoom}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* The Golden Rule of Interval Overlap */}
        <div style={{ marginTop: "20px", background: "var(--bg-subtle)", padding: "14px 18px", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
          💡 <strong>The Golden Rule for Interviews:</strong> If Meeting 1 ends at <strong>10:00</strong> and Meeting 2 starts at <strong>10:00</strong>, they <strong>DO NOT</strong> conflict! That is why we compare <code style={{ color: "#a5b4fc" }}>next_start &lt; prev_end</code> (strictly less, not less-than-or-equal).
        </div>
      </div>
    </div>
  );
}
