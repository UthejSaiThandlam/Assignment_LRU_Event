import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Calendar,
  Zap,
  Play,
  Square,
  RotateCcw,
  Code,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus
} from "lucide-react";
import { apiFetch } from "../utils/api";

export default function SchedulerSection({ onSwitchToLRU, autoStartDemo }) {
  const [intervals, setIntervals] = useState([
    [0, 30],
    [5, 10],
    [15, 20],
  ]);
  const [customStart, setCustomStart] = useState("10");
  const [customEnd, setCustomEnd] = useState("25");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [activeCodeLine, setActiveCodeLine] = useState(11);
  const [currentTimeCursor, setCurrentTimeCursor] = useState(null);

  // Status and explanation
  const [explanation, setExplanation] = useState({
    statusType: "info", // "info" | "success" | "danger"
    headline: "2 Rooms Required",
    sub1: "Peak concurrency of 2 simultaneous meetings.",
    sub2: "Calculated via Greedy Sorting + Min-Heap in O(n log n) time.",
    sub3: "Optimal room distribution achieved.",
    bullets: [
      "Sorted meetings chronologically by start time: [0, 30], [5, 10], [15, 20].",
      "Meeting [5, 10] overlaps with [0, 30] -> Room 2 allocated.",
      "Meeting [15, 20] reuses Room 2 after [5, 10] finishes at T=10.",
      "Total minimum rooms needed: 2.",
    ],
  });

  // Operation logs
  const [logs, setLogs] = useState([
    { step: 1, text: "sort_meetings() - Chronological ordering: [[0, 30], [5, 10], [15, 20]]", time: "10:25:01" },
    { step: 2, text: "heap_push(30) - Room 1 assigned to [0, 30]", time: "10:25:03" },
    { step: 3, text: "heap_push(10) - Overlap! Room 2 assigned to [5, 10]", time: "10:25:05" },
    { step: 4, text: "heap_pop(10) & push(20) - Room 2 reused for [15, 20]", time: "10:25:08" },
  ]);

  const [activeRooms, setActiveRooms] = useState([
    { room: 1, meeting: [0, 30], start: 0, end: 30, color: "room-blue" },
    { room: 2, meeting: [5, 10], start: 5, end: 10, color: "room-pink" },
    { room: 2, meeting: [15, 20], start: 15, end: 20, color: "room-green" },
  ]);

  const [heapState, setHeapState] = useState([20, 30]);

  const autoPlayTimer = useRef(null);
  const stepCounter = useRef(4);

  const getTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  // Run calculation against FastAPI or local algorithm
  const calculateSchedule = async (currentIntervals) => {
    try {
      const res = await apiFetch("/api/scheduler/min_rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervals: currentIntervals }),
      });
      const data = await res.json();
      
      const resAttend = await apiFetch("/api/scheduler/can_attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervals: currentIntervals }),
      });
      const attendData = await resAttend.json();

      const resAssign = await apiFetch("/api/scheduler/assign_rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervals: currentIntervals }),
      });
      const assignData = await resAssign.json();

      const roomCount = data.min_rooms;
      const canAttend = attendData.can_attend;

      // Build allocated room blocks
      const colors = ["room-blue", "room-pink", "room-green", "room-purple", "room-amber"];
      const newActiveRooms = (assignData.assignments || []).map((asg, idx) => ({
        room: asg.room,
        meeting: asg.interval,
        start: asg.interval[0],
        end: asg.interval[1],
        color: colors[(asg.room - 1) % colors.length],
      }));
      setActiveRooms(newActiveRooms);

      // Build heap representation from end times
      const ends = currentIntervals.map((i) => i[1]).sort((a, b) => a - b);
      setHeapState(ends.slice(0, roomCount));

      stepCounter.current += 1;
      const newLog = {
        step: stepCounter.current,
        text: `solve_schedule() - Evaluated ${currentIntervals.length} meetings. Peak rooms: ${roomCount}`,
        time: getTimeString(),
      };
      setLogs((prev) => [...prev.slice(-4), newLog]);

      setExplanation({
        statusType: canAttend ? "success" : "info",
        headline: `${roomCount} Room${roomCount > 1 ? "s" : ""} Required`,
        sub1: canAttend ? "Single person CAN attend all meetings (0 conflicts)." : `Single person CANNOT attend all meetings (needs ${roomCount} rooms).`,
        sub2: `Peak simultaneous overlap of ${roomCount} meetings.`,
        sub3: "Greedy chronological sweep O(n log n).",
        bullets: [
          `Meetings sorted by start time: ${currentIntervals.map((i) => `[${i[0]}, ${i[1]}]`).join(", ")}.`,
          `Min-Heap tracked active meeting end times to reuse rooms eagerly.`,
          canAttend
            ? "Adjacent meetings do not overlap (end_prev <= start_next)."
            : "Concurrent time windows required parallel room allocation.",
          `Mathematical minimum rooms needed: ${roomCount}.`,
        ],
      });
    } catch {
      // Local fallback calculation
      const sorted = [...currentIntervals].sort((a, b) => a[0] - b[0]);
      let rooms = [];
      for (const m of sorted) {
        let placed = false;
        for (let r = 0; r < rooms.length; r++) {
          if (rooms[r][rooms[r].length - 1][1] <= m[0]) {
            rooms[r].push(m);
            placed = true;
            break;
          }
        }
        if (!placed) rooms.push([m]);
      }
      const roomCount = rooms.length;
      setHeapState(sorted.map((i) => i[1]).sort((a, b) => a - b).slice(0, roomCount));
    }
  };

  // Preset Selection
  const applyPreset = (preset) => {
    setIntervals(preset);
    calculateSchedule(preset);
  };

  // Add custom meeting
  const handleAddMeeting = () => {
    const s = parseInt(customStart, 10);
    const e = parseInt(customEnd, 10);
    if (isNaN(s) || isNaN(e) || s >= e) {
      alert("Please enter a valid interval where start < end.");
      return;
    }
    const updated = [...intervals, [s, e]];
    setIntervals(updated);
    calculateSchedule(updated);
  };

  // Reset
  const handleReset = () => {
    const initial = [
      [0, 30],
      [5, 10],
      [15, 20],
    ];
    setIntervals(initial);
    calculateSchedule(initial);
  };

  const presetList = [
    [[0, 30], [5, 10], [15, 20]],
    [[7, 10], [2, 4]],
    [[1, 5], [8, 9], [8, 9]],
    [[1, 18], [18, 23], [15, 29], [4, 15], [2, 11], [5, 13]],
  ];
  const stepIndex = useRef(0);

  const handleNextStep = () => {
    stepIndex.current = (stepIndex.current + 1) % presetList.length;
    applyPreset(presetList[stepIndex.current]);
  };

  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      handleNextStep();
      autoPlayTimer.current = setInterval(() => {
        handleNextStep();
      }, 2400);
    }
  };

  useEffect(() => {
    return () => clearInterval(autoPlayTimer.current);
  }, []);

  // Max time for timeline scale
  const maxTime = Math.max(...intervals.map((i) => i[1]), 30);

  // Group rooms by room index
  const roomsMap = {};
  activeRooms.forEach((ar) => {
    if (!roomsMap[ar.room]) roomsMap[ar.room] = [];
    roomsMap[ar.room].push(ar);
  });
  const roomKeys = Object.keys(roomsMap).sort((a, b) => Number(a) - Number(b));

  // Python Scheduler Code
  const codeLines = [
    { num: 1, text: "import heapq" },
    { num: 2, text: "" },
    { num: 3, text: "def min_rooms_required(intervals: list[list[int]]) -> int:" },
    { num: 4, text: "    if not intervals: return 0" },
    { num: 5, text: "    # 1. Sort meetings chronologically by start time" },
    { num: 6, text: "    intervals.sort(key=lambda x: x[0])" },
    { num: 7, text: "    # 2. Min-Heap of meeting end times" },
    { num: 8, text: "    heap = [intervals[0][1]]" },
    { num: 9, text: "    for start, end in intervals[1:]:" },
    { num: 10, text: "        # If room frees up before meeting starts, reuse room" },
    { num: 11, text: "        if heap[0] <= start:" },
    { num: 12, text: "            heapq.heappop(heap)" },
    { num: 13, text: "        heapq.heappush(heap, end)" },
    { num: 14, text: "    return len(heap)  # Peak concurrent rooms" },
  ];

  return (
    <div className="playground-view-container">
      {/* Subheader Tab Navigation Bar */}
      <div className="subnav-tab-bar">
        <div className="tab-pills-group">
          <button 
            className="tab-pill inactive" 
            type="button" 
            onClick={onSwitchToLRU}
          >
            <Database size={15} />
            <span>LRU Cache</span>
          </button>
          <button className="tab-pill active" type="button">
            <Calendar size={15} />
            <span>Meeting Room Scheduler</span>
          </button>
        </div>

        <div className="subnav-right-actions">
          <button
            type="button"
            className={`subnav-quick-run-btn ${isAutoPlaying ? "running" : ""}`}
            onClick={handleToggleAutoPlay}
            title="Toggle automatic scheduler simulation"
          >
            {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isAutoPlaying ? "Pause Simulation" : "▶ Run Demo"}</span>
          </button>
          <div className="complexity-badge-right">
            <Zap size={13} className="bolt-icon" />
            <span>Expected O(n log n) Min-Heap</span>
          </div>
        </div>
      </div>

      {/* Top 3-Column Grid */}
      <div className="playground-3col-grid">
        {/* CARD 1: 1. Controls */}
        <div className="playground-card card-controls">
          <div className="card-header-simple">
            <h3 className="card-title">1. Controls</h3>
            <p className="card-desc">Configure meeting intervals and evaluate room allocation.</p>
          </div>

          <div className="card-controls-body">
            {/* DIRECT ONE-CLICK RUN BUTTON */}
            <div className="direct-run-banner">
              <button
                type="button"
                className={`btn-direct-run-main ${isAutoPlaying ? "running" : ""}`}
                onClick={handleToggleAutoPlay}
                id="btn-run-scheduler-directly"
              >
                {isAutoPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{isAutoPlaying ? "Pause Simulation" : "▶ Run Here Directly"}</span>
              </button>
              <button
                type="button"
                className="btn-direct-step-next"
                onClick={handleNextStep}
                title="Evaluate next preset immediately"
              >
                <span>Next &gt;</span>
              </button>
            </div>
            {/* Add Meeting Inputs */}
            <div className="control-field-row">
              <span className="control-field-label">Start / End</span>
              <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                <input
                  type="number"
                  className="control-text-input"
                  style={{ width: "50%" }}
                  placeholder="Start (e.g. 10)"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="number"
                  className="control-text-input"
                  style={{ width: "50%" }}
                  placeholder="End (e.g. 25)"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons: Add Meeting */}
            <div className="actions-button-pair">
              <button
                type="button"
                className="btn-put-primary"
                onClick={handleAddMeeting}
              >
                + Add Meeting
              </button>
              <button
                type="button"
                className="btn-get-primary"
                onClick={() => calculateSchedule(intervals)}
              >
                Re-evaluate
              </button>
            </div>

            {/* Example Presets */}
            <div className="example-ops-container">
              <span className="example-ops-heading">Example Presets</span>
              <div className="example-ops-grid">
                <button
                  type="button"
                  className="btn-op-pill"
                  onClick={() => applyPreset([[0, 30], [5, 10], [15, 20]])}
                >
                  Classic (2 Rooms)
                </button>
                <button
                  type="button"
                  className="btn-op-pill"
                  onClick={() => applyPreset([[7, 10], [2, 4]])}
                >
                  No Conflict (1 Room)
                </button>
                <button
                  type="button"
                  className="btn-op-pill"
                  onClick={() => applyPreset([[1, 5], [8, 9], [8, 9]])}
                >
                  Identical Overlap
                </button>
                <button
                  type="button"
                  className="btn-op-pill"
                  onClick={() => applyPreset([[1, 18], [18, 23], [15, 29], [4, 15], [2, 11], [5, 13]])}
                >
                  Heavy Concurrency
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="reset-button-wrapper">
              <button
                type="button"
                className="btn-reset-link"
                onClick={handleReset}
              >
                <RotateCcw size={13} />
                <span>Reset Intervals</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: 2. Timeline & Heap Visualization */}
        <div className="playground-card card-visualization">
          <div className="card-header-simple">
            <h3 className="card-title">2. Timeline & Allocation</h3>
            <p className="card-desc">Gantt schedule of allocated rooms with active Min-Heap end times.</p>
          </div>

          <div className="card-visualization-body">
            {/* Timeline Gantt Chart */}
            <div className="timeline-gantt-board">
              {roomKeys.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
                  No active meetings. Add an interval to begin.
                </div>
              ) : (
                roomKeys.map((rk) => {
                  const meetingsInRoom = roomsMap[rk] || [];
                  return (
                    <div key={rk} className="gantt-room-row">
                      <div className="gantt-room-tag">Room {rk}</div>
                      <div className="gantt-room-track">
                        {meetingsInRoom.map((m, idx) => {
                          const leftPct = (m.start / maxTime) * 100;
                          const widthPct = Math.max(((m.end - m.start) / maxTime) * 100, 6);
                          return (
                            <div
                              key={idx}
                              className={`gantt-meeting-block ${m.color}`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              title={`[${m.start}, ${m.end}] in Room ${rk}`}
                            >
                              <span>[{m.start}, {m.end}]</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Min-Heap Priority Queue View */}
            <div className="hashmap-section" style={{ marginTop: "12px" }}>
              <h4 className="hashmap-heading">Active Min-Heap Priority Queue (Earliest End Times)</h4>
              <div className="hashmap-table">
                {heapState.map((endTime, idx) => (
                  <div key={idx} className="hashmap-entry-row">
                    <span className={`hashmap-key-badge ${idx === 0 ? "key-burgundy" : "key-blue"}`}>
                      {idx === 0 ? "ROOT" : `Slot ${idx + 1}`}
                    </span>
                    <span className="hashmap-map-arrow">→</span>
                    <div className="hashmap-target-pill">
                      Active room freed at T = {endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: 3. What just happened? */}
        <div className="playground-card card-explanation">
          <div className="card-header-simple">
            <h3 className="card-title">3. What just happened?</h3>
            <p className="card-desc">Explanation of the current scheduling evaluation.</p>
          </div>

          <div className="card-explanation-body">
            {/* Status Alert Banner */}
            <div className={`status-alert-card ${explanation.statusType}`}>
              <div className="status-alert-icon-col">
                {explanation.statusType === "success" ? (
                  <CheckCircle2 size={24} className="icon-hit-success" />
                ) : (
                  <AlertTriangle size={24} className="icon-miss-danger" />
                )}
              </div>
              <div className="status-alert-text-col">
                <h4 className="status-alert-title">{explanation.headline}</h4>
                <p className="status-alert-sub">{explanation.sub1}</p>
                {explanation.sub2 && <p className="status-alert-sub">{explanation.sub2}</p>}
                {explanation.sub3 && <p className="status-alert-sub">{explanation.sub3}</p>}
              </div>
            </div>

            {/* Why? Section */}
            <div className="why-explanation-section">
              <h4 className="why-heading">Why?</h4>
              <ul className="why-bullet-list">
                {explanation.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 4. Operation Log */}
      <div className="playground-card card-operation-log">
        <div className="oplog-top-bar">
          <div className="oplog-title-area">
            <h3 className="card-title">4. Operation Log</h3>
            <p className="card-desc">Step-by-step meeting scheduling events and room releases.</p>
          </div>

          <div className="oplog-actions-area">
            <button
              type="button"
              className="btn-show-code-toggle"
              onClick={() => setShowCode(!showCode)}
            >
              <Code size={13} />
              <span>Show code {showCode ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

        {/* Log Entries */}
        <div className="oplog-items-list">
          {logs.slice(-3).map((item, idx) => (
            <div key={item.step || idx} className="oplog-item-row">
              <div className="oplog-item-left">
                <span className="oplog-step-badge">{item.step || idx + 1}</span>
                <span className="oplog-item-text">{item.text}</span>
              </div>
              <span className="oplog-item-time">{item.time}</span>
            </div>
          ))}
        </div>

        {/* Expandable Code Drawer */}
        {showCode && (
          <div className="code-drawer-panel">
            <div className="code-drawer-header">
              <span className="code-filename">scheduler.py (Python O(n log n) Min-Heap Algorithm)</span>
              <span className="code-lang">Python 3</span>
            </div>
            <pre className="code-pre">
              <code>
                {codeLines.map((line) => (
                  <div
                    key={line.num}
                    className={`code-line-row ${line.num === activeCodeLine ? "highlight-line" : ""}`}
                  >
                    <span className="line-num">{line.num}</span>
                    <span className="line-text">{line.text}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
