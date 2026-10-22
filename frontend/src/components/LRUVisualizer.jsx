import React, { useState, useEffect } from "react";
import { Sparkles, Play, RotateCcw, Plus, Search, Info } from "lucide-react";

export default function LRUVisualizer() {
  const [capacity, setCapacity] = useState(3);
  const [customKey, setCustomKey] = useState("A");
  const [customVal, setCustomVal] = useState("10");

  const [state, setState] = useState({
    capacity: 3,
    size: 0,
    chain: [],
    hash_map: {},
    lru_key: null,
    mru_key: null
  });

  const [story, setStory] = useState({
    icon: "📦",
    title: "Welcome to the LRU Cache Playground",
    desc: "Think of this as a desk with only 3 spots. The items stand in a line: the oldest untouched item is on the left, and the newest item is on the right."
  });

  // Fetch current cache state from backend
  const fetchState = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/lru/state");
      const data = await res.json();
      if (data.state) {
        setState(data.state);
        setCapacity(data.state.capacity);
      }
    } catch (err) {
      console.error("Failed to connect to backend", err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Backend actions
  const initCache = async (cap = 3) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/lru/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: Number(cap) })
      });
      const data = await res.json();
      setState(data.state);
      setStory({
        icon: "🔄",
        title: `Cache reset with capacity of ${cap}`,
        desc: "The cache is now completely empty and ready for new items."
      });
    } catch {
      alert("Error resetting cache");
    }
  };

  const putItem = async (k, v) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/lru/put", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k, value: String(v) })
      });
      const data = await res.json();
      setState(data.state);

      if (data.is_updated) {
        setStory({
          icon: "✏️",
          title: `Updated Item "${k}" to new value "${v}"`,
          desc: `Item "${k}" was already in the cache. Its value was updated, and it jumped to the MRU end (safest from eviction).`
        });
      } else if (data.evicted_key) {
        setStory({
          icon: "⚠️",
          title: `Full! Item "${data.evicted_key}" was evicted to fit "${k}"`,
          desc: `The cache had reached its limit of ${capacity} items. Item "${data.evicted_key}" had gone the longest without being touched, so it was removed.`
        });
      } else {
        setStory({
          icon: "➕",
          title: `Added Item "${k}" = "${v}"`,
          desc: `Item "${k}" was stored in the phonebook (hash map) and added to the newest end of the line.`
        });
      }
    } catch {
      alert("Error during put");
    }
  };

  const getItem = async (k) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/lru/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k })
      });
      const data = await res.json();
      setState(data.state);

      if (data.found) {
        setStory({
          icon: "⚡",
          title: `Found Item "${k}" (Value: ${data.value})!`,
          desc: `Because you just accessed "${k}", it immediately jumped to the front of the line (Most Recently Used). It is now safe from being removed!`
        });
      } else {
        setStory({
          icon: "❌",
          title: `Item "${k}" was not found!`,
          desc: `The key "${k}" is not stored in the cache. Returned -1.`
        });
      }
    } catch {
      alert("Error during get");
    }
  };

  // 1-Click Interactive Demos
  const runDemo1 = async () => {
    await initCache(3);
    await putItem("A", "10");
    await putItem("B", "20");
    await putItem("C", "30");
    setStory({
      icon: "1️⃣",
      title: "Step 1: Filled cache with 3 items [A, B, C]",
      desc: "Items were added in order: A is the oldest (left), and C is the newest (right). Capacity is now 3/3."
    });
  };

  const runDemo2 = async () => {
    await getItem("A");
    setStory({
      icon: "2️⃣",
      title: "Step 2: Used Item A -> Watch it jump to the newest end!",
      desc: "Even though A was the oldest item, using it made it the Most Recently Used. Now B is the oldest item on the left!"
    });
  };

  const runDemo3 = async () => {
    await putItem("D", "40");
    setStory({
      icon: "3️⃣",
      title: "Step 3: Added Item D -> Item B was kicked out!",
      desc: "Because the cache was full, Item B (the oldest untouched item) was evicted. The cache now holds [C, A, D]."
    });
  };

  return (
    <div>
      {/* Visual Explanation Banner */}
      <div className="story-banner">
        <div className="story-icon">{story.icon}</div>
        <div className="story-text">
          <h4>{story.title}</h4>
          <p>{story.desc}</p>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="card-title">Problem 1: The LRU Cache (Toy Box)</div>
            <div className="card-desc" style={{ marginBottom: 0 }}>
              Max capacity: <strong>{capacity} items</strong> • Current size: <strong>{state.size} items</strong>
            </div>
          </div>
          <button className="btn-pill btn-pill-gray" onClick={() => initCache(capacity)}>
            <RotateCcw size={14} /> Clear Cache
          </button>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="button-row">
          <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#818cf8" /> Try the 3-step story:
          </span>
          <button className="btn-pill btn-pill-primary" onClick={runDemo1}>
            1. Fill with A, B, C
          </button>
          <button className="btn-pill btn-pill-cyan" onClick={runDemo2}>
            2. Touch "A" (Moves to front)
          </button>
          <button className="btn-pill btn-pill-emerald" onClick={runDemo3}>
            3. Add "D" (Evicts oldest!)
          </button>
        </div>

        {/* The Visual Line of Items */}
        <div className="queue-box">
          <div className="queue-label-bar">
            <span style={{ color: "var(--rose)", display: "flex", alignItems: "center", gap: "4px" }}>
              ◀ Oldest (Kicked out first if full)
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {state.size} of {capacity} spots occupied
            </span>
            <span style={{ color: "var(--emerald)", display: "flex", alignItems: "center", gap: "4px" }}>
              Newest (Safest) ▶
            </span>
          </div>

          <div className="queue-items-row">
            {state.chain.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px", fontStyle: "italic", padding: "20px" }}>
                Cache is empty. Click "1. Fill with A, B, C" above to see it in action!
              </div>
            ) : (
              state.chain.map((item, idx) => {
                const isOldest = idx === 0;
                const isNewest = idx === state.chain.length - 1;
                return (
                  <React.Fragment key={item.key}>
                    <div className={`item-card ${isOldest ? "is-oldest" : ""} ${isNewest ? "is-newest" : ""}`}>
                      {isOldest && <span className="item-card-badge badge-oldest">Oldest (LRU)</span>}
                      {isNewest && <span className="item-card-badge badge-newest">Newest (MRU)</span>}
                      <div className="item-card-key">Item {item.key}</div>
                      <div className="item-card-val">Val: {item.value}</div>
                      <button
                        onClick={() => getItem(item.key)}
                        style={{
                          marginTop: "8px",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "var(--radius-sm)",
                          color: "#fff",
                          padding: "4px 8px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Use This
                      </button>
                    </div>
                    {idx < state.chain.length - 1 && <span className="arrow-next">➔</span>}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Manual Custom Testing */}
        <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dim)" }}>
            Try your own keys:
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="input-simple"
              style={{ width: "60px", textAlign: "center" }}
            />
            <input
              type="text"
              placeholder="Val"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              className="input-simple"
              style={{ width: "60px", textAlign: "center" }}
            />
            <button className="btn-pill btn-pill-gray" style={{ padding: "8px 14px" }} onClick={() => putItem(customKey, customVal)}>
              <Plus size={14} /> Put Item
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="input-simple"
              style={{ width: "60px", textAlign: "center" }}
            />
            <button className="btn-pill btn-pill-gray" style={{ padding: "8px 14px" }} onClick={() => getItem(customKey)}>
              <Search size={14} /> Get Item
            </button>
          </div>
        </div>
      </div>

      {/* The 2-Minute Explanation */}
      <div className="card">
        <div className="card-title">
          <Info size={18} color="#818cf8" />
          <span>Why is this fast? (The Secret to O(1) Time)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <h4 style={{ color: "var(--cyan)", fontSize: "15px", marginBottom: "6px" }}>1. The Phonebook (Hash Map)</h4>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
              If you ask <em>"Where is Item B?"</em>, the phonebook tells you immediately without searching through a list. That's <strong>O(1) lookup</strong>.
            </p>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <h4 style={{ color: "var(--emerald)", fontSize: "15px", marginBottom: "6px" }}>2. The Hand-Holding Line (Doubly Linked List)</h4>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
              Each item holds hands with the item in front and behind. To move an item to the front, its two neighbors just grab each other's hands. That's <strong>O(1) moving</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
