import React, { useState } from "react";
import { BookOpen, Cpu, Lock, HelpCircle, ChevronDown, ChevronUp, Layers, CheckCircle2 } from "lucide-react";

export default function ArchitectureGuide() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "1. Why must the key be stored inside the Doubly Linked List Node?",
      a: "When the cache is full and we evict the least recently used element (head.next), we unlink that node from the list in O(1). However, to prevent memory leaks and state desynchronization, we must ALSO delete that key from the Hash Map (del map[key]). If the node only stored the value, we would have no way to find which hash map key to delete without scanning the entire hash table in O(n) time. Storing the key inside the Node enables O(1) hash map purge."
    },
    {
      q: "2. Why can't we use a Singly Linked List with a tail pointer?",
      a: "While a singly linked list allows O(1) appending to the tail, any cache hit (get) or key update requires moving an ARBITRARY node from the middle of the list to the tail. In a singly linked list, unlinking node X requires updating X.prev.next = X.next. Because backward pointers do not exist, finding X's predecessor requires traversing from the head in O(n) time. A Doubly Linked List provides X.prev in O(1)."
    },
    {
      q: "3. Why does get() in an LRU Cache require thread synchronization?",
      a: "In standard data structures, 'get' is an idempotent read operation. In an LRU Cache, get() is fundamentally a write operation: it unlinks the node from its current position and rewires it before the tail sentinel to mark it Most Recently Used. If two threads call get() simultaneously without a lock, concurrent pointer mutation will cause cyclic references or lost node pointers."
    },
    {
      q: "4. Why is current_start < previous_end the correct conflict condition in the Scheduler?",
      a: "Meeting intervals are half-open intervals: [start, end). For example, Meeting A [9, 10) and Meeting B [10, 11) share timestamp 10, but Meeting A concludes exactly at the moment Meeting B begins. Therefore, 10 < 10 evaluates to FALSE (no conflict). Using <= would incorrectly flag adjacent non-overlapping meetings as conflicts."
    },
    {
      q: "5. How does min-heap room allocation prove mathematical optimality?",
      a: "The chromatic number of an interval graph equals the maximum clique size (maximum overlapping intervals at any point). By sorting start times and eagerly releasing finished meetings via heap[0] <= start, the heap size at each moment equals the exact number of active concurrent meetings. Since we only increment room count when no finished room can be reused, the maximum heap size is provably the minimum rooms needed."
    }
  ];

  return (
    <div>
      {/* Complexity Breakdown */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={20} color="#818cf8" />
            <span>Formal Asymptotic Complexity Proofs</span>
          </div>
          <span className="badge badge-indigo">Strict Theoretical Bounds</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface-elevated)", color: "var(--text-secondary)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>System / Operation</th>
                <th style={{ padding: "10px 14px" }}>Time Bound</th>
                <th style={{ padding: "10px 14px" }}>Auxiliary Space</th>
                <th style={{ padding: "10px 14px" }}>Mechanical Justification</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>LRUCache.get(key)</strong></td>
                <td style={{ padding: "10px 14px", color: "#34d399", fontFamily: "var(--font-mono)" }}>Expected O(1)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(1)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>Hash table lookup + constant pointer rewire in DLL.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>LRUCache.put(key, val)</strong></td>
                <td style={{ padding: "10px 14px", color: "#34d399", fontFamily: "var(--font-mono)" }}>Expected O(1)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(C) Total</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>Hash write + optional LRU head eviction + MRU tail push.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>can_attend_all(events)</strong></td>
                <td style={{ padding: "10px 14px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>O(n log n)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(n)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>Sorting dominates; adjacent scan takes (n - 1) checks.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>min_rooms_required(events)</strong></td>
                <td style={{ padding: "10px 14px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>O(n log n)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(n)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>Each meeting pushed once (log n) and popped once (log n).</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 14px" }}><strong>assign_rooms(events)</strong></td>
                <td style={{ padding: "10px 14px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>O(n log n)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(n)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>Dual-heap operations bounded by 2 log n per interval.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Concurrency & Systems Architecture */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Lock size={18} color="#f43f5e" />
              <span>Concurrency & Thread-Safety Invariant</span>
            </div>
            <span className="badge badge-rose">Race Guard</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            In multithreaded environments, multiple threads invoking <code style={{ color: "#a5b4fc" }}>put()</code> and <code style={{ color: "#a5b4fc" }}>get()</code> can interleave pointer rewiring operations.
          </p>
          <div style={{ background: "#060911", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#e2e8f0" }}>
            <div style={{ color: "#94a3b8", marginBottom: "6px" }}># Production ThreadSafeLRUCache wrapping:</div>
            <div>class ThreadSafeLRUCache(LRUCache):</div>
            <div style={{ paddingLeft: "16px" }}>def __init__(self, capacity):</div>
            <div style={{ paddingLeft: "32px" }}>super().__init__(capacity)</div>
            <div style={{ paddingLeft: "32px", color: "#34d399" }}>self._lock = threading.RLock()</div>
            <div style={{ paddingLeft: "16px", marginTop: "6px" }}>def get(self, key):</div>
            <div style={{ paddingLeft: "32px", color: "#34d399" }}>with self._lock:</div>
            <div style={{ paddingLeft: "48px" }}>return super().get(key)</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={18} color="#06b6d4" />
              <span>Scaling to Production & Distributed Cache</span>
            </div>
            <span className="badge badge-cyan">Systems Design</span>
          </div>
          <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7", paddingLeft: "18px" }}>
            <li><strong>Lock Striping / Sharding:</strong> To avoid single-mutex bottleneck across 64+ cores, partition keys into $M$ independent shards: <code style={{ color: "#67e8f9" }}>shard = hash(key) % M</code>.</li>
            <li><strong>Distributed Scale (Redis / Memcached):</strong> A single in-memory instance cannot span multiple servers. Use consistent hashing across server nodes.</li>
            <li><strong>Approximated LRU:</strong> Strict pointer manipulation in distributed systems introduces excessive coordination. Real-world systems sample $k$ random keys and evict the oldest.</li>
          </ul>
        </div>
      </div>

      {/* Interviewer FAQ Accordion */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <HelpCircle size={20} color="#f59e0b" />
            <span>The 5 Core Interviewer Assessment Questions & Killer Answers</span>
          </div>
          <span className="badge badge-amber">Interview Ready</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden"
                }}
              >
                <div
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  style={{
                    padding: "14px 18px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "600",
                    fontSize: "14px",
                    color: isOpen ? "var(--accent-primary)" : "#fff"
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {isOpen && (
                  <div style={{ padding: "0 18px 16px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
