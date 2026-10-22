import React, { useState, useEffect, useRef } from "react";
import { Box, Play, Square, RotateCcw } from "lucide-react";
import { apiFetch } from "../utils/api";

export default function SchedulerSection({ autoStartDemo }) {
  const [inputText, setInputText] = useState("0, 30\n5, 10\n15, 20");
  const [highlightCode, setHighlightCode] = useState(true);
  const [activeCodeLine, setActiveCodeLine] = useState(8);

  const [events, setEvents] = useState([
    { id: 1, start: 0, end: 30, color: "blue", room: "Room 1" },
    { id: 2, start: 5, end: 10, color: "pink", room: "Room 2" },
    { id: 3, start: 15, end: 20, color: "green", room: "Room 2" },
  ]);

  const [minRooms, setMinRooms] = useState(2);
  const [heapArray, setHeapArray] = useState([10, 30, 20]);
  const [roomAllocations, setRoomAllocations] = useState([
    { room: "Room 1:", text: "(0, 30)", color: "blue" },
    { room: "Room 2:", text: "(5, 10)", color: "pink" },
    { room: "Room 3:", text: "(15, 20)", color: "green" },
  ]);

  const [executionSteps, setExecutionSteps] = useState([
    { id: 1, desc: "Sort intervals by start time", comp: "O(n log n)" },
    { id: 2, desc: "Process meeting (0, 30) - Add to heap: [30]", comp: "O(log n)" },
    { id: 3, desc: "Process meeting (5, 10) - Add to heap: [10, 30]", comp: "O(log n)" },
    { id: 4, desc: "Process meeting (15, 20) - Remove 10, Add 20: [20, 30]", comp: "O(log n)" },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [timelineData, setTimelineData] = useState([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [scanCursorPct, setScanCursorPct] = useState(null);
  const [activeMeetingId, setActiveMeetingId] = useState(null);
  const [heapBouncing, setHeapBouncing] = useState(false);

  const autoPlayTimer = useRef(null);

  const [explanation, setExplanation] = useState({
    title: "The minimum number of meeting rooms required is 2.",
    bullets: [
      "We sort the meetings by start time.",
      "Use a min-heap to keep track of meeting end times.",
      "If a meeting ends before the current one starts, we reuse the room.",
      "The size of the heap at any point gives the number of rooms in use.",
      "Time complexity: O(n log n) due to sorting and heap operations.",
    ],
  });

  // Parse lines to intervals
  const parseIntervals = (text) => {
    const lines = text.trim().split("\n");
    const parsed = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (parts[0] < parts[1]) {
          parsed.push([parts[0], parts[1]]);
        }
      }
    }
    return parsed;
  };

  // Run the full dynamic algorithm against backend
  const handleRunAlgorithm = async (customText = inputText) => {
    const rawIntervals = parseIntervals(customText);
    if (rawIntervals.length === 0) return;

    setActiveCodeLine(8);
    const colors = ["blue", "pink", "green", "blue", "pink", "green"];

    try {
      const resRooms = await apiFetch("/api/scheduler/min_rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: rawIntervals }),
      });
      const dataRooms = await resRooms.json();
      setMinRooms(dataRooms.min_rooms);
      setTimelineData(dataRooms.timeline || []);

      let assignments = [];
      try {
        const resAssign = await apiFetch("/api/scheduler/assign_rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: rawIntervals }),
        });
        const dataAssign = await resAssign.json();
        assignments = dataAssign.assignments || [];
      } catch {}

      const formatted = rawIntervals.map((inv, i) => ({
        id: i + 1,
        start: inv[0],
        end: inv[1],
        color: colors[i % colors.length],
        room: assignments[i] || `Room ${i + 1}`,
      }));
      setEvents(formatted);

      if (dataRooms.execution_steps && dataRooms.execution_steps.length > 0) {
        setExecutionSteps(
          dataRooms.execution_steps.map((s) => ({
            id: s.step_num,
            desc: s.desc,
            comp: s.complexity,
          }))
        );
      }

      if (dataRooms.heap_snapshot && dataRooms.heap_snapshot.length > 0) {
        setHeapArray(dataRooms.heap_snapshot);
      } else {
        setHeapArray([10, 30, 20]);
      }

      const allocRows = formatted.map((e, idx) => ({
        room: `${e.room || `Room ${idx + 1}`}:`,
        text: `(${e.start}, ${e.end})`,
        color: e.color,
      }));
      setRoomAllocations(allocRows);

      setExplanation({
        title: `The minimum number of meeting rooms required is ${dataRooms.min_rooms}.`,
        bullets: [
          `We sort the ${rawIntervals.length} meetings by start time.`,
          "Use a min-heap to keep track of meeting end times.",
          "If a meeting ends before the current one starts, we reuse the room.",
          "The size of the heap at any point gives the number of rooms in use.",
          "Time complexity: O(n log n) due to sorting and heap operations.",
        ],
      });
      setCurrentStepIndex(-1);
      setActiveMeetingId(null);
      setScanCursorPct(null);
    } catch {
      // Local fallback
      const sorted = [...rawIntervals].sort((a, b) => a[0] - b[0]);
      const ends = [];
      let maxR = 0;
      for (const [s, e] of sorted) {
        while (ends.length && Math.min(...ends) <= s) {
          ends.splice(ends.indexOf(Math.min(...ends)), 1);
        }
        ends.push(e);
        maxR = Math.max(maxR, ends.length);
      }
      setMinRooms(maxR);
      setHeapArray(ends);
    }
  };

  useEffect(() => {
    handleRunAlgorithm(inputText);
  }, []);

  // Step through simulation
  const handleStepClick = (step) => {
    setCurrentStepIndex(step.id);
    setHeapBouncing(true);
    setTimeout(() => setHeapBouncing(false), 500);

    if (step.id === 1) {
      setActiveCodeLine(6);
      setActiveMeetingId(null);
      setScanCursorPct(0);
      setExplanation({
        title: "Step 1: Sorting Intervals",
        bullets: [
          "Intervals are sorted chronologically by start time.",
          "This ensures meetings are processed in chronological arrival order.",
          "Time complexity: O(n log n)",
        ],
      });
      return;
    }

    const tIndex = step.id - 2;
    if (timelineData[tIndex]) {
      const state = timelineData[tIndex];
      setHeapArray(state.active_ends || []);

      if (events[tIndex]) {
        setActiveMeetingId(events[tIndex].id);
        const startVal = events[tIndex].start;
        const pct = ((startVal - minVal) / span) * 100;
        setScanCursorPct(Math.max(0, Math.min(100, pct)));
      }

      if (state.freed_ends && state.freed_ends.length > 0) {
        setActiveCodeLine(10);
      } else {
        setActiveCodeLine(13);
      }

      setExplanation({
        title: `Step ${step.id}: Meeting [${state.meeting[0]}, ${state.meeting[1]})`,
        bullets: [
          state.freed_ends && state.freed_ends.length > 0
            ? `Freed ${state.freed_ends.length} room(s) that finished at or before ${state.meeting[0]}.`
            : "No previous meetings finished; opened a new room.",
          `Active meetings in min-heap: [${(state.active_ends || []).join(", ")}].`,
          `Current concurrent rooms in use: ${state.rooms_occupied} (Peak: ${state.peak_so_far}).`,
          "Time complexity: O(log n)",
        ],
      });
    }
  };

  // Live Auto-Play Simulation
  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
      return;
    }

    setIsAutoPlaying(true);
    let stepIdx = 0;
    const total = executionSteps.length;

    // Reset to beginning
    handleStepClick(executionSteps[0]);
    stepIdx = 1;

    autoPlayTimer.current = setInterval(() => {
      if (stepIdx < total) {
        handleStepClick(executionSteps[stepIdx]);
        stepIdx++;
      } else {
        clearInterval(autoPlayTimer.current);
        setIsAutoPlaying(false);
      }
    }, 1400);
  };

  useEffect(() => {
    if (autoStartDemo) {
      const timer = setTimeout(() => {
        handleToggleAutoPlay();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStartDemo]);

  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, []);

  const setExample = (idx) => {
    let text = "";
    if (idx === 1) {
      text = "0, 30\n5, 10\n15, 20";
    } else if (idx === 2) {
      text = "7, 10\n2, 4";
    } else if (idx === 3) {
      text = "9, 11\n10, 12\n11, 13";
    }
    setInputText(text);
    handleRunAlgorithm(text);
  };

  const handleReset = () => {
    setInputText("0, 30\n5, 10\n15, 20");
    setExample(1);
    setScanCursorPct(null);
    setActiveMeetingId(null);
  };

  // Dynamic Timeline scale calculation
  const allNumbers = events.flatMap((e) => [e.start, e.end]);
  const minVal = allNumbers.length ? Math.min(...allNumbers) : 0;
  const maxVal = allNumbers.length ? Math.max(...allNumbers, 30) : 30;
  const span = Math.max(maxVal - minVal, 1);

  const generateTicks = () => {
    const ticks = [];
    const stepSize = Math.max(1, Math.round(span / 6));
    for (let val = Math.floor(minVal); val <= Math.ceil(maxVal); val += stepSize) {
      ticks.push(val);
      if (ticks.length >= 7) break;
    }
    if (!ticks.includes(Math.ceil(maxVal))) {
      ticks.push(Math.ceil(maxVal));
    }
    return ticks;
  };
  const axisTicks = generateTicks();

  const activeRoomsCount = heapArray.length;
  const concurrencyPct = minRooms > 0 ? Math.min(100, Math.round((activeRoomsCount / minRooms) * 100)) : 0;

  const codeLines = [
    { num: 1, text: "import heapq" },
    { num: 2, text: "" },
    { num: 3, text: "def min_meeting_rooms(intervals):" },
    { num: 4, text: "    if not intervals:" },
    { num: 5, text: "        return 0" },
    { num: 6, text: "    intervals.sort(key=lambda x: x[0])" },
    { num: 7, text: "    min_heap = []" },
    { num: 8, text: "    for start, end in intervals:" },
    { num: 9, text: "        # If earliest meeting ends, free the room" },
    { num: 10, text: "        if min_heap and min_heap[0] <= start:" },
    { num: 11, text: "            heapq.heappop(min_heap)" },
    { num: 12, text: "        # Allocate current meeting" },
    { num: 13, text: "        heapq.heappush(min_heap, end)" },
    { num: 14, text: "    return len(min_heap)" },
  ];

  return (
    <section className="algo-card" id="scheduler-section">
      {/* Card Header */}
      <div className="algo-card-header">
        <div className="card-title-left">
          <div className="icon-box green">
            <Box size={18} />
          </div>
          <div className="title-text-group">
            <div className="title-row">
              <h2>2. Meeting Room Scheduler</h2>
              <span className="pill-concept">Sorting + Min Heap</span>
            </div>
            <p className="card-subtitle">Given a list of meeting time intervals, find the minimum number of meeting rooms required.</p>
          </div>
        </div>

        <div className="card-badges-right">
          <div className="complexity-pill green">
            <span className="pill-label">Time Complexity</span>
            <span className="pill-val">O(n log n)</span>
          </div>
          <div className="complexity-pill purple">
            <span className="pill-label">Space Complexity</span>
            <span className="pill-val">O(n)</span>
          </div>
        </div>
      </div>

      {/* 3-Column Body: Balanced & Even */}
      <div className="card-3col-grid">
        {/* Col 1: Input Meetings (Balanced & Structured) */}
        <div className="col-controls">
          <div className="controls-top-group">
            <span className="section-label">Input Meetings</span>

            <textarea
              className="textarea-intervals"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <span className="helper-text">Format: start,end (one per line)</span>

            <div className="scheduler-action-row">
              <button
                className="btn-execute"
                style={{ flex: 1 }}
                onClick={() => handleRunAlgorithm()}
              >
                Run
              </button>
              <button
                className={`btn-autoplay ${isAutoPlaying ? "playing" : ""}`}
                onClick={handleToggleAutoPlay}
              >
                {isAutoPlaying ? <Square size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                <span>{isAutoPlaying ? "Stop" : "▶ Live Auto-Play"}</span>
              </button>
            </div>

            <span className="section-label" style={{ marginTop: "2px" }}>Example Inputs</span>
            <div className="example-inputs-row">
              <button className="btn-example-input" onClick={() => setExample(1)}>Ex 1</button>
              <button className="btn-example-input" onClick={() => setExample(2)}>Ex 2</button>
              <button className="btn-example-input" onClick={() => setExample(3)}>Ex 3</button>
              <button className="btn-example-input" onClick={handleReset} title="Reset"><RotateCcw size={11} /></button>
            </div>
          </div>

          {/* Live Scheduler Engine Metrics Panel */}
          <div className="metrics-status-box">
            <div className="metrics-header">
              <span className="metrics-title">
                <span className="live-dot" />
                Live Room Concurrency
              </span>
              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--badge-green-text)" }}>
                {activeRoomsCount}/{minRooms} Rooms ({concurrencyPct}%)
              </span>
            </div>
            <div className="meter-bar-track">
              <div
                className="meter-bar-fill"
                style={{ width: `${concurrencyPct}%` }}
              />
            </div>
            <div className="metrics-stats-row">
              <span>Total: <strong>{events.length}</strong></span>
              <span>Peak: <strong>{minRooms} Rms</strong></span>
              <span>Cursor: <strong>{scanCursorPct !== null ? `${Math.round(minVal + (span * scanCursorPct) / 100)}m` : "Ready"}</strong></span>
            </div>
          </div>
        </div>

        {/* Col 2: Timeline, Min Heap, Rooms Allocation, Execution Steps */}
        <div className="col-visual">
          {/* Timeline Visualization */}
          <div className="timeline-section-wrap">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-label">Timeline Visualization</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Rooms needed: <strong style={{ color: "#2563eb" }}>{minRooms}</strong>
              </span>
            </div>

            {/* Dynamic Axis Ruler */}
            <div className="timeline-axis-ruler">
              {axisTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>

            {/* Dynamic Meeting Bars with Laser Scan Indicator */}
            <div className="timeline-track-lanes">
              {scanCursorPct !== null && (
                <div
                  className="timeline-scan-cursor"
                  style={{ left: `${scanCursorPct}%` }}
                />
              )}

              {events.map((e) => {
                const leftPct = ((e.start - minVal) / span) * 100;
                const widthPct = Math.max(((e.end - e.start) / span) * 100, 8);
                const isActive = activeMeetingId === e.id;

                return (
                  <div key={e.id} className="meeting-bar-lane">
                    <div
                      className={`meeting-bar-elem ${e.color} ${isActive ? "active-scan" : ""}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        outline: isActive ? "2px solid #0284c7" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Meeting {e.id} ({e.start}, {e.end}) • {e.room}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subgrid: Min Heap & Rooms Allocation */}
          <div className="scheduler-subgrid">
            {/* Box A: Dynamic Min Heap (End Times) */}
            <div className="subbox-card">
              <span className="subbox-title">Min Heap (End Times)</span>
              {heapArray.length === 0 ? (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "14px 0" }}>
                  (Heap is empty)
                </div>
              ) : (
                <div className="heap-tree-wrap">
                  {/* Root Node */}
                  <div className={`heap-circle-node purple ${heapBouncing ? "bounce" : ""}`}>
                    {heapArray[0]}
                  </div>

                  {/* Branches if 2 or more nodes */}
                  {heapArray.length > 1 && <div className="heap-connector-line" />}

                  {/* Children Row */}
                  {heapArray.length > 1 && (
                    <div className="heap-children-row">
                      {heapArray[1] !== undefined && (
                        <div className={`heap-circle-node blue ${heapBouncing ? "bounce" : ""}`}>
                          {heapArray[1]}
                        </div>
                      )}
                      {heapArray[2] !== undefined && (
                        <div className={`heap-circle-node green ${heapBouncing ? "bounce" : ""}`}>
                          {heapArray[2]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box B: Dynamic Rooms Allocation */}
            <div className="subbox-card">
              <span className="subbox-title">Rooms Allocation</span>
              <div className="rooms-alloc-list">
                {roomAllocations.map((ra, i) => (
                  <div key={i} className="room-alloc-row">
                    <span className="room-alloc-label">{ra.room}</span>
                    <span className={`room-bar-pill ${ra.color}`}>{ra.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Execution Steps (Click to Inspect) */}
          <div className="execution-steps-wrap">
            <span className="section-label">Execution Steps (Click any step to inspect)</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "110px", overflowY: "auto" }}>
              {executionSteps.map((step) => {
                const isSelected = currentStepIndex === step.id;
                return (
                  <div
                    key={step.id}
                    className={`exec-step-row ${isSelected ? "active" : ""}`}
                    onClick={() => handleStepClick(step)}
                  >
                    <div className="exec-step-left">
                      <span className={`log-badge-num ${isSelected ? "green" : ""}`}>{step.id}</span>
                      <span className="exec-step-desc">{step.desc}</span>
                    </div>
                    <span className="exec-step-comp">{step.comp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Col 3: Code & Explanation */}
        <div className="col-code">
          <div className="code-header-bar">
            <span className="section-label">Code (Python)</span>
            <label className="toggle-switch-wrap">
              <span>Highlight Line</span>
              <input
                type="checkbox"
                className="switch-input"
                checked={highlightCode}
                onChange={(e) => setHighlightCode(e.target.checked)}
              />
            </label>
          </div>

          {/* Code Editor Block */}
          <div className="code-editor-box">
            {codeLines.map((line) => {
              const isHl = highlightCode && line.num === activeCodeLine;
              return (
                <div key={line.num} className={`code-line ${isHl ? "highlight" : ""}`}>
                  <span className="line-no">{line.num}</span>
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>

          {/* Dynamic Explanation Card */}
          <div className="explanation-card">
            <h4 className="explanation-title">{explanation.title}</h4>
            <ul className="explanation-bullets">
              {explanation.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
