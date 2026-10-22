import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Calendar,
  Zap,
  Play,
  Square,
  RotateCcw,
  Code,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus
} from "lucide-react";
import { apiFetch } from "../utils/api";

// Pure, 100% accurate dry-run step generator
function generateDryRunSteps(rawIntervals) {
  if (!rawIntervals || rawIntervals.length === 0) return [];
  
  // 1. Sort meetings chronologically
  const sorted = [...rawIntervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const steps = [];

  // Step 0: Sorted Queue Overview
  steps.push({
    stepIndex: 0,
    title: "Step 0: Chronological Sort",
    currentMeetingIndex: -1,
    currentMeeting: null,
    heap: [],
    rooms: {},
    isFirst: false,
    isReused: false,
    compFormula: `Sorted ${sorted.length} meetings chronologically: ${sorted.map((m) => `[${m[0]}, ${m[1]}]`).join(", ")}`,
    decision: {
      type: "info",
      headline: "Sort meetings by start time",
      sub1: `Meetings sorted: ${sorted.map((m) => `[${m[0]}, ${m[1]}]`).join(", ")}`,
      sub2: "Greedy principle: always evaluate meetings in timeline order.",
      sub3: "Enables O(1) comparison against the Min-Heap earliest free room.",
      why: [
        "Sorting takes O(n log n) time.",
        "Allows us to sweep forward in time without ever looking back.",
        "Min-Heap will track end times of all currently occupied rooms.",
      ],
    },
    logText: `sort_meetings() → Chronological order: ${sorted.map((m) => `[${m[0]}, ${m[1]}]`).join(", ")}`,
  });

  // Step-by-step Min-Heap simulation
  const busyHeap = []; // array of { endTime, roomId, interval }
  const freeRoomsPool = [];
  let nextRoomId = 1;
  const roomAllocations = {};

  for (let i = 0; i < sorted.length; i++) {
    const meeting = sorted[i];
    const [start, end] = meeting;
    const earliestEndBefore = busyHeap.length > 0 ? busyHeap[0].endTime : null;

    // Release all rooms whose meeting ended at or before current start time
    const freedList = [];
    while (busyHeap.length > 0 && busyHeap[0].endTime <= start) {
      const freed = busyHeap.shift();
      freeRoomsPool.push(freed.roomId);
      freedList.push(freed);
    }
    freeRoomsPool.sort((a, b) => a - b);

    let assignedRoomId;
    let isReused = false;

    if (freeRoomsPool.length > 0) {
      assignedRoomId = freeRoomsPool.shift();
      isReused = true;
    } else {
      assignedRoomId = nextRoomId;
      nextRoomId += 1;
    }

    if (!roomAllocations[assignedRoomId]) {
      roomAllocations[assignedRoomId] = [];
    }
    roomAllocations[assignedRoomId].push({ start, end });

    // Push new meeting to busyHeap
    busyHeap.push({ endTime: end, roomId: assignedRoomId, interval: meeting });
    busyHeap.sort((a, b) => a.endTime - b.endTime); // maintain min-heap order

    const heapSnapshot = busyHeap.map((b) => ({
      endTime: b.endTime,
      roomId: b.roomId,
      interval: b.interval,
    }));

    const isFirst = i === 0;
    let compFormula = "";
    if (isFirst) {
      compFormula = `First meeting → Opened Room 1 (ends at T = ${end})`;
    } else if (isReused) {
      compFormula = `start (${start}) >= earliest free (${earliestEndBefore}) → Room ${assignedRoomId} freed! Reused room`;
    } else {
      compFormula = `start (${start}) < earliest free (${earliestEndBefore}) → All rooms busy! Conflict: Opened Room ${assignedRoomId}`;
    }

    steps.push({
      stepIndex: i + 1,
      title: `Meeting ${i + 1} of ${sorted.length}: [${start}, ${end}]`,
      currentMeetingIndex: i,
      currentMeeting: meeting,
      prevHeapRoot: earliestEndBefore,
      isFirst,
      isReused,
      compFormula,
      heap: heapSnapshot,
      rooms: JSON.parse(JSON.stringify(roomAllocations)),
      decision: isReused
        ? {
            type: "success",
            headline: `Room ${assignedRoomId} Reused at T = ${start}!`,
            sub1: `Meeting [${start}, ${end}] starts at T = ${start}.`,
            sub2: `Room ${assignedRoomId} finished earlier (at T = ${earliestEndBefore} <= ${start}).`,
            sub3: `Reused Room ${assignedRoomId} without opening a new room.`,
            why: [
              `Start time ${start} >= freed room finish time ${earliestEndBefore}.`,
              `Greedily reuse existing room instead of opening an extra room.`,
              `Earliest room in Min-Heap now frees at T = ${busyHeap[0].endTime}.`,
            ],
          }
        : {
            type: isFirst ? "info" : "danger",
            headline: isFirst
              ? `Room 1 Opened for [${start}, ${end}]`
              : `Conflict at T = ${start}! Room ${assignedRoomId} Opened`,
            sub1: `Meeting [${start}, ${end}] starts at T = ${start}.`,
            sub2: isFirst
              ? `Heap was empty. Opened Room 1 (ends at T = ${end}).`
              : `Earliest free room is at T = ${earliestEndBefore}, but new meeting starts at T = ${start}!`,
            sub3: isFirst
              ? `Min-Heap root is now T = ${end}.`
              : `Opened brand-new Room ${assignedRoomId}. Active rooms: ${busyHeap.length}.`,
            why: [
              isFirst
                ? "First meeting always takes a fresh room."
                : `Meeting arrives at T = ${start} before any occupied room finishes (${start} < ${earliestEndBefore}).`,
              "Parallel room required to accommodate simultaneous meeting overlap.",
              `Min-Heap updated with new end time T = ${end}.`,
            ],
          },
      logText: isReused
        ? `Step ${i + 1}: [${start}, ${end}] → Reused Room ${assignedRoomId} (Heap: [${heapSnapshot.map((h) => h.endTime).join(", ")}])`
        : `Step ${i + 1}: [${start}, ${end}] → Opened Room ${assignedRoomId} (Heap: [${heapSnapshot.map((h) => h.endTime).join(", ")}])`,
    });
  }

  // Summary Step
  const totalRooms = nextRoomId - 1;
  const canAttend = totalRooms <= 1;

  steps.push({
    stepIndex: sorted.length + 1,
    title: "Dry Run Complete",
    currentMeetingIndex: -1,
    currentMeeting: null,
    prevHeapRoot: null,
    isFirst: false,
    isReused: false,
    compFormula: `Dry Run Verdict: Peak ${totalRooms} Room${totalRooms > 1 ? "s" : ""} Required (${canAttend ? "1 person CAN attend all" : "1 person CANNOT attend all"})`,
    heap: busyHeap.map((b) => ({ endTime: b.endTime, roomId: b.roomId, interval: b.interval })),
    rooms: JSON.parse(JSON.stringify(roomAllocations)),
    decision: {
      type: canAttend ? "success" : "info",
      headline: `Dry Run Complete: ${totalRooms} Room${totalRooms > 1 ? "s" : ""} Required`,
      sub1: canAttend
        ? "✅ 1 person CAN attend all meetings without any conflicts."
        : `❌ 1 person CANNOT attend all meetings (Peak overlap: ${totalRooms} rooms).`,
      sub2: `Processed all ${sorted.length} meetings through the Min-Heap simulation.`,
      sub3: `Minimum rooms mathematically required: ${totalRooms}.`,
      why: [
        `Sorting took O(n log n) time.`,
        `Heap push/pop took O(log k) per meeting.`,
        `Overall time complexity: O(n log n). Space complexity: O(n).`,
      ],
    },
    logText: `Verdict: ${totalRooms} Room(s) Required. Attendance: ${canAttend ? "CAN attend all" : "CANNOT attend all"}.`,
  });

  return steps;
}

export default function SchedulerSection({ onSwitchToLRU, autoStartDemo }) {
  // Meeting presets
  const presets = [
    { label: "Classic (2 Rooms)", data: [[0, 30], [5, 10], [15, 20]] },
    { label: "1 Room (Clean)", data: [[7, 10], [2, 4]] },
    { label: "Identical [8, 9]", data: [[1, 5], [8, 9], [8, 9]] },
    { label: "Peak 3 Rooms", data: [[1, 18], [18, 23], [15, 29], [4, 15]] },
  ];

  const [intervals, setIntervals] = useState([[0, 30], [5, 10], [15, 20]]);
  const [customStart, setCustomStart] = useState("10");
  const [customEnd, setCustomEnd] = useState("25");
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Compute all dry-run steps for the current intervals
  const steps = generateDryRunSteps(intervals);
  const currentStep = steps[currentStepIndex] || steps[0] || {};
  const sortedMeetings = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const autoPlayTimer = useRef(null);

  // Auto-play step navigation
  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      autoPlayTimer.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(autoPlayTimer.current);
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1900);
    }
  };

  useEffect(() => {
    if (autoStartDemo) {
      handleToggleAutoPlay();
    }
    return () => clearInterval(autoPlayTimer.current);
  }, [autoStartDemo]);

  // Stepper handlers
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    clearInterval(autoPlayTimer.current);
    setIsAutoPlaying(false);
    setCurrentStepIndex(1);
  };

  const handleApplyPreset = (data) => {
    clearInterval(autoPlayTimer.current);
    setIsAutoPlaying(false);
    setIntervals(data);
    setCurrentStepIndex(1);
  };

  const handleAddMeeting = () => {
    const s = parseInt(customStart, 10);
    const e = parseInt(customEnd, 10);
    if (isNaN(s) || isNaN(e) || s >= e) {
      alert("Please enter valid start < end numbers.");
      return;
    }
    const updated = [...intervals, [s, e]];
    setIntervals(updated);
    setCurrentStepIndex(1);
  };

  // Group rooms for visualization
  const roomsMap = currentStep.rooms || {};
  const roomKeys = Object.keys(roomsMap).sort((a, b) => Number(a) - Number(b));

  // Logs up to current step
  const visibleLogs = steps.slice(0, currentStepIndex + 1).map((s, idx) => ({
    step: idx + 1,
    text: s.logText,
    time: `10:25:0${Math.min(idx * 3 + 1, 59)}`,
  }));

  // Python Reference Code
  const codeLines = [
    { num: 1, text: "import heapq" },
    { num: 2, text: "" },
    { num: 3, text: "def min_rooms_required(intervals: list[list[int]]) -> int:" },
    { num: 4, text: "    if not intervals: return 0" },
    { num: 5, text: "    # 1. Sort meetings chronologically by start time" },
    { num: 6, text: "    intervals.sort(key=lambda x: x[0])" },
    { num: 7, text: "    # 2. Min-Heap of active room end times" },
    { num: 8, text: "    heap = [intervals[0][1]]" },
    { num: 9, text: "    for start, end in intervals[1:]:" },
    { num: 10, text: "        # If earliest room finishes before meeting, reuse it" },
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
            title="Toggle automatic dry-run simulation"
          >
            {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isAutoPlaying ? "Pause" : "▶ Run Demo"}</span>
          </button>
          <div className="complexity-badge-right">
            <Zap size={13} className="bolt-icon" />
            <span>O(n log n) Min-Heap</span>
          </div>
        </div>
      </div>

      {/* Top 3-Column Grid */}
      <div className="playground-3col-grid">
        {/* CARD 1: 1. Controls & Dry Run Stepper */}
        <div className="playground-card card-controls">
          <div className="card-header-simple">
            <h3 className="card-title">1. Dry Run Controls</h3>
            <p className="card-desc">Step-by-step trace through each meeting interval.</p>
          </div>

          <div className="card-controls-body">
            {/* Direct One-Click Dry Run Controls */}
            <div className="direct-run-banner">
              <button
                type="button"
                className={`btn-direct-run-main ${isAutoPlaying ? "running" : ""}`}
                onClick={handleToggleAutoPlay}
                id="btn-run-scheduler-directly"
              >
                {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                <span>{isAutoPlaying ? "Pause Dry Run" : "▶ Auto Dry Run"}</span>
              </button>
              <button
                type="button"
                className="btn-direct-step-next"
                onClick={handleNext}
                disabled={currentStepIndex >= steps.length - 1}
                title="Next meeting in dry run"
              >
                <span>Next ›</span>
              </button>
            </div>

            {/* Stepper Status Badge */}
            <div className="dryrun-stepper-row">
              <button
                type="button"
                className="btn-stepper-arrow"
                onClick={handlePrev}
                disabled={currentStepIndex <= 0}
                title="Previous step"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="stepper-status-text">
                {currentStepIndex === 0
                  ? "Step 0: Sorted Queue"
                  : currentStepIndex > sortedMeetings.length
                  ? "Complete: Final Result"
                  : `Meeting ${currentStepIndex}/${sortedMeetings.length}: [${currentStep.currentMeeting ? currentStep.currentMeeting.join(",") : ""}]`}
              </span>
              <button
                type="button"
                className="btn-stepper-arrow"
                onClick={handleNext}
                disabled={currentStepIndex >= steps.length - 1}
                title="Next step"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Example Presets */}
            <div className="example-ops-container">
              <span className="example-ops-heading">Example Presets</span>
              <div className="example-ops-grid">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn-op-pill ${JSON.stringify(intervals) === JSON.stringify(p.data) ? "active-preset" : ""}`}
                    onClick={() => handleApplyPreset(p.data)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Meeting */}
            <div className="control-field-row" style={{ marginTop: "4px" }}>
              <span className="control-field-label">Custom [S, E]</span>
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

            <div className="actions-button-pair" style={{ marginTop: "4px" }}>
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
                onClick={handleReset}
              >
                <RotateCcw size={12} style={{ display: "inline", marginRight: "4px" }} />
                Restart Trace
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: 2. Dry Run Visualization (Accurate & Intuitive) */}
        <div className="playground-card card-visualization">
          <div className="card-header-simple">
            <h3 className="card-title">2. Dry Run Visualization</h3>
            <p className="card-desc">Sorted queue, active rooms, and live Min-Heap at this step.</p>
          </div>

          <div className="dryrun-simple-board">
            {/* Box 1: Meetings Queue */}
            <div className="dryrun-box-panel">
              <div className="dryrun-box-header">
                <span className="dryrun-box-title">Meetings Queue (Chronological)</span>
                <span className="dryrun-box-count">{sortedMeetings.length} Meetings</span>
              </div>
              <div className="dryrun-meetings-row">
                {sortedMeetings.map((m, idx) => {
                  const isDone = idx < currentStep.currentMeetingIndex;
                  const isCurrent = idx === currentStep.currentMeetingIndex;
                  return (
                    <div
                      key={idx}
                      className={`dryrun-m-card ${isCurrent ? "current" : isDone ? "done" : "pending"}`}
                    >
                      <div className="m-card-top">
                        <span className="m-card-idx">#{idx + 1}</span>
                        <span className={`m-card-status ${isCurrent ? "status-active" : isDone ? "status-done" : "status-pending"}`}>
                          {isCurrent ? "ACTIVE" : isDone ? "DONE" : "WAITING"}
                        </span>
                      </div>
                      <div className="m-card-interval">[{m[0]}, {m[1]}]</div>
                      <div className="m-card-dur">T = {m[0]} → {m[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Decision Banner */}
            {currentStep.compFormula && (
              <div className={`dryrun-step-banner ${currentStep.isReused ? "reused" : currentStep.isFirst ? "first" : currentStep.stepIndex > sortedMeetings.length ? "complete" : "conflict"}`}>
                <span className="step-banner-tag">Dry Run Step:</span>
                <span className="step-banner-eval">{currentStep.compFormula}</span>
              </div>
            )}

            {/* Box 3: Active Rooms (Min-Heap State) */}
            <div className="dryrun-box-panel">
              <div className="dryrun-box-header">
                <span className="dryrun-box-title">Active Rooms in Min-Heap</span>
                <span className="dryrun-box-count">
                  {currentStep.heap && currentStep.heap.length > 0 ? `${currentStep.heap.length} Room${currentStep.heap.length > 1 ? "s" : ""} Occupied` : "0 Rooms"}
                </span>
              </div>

              <div className="dryrun-rooms-grid">
                {(!currentStep.heap || currentStep.heap.length === 0) ? (
                  <div className="dryrun-rooms-empty">
                    Min-Heap is empty — no rooms occupied at this step.
                  </div>
                ) : (
                  currentStep.heap.map((h, idx) => {
                    const isEarliest = idx === 0;
                    return (
                      <div key={idx} className={`dryrun-room-box ${isEarliest ? "earliest-room" : ""}`}>
                        <div className="room-box-top">
                          <span className="room-box-name">Room {h.roomId}</span>
                          {isEarliest && <span className="room-earliest-badge">★ Earliest Free</span>}
                        </div>
                        <div className="room-box-time">
                          <span className="room-time-label">Occupied until</span>
                          <span className="room-time-val">T = {h.endTime}</span>
                        </div>
                        <div className="room-box-meeting">
                          Meeting: [{h.interval ? h.interval.join(", ") : ""}]
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: 3. What just happened? (Accurate Decision Trace) */}
        <div className="playground-card card-explanation">
          <div className="card-header-simple">
            <h3 className="card-title">3. What just happened?</h3>
            <p className="card-desc">Exact algorithmic decision made at this step.</p>
          </div>

          <div className="card-explanation-body">
            {/* Status Alert Banner */}
            <div className={`status-alert-card ${currentStep.decision ? currentStep.decision.type : "info"}`}>
              <div className="status-alert-icon-col">
                {currentStep.decision && currentStep.decision.type === "success" ? (
                  <CheckCircle2 size={24} className="icon-hit-success" />
                ) : currentStep.decision && currentStep.decision.type === "danger" ? (
                  <AlertTriangle size={24} className="icon-miss-danger" />
                ) : (
                  <CheckCircle2 size={24} className="icon-put-info" />
                )}
              </div>
              <div className="status-alert-text-col">
                <h4 className="status-alert-title">{currentStep.decision ? currentStep.decision.headline : "Ready"}</h4>
                <p className="status-alert-sub">{currentStep.decision ? currentStep.decision.sub1 : ""}</p>
                {currentStep.decision && currentStep.decision.sub2 && (
                  <p className="status-alert-sub">{currentStep.decision.sub2}</p>
                )}
                {currentStep.decision && currentStep.decision.sub3 && (
                  <p className="status-alert-sub">{currentStep.decision.sub3}</p>
                )}
              </div>
            </div>

            {/* Why? Section */}
            <div className="why-explanation-section">
              <h4 className="why-heading">Why?</h4>
              <ul className="why-bullet-list">
                {currentStep.decision && currentStep.decision.why ? (
                  currentStep.decision.why.map((b, i) => <li key={i}>{b}</li>)
                ) : (
                  <li>Click 'Next ›' or '▶ Auto Dry Run' to trace through the meetings.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 4. Operation Log */}
      <div className="playground-card card-operation-log">
        <div className="oplog-top-bar">
          <div className="oplog-title-area">
            <h3 className="card-title">4. Dry Run Execution Log</h3>
            <p className="card-desc">Step-by-step trace of meetings, heap mutations, and room assignments.</p>
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
          {visibleLogs.slice(-3).map((item, idx) => (
            <div key={item.step || idx} className="oplog-item-row">
              <div className="oplog-item-left">
                <span className="oplog-step-badge">{item.step}</span>
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
                  <div key={line.num} className="code-line-row">
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
