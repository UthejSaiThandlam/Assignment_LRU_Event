import React, { useState } from "react";
import { BookOpen, Cpu, Lock, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function DocumentationView() {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Complexity Proofs */}
      <div className="algo-card">
        <div className="algo-card-header">
          <div className="title-row">
            <Cpu size={20} color="#6366f1" />
            <h2 style={{ fontSize: "18px" }}>Theoretical Complexity Proofs</h2>
          </div>
          <span className="pill-concept">Asymptotic Invariants</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", textAlign: "left", borderBottom: "1px solid var(--border-light)" }}>
                <th style={{ padding: "10px 14px" }}>Operation / Function</th>
                <th style={{ padding: "10px 14px" }}>Time Complexity</th>
                <th style={{ padding: "10px 14px" }}>Space Complexity</th>
                <th style={{ padding: "10px 14px" }}>Mechanical Justification</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>LRUCache.get(key)</strong></td>
                <td style={{ padding: "10px 14px", color: "var(--badge-green-text)", fontFamily: "var(--font-mono)" }}>Expected O(1)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(1)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Hash table lookup + constant-time node promotion before tail sentinel.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>LRUCache.put(key, val)</strong></td>
                <td style={{ padding: "10px 14px", color: "var(--badge-green-text)", fontFamily: "var(--font-mono)" }}>Expected O(1)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(C) Total</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Hash write + optional LRU head eviction + MRU tail push.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px" }}><strong>can_attend_all(events)</strong></td>
                <td style={{ padding: "10px 14px", color: "#2563eb", fontFamily: "var(--font-mono)" }}>O(n log n)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(n)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Sorting dominates; linear scan checks adjacent endpoints in (n - 1) steps.</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 14px" }}><strong>min_rooms_required(events)</strong></td>
                <td style={{ padding: "10px 14px", color: "#2563eb", fontFamily: "var(--font-mono)" }}>O(n log n)</td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>O(n)</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Each meeting pushed once (log n) and popped once (log n). Total heap work &le; 2n log n.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Systems Concurrency */}
      <div className="algo-card">
        <div className="algo-card-header">
          <div className="title-row">
            <Lock size={20} color="#f43f5e" />
            <h2 style={{ fontSize: "18px" }}>Thread-Safety & Race Condition Analysis</h2>
          </div>
          <span className="pill-concept">Systems Design</span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: "1.6" }}>
          In an LRU Cache, <code style={{ color: "#2563eb" }}>get()</code> mutates memory pointers. Without synchronization, concurrent reads and writes can lead to circular references, lost nodes, or desynchronized hash map entries. In Python, wrapping operations with <code style={{ color: "#2563eb" }}>threading.RLock()</code> ensures that pointer unlinking and hash map updates are strictly atomic.
        </p>
      </div>

      {/* FAQs */}
      <div className="algo-card">
        <div className="algo-card-header">
          <div className="title-row">
            <HelpCircle size={20} color="#f59e0b" />
            <h2 style={{ fontSize: "18px" }}>The 5 Core Interview Assessment Questions</h2>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden"
                }}
              >
                <div
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "600",
                    fontSize: "13.5px",
                    color: isOpen ? "var(--blue-primary)" : "var(--text-heading)"
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />}
                </div>

                {isOpen && (
                  <div style={{ padding: "0 16px 14px", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.6", borderTop: "1px solid var(--border-light)", paddingTop: "10px" }}>
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
