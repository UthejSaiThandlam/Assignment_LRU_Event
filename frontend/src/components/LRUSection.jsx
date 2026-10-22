import React, { useState, useEffect, useRef } from "react";
import { Box, Play, Square, RotateCcw, Plus, Minus, Search, ArrowRight } from "lucide-react";
import { apiFetch } from "../utils/api";

export default function LRUSection({ autoStartDemo }) {
  const [capacity, setCapacity] = useState(5);
  const [keyInput, setKeyInput] = useState("1");
  const [valInput, setValInput] = useState("10");
  const [highlightCode, setHighlightCode] = useState(true);
  const [activeCodeLine, setActiveCodeLine] = useState(17);
  const [activeKey, setActiveKey] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Live Metrics
  const [metrics, setMetrics] = useState({
    hits: 1,
    misses: 0,
    evictions: 0,
  });

  // Balanced in-sync initial chain: [2: 20] (LRU), [3: 30], [1: 10] (MRU)
  const [nodes, setNodes] = useState([
    { key: "2", value: "20" },
    { key: "3", value: "30" },
    { key: "1", value: "10" },
  ]);

  const stepCounter = useRef(4);
  const autoPlayTimer = useRef(null);

  const [logs, setLogs] = useState([
    { step: 1, text: "put(1, 10) - Insert key 1 with value 10", time: "10:24:01", type: "put" },
    { step: 2, text: "put(2, 20) - Insert key 2 with value 20", time: "10:24:05", type: "put" },
    { step: 3, text: "put(3, 30) - Insert key 3 with value 30", time: "10:24:08", type: "put" },
    { step: 4, text: "get(1) - Hit! Returned 10 (moved to MRU)", time: "10:24:12", type: "get" },
  ]);

  const [explanation, setExplanation] = useState({
    title: "get(1) -> Hit! (Value: 10)",
    bullets: [
      "Key 1 was accessed in O(1) time via hash map lookup.",
      "Unlinked node 1 from its previous position.",
      "Promoted node 1 to the MRU position right before Tail sentinel.",
      "Time complexity: O(1)",
    ],
  });

  const getTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const triggerActiveKeyFlash = (k) => {
    setActiveKey(String(k));
    setTimeout(() => {
      setActiveKey(null);
    }, 700);
  };

  // Reinitialize clean synced state with backend on mount
  useEffect(() => {
    const initCleanState = async () => {
      try {
        await apiFetch("/api/lru/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capacity: 5 }),
        });
        await apiFetch("/api/lru/put", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "1", value: "10" }),
        });
        await apiFetch("/api/lru/put", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "2", value: "20" }),
        });
        await apiFetch("/api/lru/put", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "3", value: "30" }),
        });
        const res = await apiFetch("/api/lru/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "1" }),
        });
        const data = await res.json();
        if (data.state && data.state.chain) {
          setNodes(data.state.chain);
        }
      } catch (err) {
        console.warn("Could not sync with backend initial state", err);
      }
    };
    initCleanState();
  }, []);

  // When capacity changes smoothly via stepper or pills
  const handleCapacityChange = async (newVal) => {
    const parsedCap = Math.max(1, Math.min(10, parseInt(newVal, 10) || 1));
    if (parsedCap === capacity) return;
    setCapacity(parsedCap);
    setActiveCodeLine(3);

    let evictedItems = [];
    try {
      const res = await apiFetch("/api/lru/set_capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: parsedCap }),
      });
      const data = await res.json();
      if (data.evicted) {
        evictedItems = data.evicted;
      }
      if (data.state && data.state.chain) {
        setNodes(data.state.chain);
      }
    } catch {
      setNodes((prev) => {
        if (prev.length > parsedCap) {
          evictedItems = prev.slice(0, prev.length - parsedCap).map((n) => n.key);
          return prev.slice(prev.length - parsedCap);
        }
        return prev;
      });
    }

    if (evictedItems.length > 0) {
      setMetrics((prev) => ({ ...prev, evictions: prev.evictions + evictedItems.length }));
    }

    stepCounter.current += 1;
    const newLog = {
      step: stepCounter.current,
      text: evictedItems.length > 0
        ? `set_capacity(${parsedCap}) - Evicted ${evictedItems.join(", ")} to fit ${parsedCap}`
        : `set_capacity(${parsedCap}) - Maximum cache capacity set to ${parsedCap}`,
      time: getTimeString(),
      type: "config",
    };
    setLogs((prev) => [...prev.slice(-6), newLog]);

    setExplanation({
      title: `Capacity updated to ${parsedCap}`,
      bullets: [
        `Adjusted maximum cache storage limit to ${parsedCap}.`,
        evictedItems.length > 0
          ? `Evicted oldest node(s) (${evictedItems.join(", ")}) from LRU side to satisfy new capacity limit.`
          : `Cache has room for up to ${parsedCap} items before eviction occurs.`,
        "Time complexity: O(1)",
      ],
    });
  };

  // Smooth Direct Put Action
  const handlePut = async (customKey, customVal) => {
    const k = customKey !== undefined ? String(customKey) : keyInput.trim() || "1";
    const v = customVal !== undefined ? String(customVal) : valInput.trim() || `${k}0`;

    setKeyInput(k);
    setValInput(v);
    setActiveCodeLine(17);
    triggerActiveKeyFlash(k);

    let isUpdate = false;
    let evicted = null;

    try {
      const res = await apiFetch("/api/lru/put", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k, value: v }),
      });
      const data = await res.json();
      isUpdate = data.is_updated;
      evicted = data.evicted_key;
      if (data.state && data.state.chain) {
        setNodes(data.state.chain);
      }
    } catch {
      // Local fallback
      setNodes((prev) => {
        const exists = prev.some((n) => n.key === k);
        isUpdate = exists;
        const filtered = prev.filter((n) => n.key !== k);
        if (!exists && filtered.length >= capacity) {
          const lruNode = filtered.shift();
          evicted = lruNode?.key;
        }
        return [...filtered, { key: k, value: v }];
      });
    }

    if (evicted) {
      setMetrics((prev) => ({ ...prev, evictions: prev.evictions + 1 }));
    }

    stepCounter.current += 1;
    let logText = `put(${k}, ${v}) - Inserted key ${k} at MRU`;
    if (evicted) {
      logText = `put(${k}, ${v}) - Cache full! Evicted key ${evicted}, inserted ${k}`;
    } else if (isUpdate) {
      logText = `put(${k}, ${v}) - Updated key ${k} to value ${v} (moved to MRU)`;
    }

    const newLog = {
      step: stepCounter.current,
      text: logText,
      time: getTimeString(),
      type: "put",
    };
    setLogs((prev) => [...prev.slice(-6), newLog]);

    setExplanation({
      title: isUpdate ? `put(${k}, ${v}) -> Key Updated` : `put(${k}, ${v}) -> Inserted at MRU`,
      bullets: isUpdate
        ? [
            `Key '${k}' already exists in hash map. Value updated to '${v}'.`,
            `Unlinked node '${k}' from current position and moved to MRU end before Tail.`,
            "Time complexity: O(1)",
          ]
        : evicted
        ? [
            `Cache reached maximum capacity (${capacity}).`,
            `Evicted oldest LRU node '${evicted}' from head.next.`,
            `Appended new node '${k}' directly before Tail sentinel at MRU position.`,
            "Time complexity: O(1)",
          ]
        : [
            `Stored key '${k}' -> node mapping in the hash map.`,
            `Appended node '${k}' directly before Tail sentinel at MRU position.`,
            `Current items in cache: ${nodes.length + 1} / ${capacity}.`,
            "Time complexity: O(1)",
          ],
    });
  };

  // Smooth Direct Get Action
  const handleGet = async (customKey) => {
    const k = customKey !== undefined ? String(customKey) : keyInput.trim() || "1";
    setKeyInput(k);
    setActiveCodeLine(10);
    triggerActiveKeyFlash(k);

    let found = false;
    let foundValue = null;

    try {
      const res = await apiFetch("/api/lru/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k }),
      });
      const data = await res.json();
      found = data.found;
      foundValue = data.value;
      if (data.state && data.state.chain) {
        setNodes(data.state.chain);
      }
    } catch {
      // Local fallback
      setNodes((prev) => {
        const target = prev.find((n) => n.key === k);
        if (!target) return prev;
        found = true;
        foundValue = target.value;
        return [...prev.filter((n) => n.key !== k), target];
      });
    }

    if (found) {
      setMetrics((prev) => ({ ...prev, hits: prev.hits + 1 }));
      setValInput(String(foundValue));
    } else {
      setMetrics((prev) => ({ ...prev, misses: prev.misses + 1 }));
    }

    stepCounter.current += 1;
    const newLog = {
      step: stepCounter.current,
      text: found
        ? `get(${k}) - Hit! Returned value ${foundValue} (moved to MRU)`
        : `get(${k}) - Miss! Key '${k}' not in cache (-1)`,
      time: getTimeString(),
      type: found ? "get" : "miss",
    };
    setLogs((prev) => [...prev.slice(-6), newLog]);

    setExplanation({
      title: found ? `get(${k}) -> Hit! (Value: ${foundValue})` : `get(${k}) -> Cache Miss (-1)`,
      bullets: found
        ? [
            `Key '${k}' found in hash map in O(1) time with value '${foundValue}'.`,
            `Unlinked node '${k}' from doubly linked list.`,
            `Appended node '${k}' to MRU position right before Tail sentinel.`,
            "Time complexity: O(1)",
          ]
        : [
            `Key '${k}' was not found in hash map.`,
            `Returned -1 to signal cache miss.`,
            `Doubly linked list remains unchanged.`,
            "Time complexity: O(1)",
          ],
    });
  };

  // Reset Cache Cleanly
  const handleReset = async () => {
    setActiveCodeLine(2);
    try {
      await apiFetch("/api/lru/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity }),
      });
    } catch {}
    setNodes([]);
    stepCounter.current = 1;
    setMetrics({ hits: 0, misses: 0, evictions: 0 });
    setLogs([
      { step: 1, text: `Cache reset with capacity ${capacity}`, time: getTimeString(), type: "config" },
    ]);
    setExplanation({
      title: "Cache Reset",
      bullets: [
        `Initialized empty doubly linked list with sentinel Head and Tail.`,
        `Hash map cleared to store up to ${capacity} entries.`,
        `Capacity: ${capacity}.`,
        "Time complexity: O(1)",
      ],
    });
  };

  // Live Auto-Play Simulation
  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
      return;
    }

    setIsAutoPlaying(true);
    const demoSteps = [
      () => handlePut("1", "10"),
      () => handlePut("2", "20"),
      () => handlePut("3", "30"),
      () => handleGet("1"),
      () => handlePut("4", "40"),
      () => handleGet("2"),
      () => handlePut("5", "50"),
      () => handlePut("6", "60"), // triggers eviction
      () => handleGet("1"),
    ];

    let currentStep = 0;
    autoPlayTimer.current = setInterval(() => {
      if (currentStep < demoSteps.length) {
        demoSteps[currentStep]();
        currentStep++;
      } else {
        clearInterval(autoPlayTimer.current);
        setIsAutoPlaying(false);
      }
    }, 1300);
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

  const totalHitsMisses = metrics.hits + metrics.misses;
  const hitRatio = totalHitsMisses > 0 ? Math.round((metrics.hits / totalHitsMisses) * 100) : 0;
  const capacityPercent = Math.min(100, Math.round((nodes.length / (capacity || 1)) * 100));

  const codeLines = [
    { num: 1, text: "class LRUCache:" },
    { num: 2, text: "    def __init__(self, capacity: int):" },
    { num: 3, text: "        self.capacity = capacity" },
    { num: 4, text: "        self.cache = {}" },
    { num: 5, text: "        self.head = ListNode(0, 0)" },
    { num: 6, text: "        self.tail = ListNode(0, 0)" },
    { num: 7, text: "        self.head.next = self.tail" },
    { num: 8, text: "        self.tail.prev = self.head" },
    { num: 9, text: "" },
    { num: 10, text: "    def get(self, key: int) -> int:" },
    { num: 11, text: "        if key not in self.cache:" },
    { num: 12, text: "            return -1" },
    { num: 13, text: "        node = self.cache[key]" },
    { num: 14, text: "        self._move_to_end(node)" },
    { num: 15, text: "        return node.value" },
    { num: 16, text: "" },
    { num: 17, text: "    def put(self, key: int, value: int) -> None:" },
    { num: 18, text: "        if key in self.cache:" },
    { num: 19, text: "            self._remove(self.cache[key])" },
    { num: 20, text: "        node = ListNode(key, value)" },
    { num: 21, text: "        self._add_to_end(node)" },
    { num: 22, text: "        self.cache[key] = node" },
    { num: 23, text: "        if len(self.cache) > self.capacity:" },
    { num: 24, text: "            lru = self.head.next" },
    { num: 25, text: "            self._remove(lru)" },
    { num: 26, text: "            del self.cache[lru.key]" },
  ];

  return (
    <section className="algo-card" id="lru-section">
      {/* Card Header */}
      <div className="algo-card-header">
        <div className="card-title-left">
          <div className="icon-box blue">
            <Box size={18} />
          </div>
          <div className="title-text-group">
            <div className="title-row">
              <h2>1. LRU Cache</h2>
              <span className="pill-concept">Hash Map + Doubly Linked List</span>
            </div>
            <p className="card-subtitle">Design a data structure that supports get and put in O(1) time.</p>
          </div>
        </div>

        <div className="card-badges-right">
          <div className="complexity-pill green">
            <span className="pill-label">Time Complexity</span>
            <span className="pill-val">O(1)</span>
          </div>
          <div className="complexity-pill purple">
            <span className="pill-label">Space Complexity</span>
            <span className="pill-val">O(n)</span>
          </div>
        </div>
      </div>

      {/* 3-Column Body: Balanced & Even */}
      <div className="card-3col-grid">
        {/* Col 1: Smooth & Intuitive Controls */}
        <div className="col-controls">
          <div className="controls-top-group">
            <span className="section-label">Controls</span>

            {/* Smooth Capacity Stepper + Quick Presets */}
            <div className="capacity-control-row">
              <span className="field-label">Capacity:</span>
              <div className="stepper-wrap">
                <button
                  className="btn-stepper"
                  onClick={() => handleCapacityChange(capacity - 1)}
                  disabled={capacity <= 1}
                  title="Decrease Capacity"
                >
                  <Minus size={11} />
                </button>
                <span className="capacity-badge">{capacity}</span>
                <button
                  className="btn-stepper"
                  onClick={() => handleCapacityChange(capacity + 1)}
                  disabled={capacity >= 10}
                  title="Increase Capacity"
                >
                  <Plus size={11} />
                </button>
              </div>
              <div className="quick-cap-pills">
                {[3, 4, 5, 8].map((c) => (
                  <button
                    key={c}
                    className={`btn-cap-pill ${capacity === c ? "active" : ""}`}
                    onClick={() => handleCapacityChange(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Smooth Key & Value Inputs */}
            <div className="inputs-row">
              <div style={{ flex: 1 }}>
                <span className="field-label" style={{ display: "block", marginBottom: "2px" }}>Key</span>
                <input
                  type="text"
                  placeholder="Key (e.g. 1)"
                  className="input-keyval"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePut();
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span className="field-label" style={{ display: "block", marginBottom: "2px" }}>Value</span>
                <input
                  type="text"
                  placeholder="Val (e.g. 10)"
                  className="input-keyval"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePut();
                  }}
                />
              </div>
            </div>

            {/* Direct Put & Get Action Buttons (No Dropdown!) */}
            <div className="action-buttons-row">
              <button
                className="btn-action-put"
                onClick={() => handlePut()}
                title="Insert or update key in O(1)"
              >
                + Put(key, val)
              </button>
              <button
                className="btn-action-get"
                onClick={() => handleGet()}
                title="Lookup key in O(1) and promote to MRU"
              >
                <Search size={11} /> Get(key)
              </button>
            </div>

            {/* Quick Demos & Presets */}
            <span className="section-label" style={{ marginTop: "1px", fontSize: "11px" }}>Quick Operations</span>
            <div className="example-ops-grid">
              <button className="btn-op-pill" onClick={() => handlePut("1", "10")}>put(1, 10)</button>
              <button className="btn-op-pill" onClick={() => handlePut("2", "20")}>put(2, 20)</button>
              <button className="btn-op-pill" onClick={() => handlePut("3", "30")}>put(3, 30)</button>
              <button className="btn-op-pill" onClick={() => handleGet("1")}>get(1)</button>
              <button className="btn-op-pill" onClick={() => handlePut("4", "40")}>put(4, 40)</button>
              <button className="btn-op-pill" onClick={() => handleGet("2")}>get(2)</button>
            </div>

            {/* Auto-Play Simulation & Reset Buttons */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className={`btn-autoplay ${isAutoPlaying ? "playing" : ""}`}
                style={{ flex: 1, padding: "5px 8px", fontSize: "11px" }}
                onClick={handleToggleAutoPlay}
              >
                {isAutoPlaying ? <Square size={11} fill="#ffffff" /> : <Play size={11} fill="#ffffff" />}
                <span>{isAutoPlaying ? "Stop Simulation" : "▶ Live Auto-Play"}</span>
              </button>
              <button
                className="btn-reset-center"
                style={{ padding: "5px 8px" }}
                onClick={handleReset}
                title="Reset Cache"
              >
                <RotateCcw size={11} />
              </button>
            </div>
          </div>

          {/* Live Metrics Engine Panel */}
          <div className="metrics-status-box">
            <div className="metrics-header">
              <span className="metrics-title">
                <span className="live-dot" />
                Live Cache Engine
              </span>
              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--badge-green-text)" }}>
                {nodes.length}/{capacity} Slots ({capacityPercent}%)
              </span>
            </div>
            <div className="meter-bar-track">
              <div
                className="meter-bar-fill"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <div className="metrics-stats-row">
              <span>Hits: <strong>{metrics.hits}</strong></span>
              <span>Miss: <strong>{metrics.misses}</strong></span>
              <span>Evicted: <strong>{metrics.evictions}</strong></span>
            </div>
          </div>
        </div>

        {/* Col 2: Visual Representation & Operation Log */}
        <div className="col-visual">
          <div className="visual-top-bar">
            <span className="section-label">
              Visual Representation <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)" }}>(Click any node to get)</span>
            </span>
            <div className="legend-group">
              <div className="legend-pill">
                <span className="legend-box pink" />
                <span>LRU</span>
              </div>
              <div className="legend-pill">
                <span className="legend-box green" />
                <span>MRU</span>
              </div>
            </div>
          </div>

          {/* Doubly Linked List Diagram (Interactive Clickable Nodes!) */}
          <div className="dll-visual-flow">
            {/* Head Sentinel */}
            <div className="sentinel-block">
              <span className="sentinel-title">Head</span>
              <div className="box-null">NULL</div>
            </div>

            <span className="arrow-bi">⇄</span>

            {/* Dynamic Nodes with Click to Get & Live Glow */}
            {nodes.length === 0 ? (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "0 10px" }}>(Empty Cache)</span>
            ) : (
              nodes.map((node, idx) => {
                const isLRU = idx === 0;
                const isMRU = idx === nodes.length - 1;
                let colorClass = "middle";
                if (isLRU) colorClass = "lru";
                if (isMRU) colorClass = "mru";

                const isFlashing = activeKey === String(node.key);

                return (
                  <React.Fragment key={node.key}>
                    <div
                      className={`lru-node-box ${colorClass} ${isFlashing ? "active-flash" : ""}`}
                      onClick={() => handleGet(node.key)}
                      title={`Click to get(${node.key}) - promote to MRU`}
                    >
                      <span className="node-k">{node.key}</span>
                      <span className="node-v">{node.value}</span>
                    </div>
                    <span className="arrow-bi">⇄</span>
                  </React.Fragment>
                );
              })
            )}

            {/* Tail Sentinel */}
            <div className="sentinel-block">
              <span className="sentinel-title">Tail</span>
              <div className="box-null">NULL</div>
            </div>
          </div>

          {/* Hash Map Box */}
          <div className="hash-map-section">
            <span className="hash-map-title">Hash Map (O(1) Pointers)</span>
            <div className="hash-map-table">
              {nodes.map((n) => (
                <div
                  key={n.key}
                  className={`hash-map-row ${activeKey === String(n.key) ? "highlight" : ""}`}
                  onClick={() => handleGet(n.key)}
                  style={{ cursor: "pointer" }}
                  title={`Click to get(${n.key})`}
                >
                  <span className="hm-k">{n.key}</span>
                  <span className="hm-arr">→</span>
                  <span className="hm-v">node({n.key}, {n.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operation Log */}
          <div className="operation-log-section">
            <span className="section-label">Operation Log</span>
            <div className="log-items-list">
              {logs.map((log) => (
                <div key={log.step} className="log-item-row">
                  <span className={`log-badge-num ${log.type === "get" ? "green" : log.type === "miss" ? "pink" : ""}`}>
                    {log.step}
                  </span>
                  <span className="log-text">{log.text}</span>
                  <span className="log-time">{log.time}</span>
                </div>
              ))}
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

          {/* Explanation Card */}
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
