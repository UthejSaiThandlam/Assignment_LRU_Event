import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Calendar, 
  Zap, 
  Minus, 
  Plus, 
  RotateCcw, 
  Play, 
  Square, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  XCircle, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight 
} from "lucide-react";
import { apiFetch } from "../utils/api";

export default function LRUSection({ onSwitchToScheduler, autoStartDemo }) {
  const [capacity, setCapacity] = useState(3);
  const [keyInput, setKeyInput] = useState("1");
  const [valInput, setValInput] = useState("10");
  const [activeKey, setActiveKey] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [activeCodeLine, setActiveCodeLine] = useState(12);

  // Nodes currently in cache (1, 10; 2, 20; 3, 30)
  const [nodes, setNodes] = useState([
    { key: "1", value: "10" },
    { key: "2", value: "20" },
    { key: "3", value: "30" },
  ]);

  // Operations log (Initial operations 1, 10; 2, 20; 3, 30)
  const [logs, setLogs] = useState([
    { step: 1, text: "put(1, 10) - Inserted key 1 with value 10", time: "10:24:01", type: "put" },
    { step: 2, text: "put(2, 20) - Inserted key 2 with value 20", time: "10:24:05", type: "put" },
    { step: 3, text: "put(3, 30) - Inserted key 3 with value 30", time: "10:24:08", type: "put" },
  ]);

  // Status and explanation (Reflecting operations 1, 10; 2, 20; 3, 30)
  const [explanation, setExplanation] = useState({
    statusType: "put",
    headline: "put(3, 30): Inserted at MRU",
    sub1: "Key 3 mapped to node (3, 30) in hash map.",
    sub2: "Node inserted right before TAIL sentinel (MRU).",
    sub3: "Cache capacity full: 3 / 3 slots occupied.",
    bullets: [
      "Operations executed: put(1, 10) → put(2, 20) → put(3, 30).",
      "Current DLL recency order: 1 (Least Recently Used) → 2 → 3 (Most Recently Used).",
      "Next put operation with a new key will evict key 1 at HEAD.next.",
    ],
  });

  const stepCounter = useRef(3);
  const autoPlayTimer = useRef(null);
  const demoStepIndex = useRef(0);

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

  // Sync initial state with backend: 1, 10; 2, 20; 3, 30
  useEffect(() => {
    const syncBackend = async () => {
      try {
        await apiFetch("/api/lru/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capacity: 3 }),
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
      } catch (err) {
        console.warn("Backend sync fallback initialized", err);
      }
    };
    syncBackend();
  }, []);

  // Capacity change
  const handleCapacityChange = async (newVal) => {
    const parsedCap = Math.max(1, Math.min(8, parseInt(newVal, 10) || 1));
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
      if (data.evicted) evictedItems = data.evicted;
      if (data.state && data.state.chain) setNodes(data.state.chain);
    } catch {
      setNodes((prev) => {
        if (prev.length > parsedCap) {
          evictedItems = prev.slice(0, prev.length - parsedCap).map((n) => n.key);
          return prev.slice(prev.length - parsedCap);
        }
        return prev;
      });
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
    setLogs((prev) => [...prev.slice(-5), newLog]);

    setExplanation({
      statusType: "put",
      headline: `Capacity changed to ${parsedCap}`,
      sub1: `Storage limit updated to ${parsedCap}.`,
      sub2: evictedItems.length > 0 ? `Evicted ${evictedItems.length} LRU node(s).` : `Cache has capacity for ${parsedCap} items.`,
      sub3: "All active pointers preserved.",
      bullets: [
        `Adjusted maximum cache storage limit to ${parsedCap}.`,
        evictedItems.length > 0
          ? `Evicted oldest node(s) (${evictedItems.join(", ")}) from LRU side to satisfy new capacity limit.`
          : `Cache has room for up to ${parsedCap} items before eviction occurs.`,
        "Time complexity: O(1)",
      ],
    });
  };

  // Put Action
  const handlePut = async (customKey, customVal) => {
    const k = customKey !== undefined ? String(customKey) : keyInput.trim() || "4";
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

    stepCounter.current += 1;
    let logText = `put(${k}, ${v}) - Inserted key ${k} with value ${v}`;
    if (evicted) {
      logText = `put(${k}, ${v}) - Evicted LRU key ${evicted}, inserted ${k}`;
    } else if (isUpdate) {
      logText = `put(${k}, ${v}) - Updated key ${k} to value ${v}`;
    }

    const newLog = {
      step: stepCounter.current,
      text: logText,
      time: getTimeString(),
      type: "put",
    };
    setLogs((prev) => [...prev.slice(-5), newLog]);

    setExplanation({
      statusType: "put",
      headline: isUpdate
        ? `put(${k}, ${v}): Key updated`
        : evicted
        ? `put(${k}, ${v}): Evicted ${evicted} & inserted ${k}`
        : `put(${k}, ${v}): Inserted at MRU`,
      sub1: isUpdate ? `Key ${k} already existed.` : `Node (${k}, ${v}) added to MRU.`,
      sub2: evicted ? `Evicted LRU node ${evicted} to maintain capacity ${capacity}.` : `Value set to ${v}.`,
      sub3: "Cache pointers updated in O(1) time.",
      bullets: isUpdate
        ? [
            `The key ${k} was already present in the hash map.`,
            `Value was updated to ${v}.`,
            `Node was moved to the MRU position (before TAIL).`,
          ]
        : evicted
        ? [
            `Cache reached maximum capacity of ${capacity}.`,
            `The oldest node (${evicted}) at HEAD.next was evicted.`,
            `New node (${k}, ${v}) appended at MRU.`,
          ]
        : [
            `Stored key ${k} in hash map pointing to new node.`,
            `Node inserted at MRU right before TAIL sentinel.`,
            `Current items: ${Math.min(nodes.length + 1, capacity)} / ${capacity}.`,
          ],
    });
  };

  // Get Action
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
      const nodeIndex = nodes.findIndex((n) => n.key === k);
      if (nodeIndex !== -1) {
        found = true;
        foundValue = nodes[nodeIndex].value;
        setNodes((prev) => {
          const target = prev[nodeIndex];
          const remaining = prev.filter((_, idx) => idx !== nodeIndex);
          return [...remaining, target];
        });
      }
    }

    stepCounter.current += 1;
    let logText = `get(${k}) - Hit! Returned ${foundValue} (moved to MRU)`;
    if (!found) {
      logText = `get(${k}) - Miss! Key not found (returned -1)`;
    }

    const newLog = {
      step: stepCounter.current,
      text: logText,
      time: getTimeString(),
      type: found ? "hit" : "miss",
    };
    setLogs((prev) => [...prev.slice(-5), newLog]);

    if (found) {
      setExplanation({
        statusType: "hit",
        headline: `get(${k}): Cache hit!`,
        sub1: `Key ${k} found with value ${foundValue}.`,
        sub2: `Returned ${foundValue}.`,
        sub3: "Moved node to MRU position.",
        bullets: [
          `Key ${k} was found in the hash map in O(1) time.`,
          `Node unlinked from its position and moved to MRU.`,
          `Recent items order refreshed.`,
        ],
      });
    } else {
      const currentChainStr = nodes.map((n) => n.key).join(" → ");
      setExplanation({
        statusType: "miss",
        headline: `get(${k}): Cache miss`,
        sub1: `Key ${k} was not found.`,
        sub2: "Returned -1.",
        sub3: "Cache order stays the same.",
        bullets: [
          `The key ${k} is not present in the hash map.`,
          "No nodes are moved in the linked list.",
          `The cache remains: ${currentChainStr || "empty"}.`,
        ],
      });
    }
  };

  // Reset Cache to 1, 10; 2, 20; 3, 30
  const handleReset = async () => {
    setCapacity(3);
    setKeyInput("1");
    setValInput("10");
    setNodes([
      { key: "1", value: "10" },
      { key: "2", value: "20" },
      { key: "3", value: "30" },
    ]);
    stepCounter.current = 3;
    setLogs([
      { step: 1, text: "put(1, 10) - Inserted key 1 with value 10", time: "10:24:01", type: "put" },
      { step: 2, text: "put(2, 20) - Inserted key 2 with value 20", time: "10:24:05", type: "put" },
      { step: 3, text: "put(3, 30) - Inserted key 3 with value 30", time: "10:24:08", type: "put" },
    ]);
    setExplanation({
      statusType: "put",
      headline: "put(3, 30): Inserted at MRU",
      sub1: "Key 3 mapped to node (3, 30) in hash map.",
      sub2: "Node inserted right before TAIL sentinel (MRU).",
      sub3: "Cache capacity full: 3 / 3 slots occupied.",
      bullets: [
        "Operations executed: put(1, 10) → put(2, 20) → put(3, 30).",
        "Current DLL recency order: 1 (Least Recently Used) → 2 → 3 (Most Recently Used).",
        "Next put operation with a new key will evict key 1 at HEAD.next.",
      ],
    });
    try {
      await apiFetch("/api/lru/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: 3 }),
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
    } catch {
      // Offline fallback
    }
  };

  // Next Step Demonstration
  const demoSequence = [
    { type: "put", k: "1", v: "10" },
    { type: "put", k: "2", v: "20" },
    { type: "put", k: "3", v: "30" },
    { type: "get", k: "1" },
    { type: "put", k: "4", v: "40" },
    { type: "get", k: "2" },
    { type: "get", k: "3" },
    { type: "put", k: "5", v: "50" },
    { type: "get", k: "1" },
  ];

  const handleNextStep = () => {
    const op = demoSequence[demoStepIndex.current % demoSequence.length];
    demoStepIndex.current += 1;
    if (op.type === "put") {
      handlePut(op.k, op.v);
    } else {
      handleGet(op.k);
    }
  };

  // Auto-play Toggle
  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      handleNextStep();
      autoPlayTimer.current = setInterval(() => {
        handleNextStep();
      }, 1900);
    }
  };

  useEffect(() => {
    if (autoStartDemo) {
      handleToggleAutoPlay();
    }
    return () => clearInterval(autoPlayTimer.current);
  }, [autoStartDemo]);

  // Python LRU Cache Reference Code
  const codeLines = [
    { num: 1, text: "class LRUCache:" },
    { num: 2, text: "    def __init__(self, capacity: int):" },
    { num: 3, text: "        self.capacity = capacity" },
    { num: 4, text: "        self.cache = {}  # key -> ListNode" },
    { num: 5, text: "        self.head = ListNode(0, 0)  # Sentinel HEAD" },
    { num: 6, text: "        self.tail = ListNode(0, 0)  # Sentinel TAIL" },
    { num: 7, text: "        self.head.next = self.tail" },
    { num: 8, text: "        self.tail.prev = self.head" },
    { num: 9, text: "" },
    { num: 10, text: "    def get(self, key: int) -> int:" },
    { num: 11, text: "        if key not in self.cache:" },
    { num: 12, text: "            return -1  # Cache Miss" },
    { num: 13, text: "        node = self.cache[key]" },
    { num: 14, text: "        self._remove(node)" },
    { num: 15, text: "        self._add_to_tail(node)  # Move to MRU" },
    { num: 16, text: "        return node.value" },
    { num: 17, text: "" },
    { num: 18, text: "    def put(self, key: int, value: int) -> None:" },
    { num: 19, text: "        if key in self.cache:" },
    { num: 20, text: "            self._remove(self.cache[key])" },
    { num: 21, text: "        node = ListNode(key, value)" },
    { num: 22, text: "        self._add_to_tail(node)" },
    { num: 23, text: "        self.cache[key] = node" },
    { num: 24, text: "        if len(self.cache) > self.capacity:" },
    { num: 25, text: "            lru = self.head.next  # Evict oldest" },
    { num: 26, text: "            self._remove(lru)" },
    { num: 27, text: "            del self.cache[lru.key]" },
  ];

  return (
    <div className="playground-view-container">
      {/* Subheader Tab Navigation Bar */}
      <div className="subnav-tab-bar">
        <div className="tab-pills-group">
          <button className="tab-pill active" type="button">
            <Database size={15} />
            <span>LRU Cache</span>
          </button>
          <button 
            className="tab-pill inactive" 
            type="button" 
            onClick={onSwitchToScheduler}
          >
            <Calendar size={15} />
            <span>Meeting Room Scheduler</span>
          </button>
        </div>

        <div className="subnav-right-actions">
          <button
            type="button"
            className={`subnav-quick-run-btn ${isAutoPlaying ? "running" : ""}`}
            onClick={handleToggleAutoPlay}
            title="Toggle automatic simulation"
            id="subnav-quick-run"
          >
            {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isAutoPlaying ? "Pause" : "▶ Run Demo"}</span>
          </button>
          <div className="complexity-badge-right">
            <Zap size={13} className="bolt-icon" />
            <span>Expected O(1)</span>
          </div>
        </div>
      </div>

      {/* Top 3-Column Grid */}
      <div className="playground-3col-grid">
        {/* CARD 1: 1. Controls */}
        <div className="playground-card card-controls">
          <div className="card-header-simple">
            <h3 className="card-title">1. Controls</h3>
            <p className="card-desc">Add or get items from the cache.</p>
          </div>

          <div className="card-controls-body">
            {/* DIRECT ONE-CLICK RUN BUTTON */}
            <div className="direct-run-banner">
              <button
                type="button"
                className={`btn-direct-run-main ${isAutoPlaying ? "running" : ""}`}
                onClick={handleToggleAutoPlay}
                id="btn-run-here-directly"
              >
                {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                <span>{isAutoPlaying ? "Pause Run" : "▶ Direct Run"}</span>
              </button>
              <button
                type="button"
                className="btn-direct-step-next"
                onClick={handleNextStep}
                title="Execute next step"
                id="btn-next-step-direct"
              >
                <span>Next &gt;</span>
              </button>
            </div>

            {/* Capacity Control */}
            <div className="control-field-row">
              <span className="control-field-label">Capacity</span>
              <div className="stepper-widget">
                <button
                  type="button"
                  className="stepper-action-btn"
                  onClick={() => handleCapacityChange(capacity - 1)}
                  disabled={capacity <= 1}
                  title="Decrease Capacity"
                >
                  <Minus size={13} />
                </button>
                <span className="stepper-number">{capacity}</span>
                <button
                  type="button"
                  className="stepper-action-btn"
                  onClick={() => handleCapacityChange(capacity + 1)}
                  disabled={capacity >= 8}
                  title="Increase Capacity"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Key Input */}
            <div className="control-field-row">
              <span className="control-field-label">Key</span>
              <input
                type="text"
                className="control-text-input"
                placeholder="e.g. 1"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePut()}
              />
            </div>

            {/* Value Input */}
            <div className="control-field-row">
              <span className="control-field-label">Value</span>
              <input
                type="text"
                className="control-text-input"
                placeholder="e.g. 10"
                value={valInput}
                onChange={(e) => setValInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePut()}
              />
            </div>

            {/* Action Buttons: Put item & Get item */}
            <div className="actions-button-pair">
              <button
                type="button"
                className="btn-put-primary"
                onClick={() => handlePut()}
              >
                Put item
              </button>
              <button
                type="button"
                className="btn-get-primary"
                onClick={() => handleGet()}
              >
                Get item
              </button>
            </div>

            {/* Example Operations */}
            <div className="example-ops-container">
              <span className="example-ops-heading">Example Operations</span>
              <div className="example-ops-grid">
                <button type="button" className="btn-op-pill" onClick={() => handlePut("1", "10")}>put(1, 10)</button>
                <button type="button" className="btn-op-pill" onClick={() => handlePut("2", "20")}>put(2, 20)</button>
                <button type="button" className="btn-op-pill" onClick={() => handlePut("3", "30")}>put(3, 30)</button>
                <button type="button" className="btn-op-pill" onClick={() => handleGet("1")}>get(1)</button>
                <button type="button" className="btn-op-pill" onClick={() => handlePut("4", "40")}>put(4, 40)</button>
                <button type="button" className="btn-op-pill" onClick={() => handleGet("2")}>get(2)</button>
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
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: 2. Cache Visualization */}
        <div className="playground-card card-visualization">
          <div className="card-header-simple">
            <h3 className="card-title">2. Cache Visualization</h3>
            <p className="card-desc">Doubly linked list showing usage order (least recently used → most recently used).</p>
          </div>

          <div className="card-visualization-body">
            {/* LRU and MRU Labels */}
            <div className="legend-pills-row">
              <span className="badge-lru-label">Least recently used (LRU)</span>
              <span className="badge-mru-label">Most recently used (MRU)</span>
            </div>

            {/* Doubly Linked List Visual */}
            <div className="dll-track-wrapper">
              {/* HEAD Sentinel */}
              <div className="sentinel-block">
                <span className="sentinel-tag">HEAD</span>
                <div className="sentinel-cell">NULL</div>
              </div>

              <div className="dll-connector-arrow">→</div>

              {/* Dynamic Nodes */}
              {nodes.map((node, index) => {
                // Color matches mockup: Node 0 (LRU) is red/burgundy, middle is blue, last (MRU) is green
                const colorClass = index === 0 ? "node-burgundy" : index === nodes.length - 1 ? "node-green" : "node-blue";
                const isFlash = activeKey === String(node.key);

                return (
                  <React.Fragment key={node.key}>
                    <div 
                      className={`dll-node-box ${colorClass} ${isFlash ? "flash-highlight" : ""}`}
                      onClick={() => handleGet(node.key)}
                      title={`Click to get(${node.key})`}
                    >
                      <div className="node-key-header">{node.key}</div>
                      <div className="node-val-body">{node.value}</div>
                    </div>

                    {index < nodes.length - 1 ? (
                      <div className="dll-double-arrow">⇄</div>
                    ) : (
                      <div className="dll-connector-arrow">→</div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* TAIL Sentinel */}
              <div className="sentinel-block">
                <span className="sentinel-tag">TAIL</span>
                <div className="sentinel-cell">NULL</div>
              </div>
            </div>

            {/* Hash Map Table */}
            <div className="hashmap-section">
              <h4 className="hashmap-heading">Hash Map (Key → Node)</h4>
              <div className="hashmap-table">
                {nodes.map((node, index) => {
                  const badgeColorClass = index === 0 ? "key-burgundy" : index === nodes.length - 1 ? "key-green" : "key-blue";
                  return (
                    <div key={node.key} className="hashmap-entry-row">
                      <span className={`hashmap-key-badge ${badgeColorClass}`}>{node.key}</span>
                      <span className="hashmap-map-arrow">→</span>
                      <div className="hashmap-target-pill">
                        node ({node.key}, {node.value})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: 3. What just happened? */}
        <div className="playground-card card-explanation">
          <div className="card-header-simple">
            <h3 className="card-title">3. What just happened?</h3>
            <p className="card-desc">Explanation of the current operation.</p>
          </div>

          <div className="card-explanation-body">
            {/* Status Alert Banner */}
            <div className={`status-alert-card ${explanation.statusType}`}>
              <div className="status-alert-icon-col">
                {explanation.statusType === "hit" ? (
                  <CheckCircle2 size={24} className="icon-hit-success" />
                ) : explanation.statusType === "put" ? (
                  <PlusCircle size={24} className="icon-put-info" />
                ) : (
                  <XCircle size={24} className="icon-miss-danger" />
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
            <p className="card-desc">Last {logs.length} operations performed on the cache.</p>
          </div>

          <div className="oplog-actions-area">
            <button
              type="button"
              className="btn-next-step-blue"
              onClick={handleNextStep}
            >
              <span>&gt; Next step</span>
            </button>

            <button
              type="button"
              className={`btn-autoplay-log ${isAutoPlaying ? "playing" : ""}`}
              onClick={handleToggleAutoPlay}
            >
              {isAutoPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isAutoPlaying ? "Pause" : "Auto-play"}</span>
            </button>

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
              <span className="code-filename">lru_cache.py (Python O(1) Core Implementation)</span>
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
