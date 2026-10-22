# AlgoLab: Data Structures & Systems Design Studio (SE Intern)

A clean, interactive visualizer and production-grade Python algorithmic backend for the SE Intern assignment.

---

## ⚡ Quick Start

### 1. Start the Python Backend (FastAPI Core)
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs available at: `http://127.0.0.1:8000/docs`*

### 2. Start the React Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```
*Open your browser at: `http://127.0.0.1:5173`*

### 3. Run the Automated Test Suite (CLI)
```bash
cd backend
python test_suite.py
```
*All 11 edge cases, boundary checks, and multithreaded concurrency tests pass in ~5ms.*

---

## 📦 Problem 1: LRU Cache (Least Recently Used)

### The Core Idea (Explained Simply)
Imagine a desk that fits only **3 items**. When the desk is full and you need to put a new item, which item do you throw out? **The one you haven't touched for the longest time.**

### How It Works Under the Hood
1. **The Phonebook (`Hash Map`):** Instantly finds where any item is in $O(1)$ time without searching.
2. **The Line (`Doubly Linked List`):** Keeps recency order. Items hold hands with the item in front and behind. Moving an item to the front takes $O(1)$ time because only neighboring hands are re-grabbed.
3. **Sentinels (`HEAD` & `TAIL`):** Permanent boundary anchors that eliminate null-pointer bugs and empty list edge cases.

### Concurrency
- In an LRU Cache, **`get()` is an internal write operation** because it mutates pointers to mark the accessed item as Most Recently Used.
- Protected by `threading.RLock()` to ensure multi-threaded operations do not corrupt pointers.

---

## 📅 Problem 2: Event Scheduler

### 1. Can One Person Attend All Meetings? (`can_attend_all`)
- **Algorithm:** Sort meetings by start time $O(n \log n)$. Check each neighboring meeting.
- **Golden Rule:** If Meeting 1 ends at **10:00** and Meeting 2 starts at **10:00**, they **DO NOT** conflict! ($s_{\text{next}} < e_{\text{prev}}$).

### 2. Minimum Rooms Needed? (`min_rooms_required`)
- **Algorithm:** Chronological sort + **Min-Heap** of active meeting end times.
- **Why Min-Heap:** The top of the heap always holds the meeting that finishes soonest. When a new meeting arrives at time $T$, we free all rooms whose end time $\le T$.
- **Optimality:** The peak number of simultaneous active meetings is mathematically the minimum required room count.

### 3. Specific Room Assignment (`assign_rooms`)
- **Algorithm:** **Dual Min-Heap** (Busy Rooms heap + Free Room IDs heap).
- Automatically reuses the lowest free room (e.g. `Room A`) the instant a meeting finishes, before opening a new room (`Room B`).
- Preserves the input's original indexing.

---

## 🧪 Test Suite Results (11/11 Passed)

| Category | Test Name | Invariant Checked |
| :--- | :--- | :--- |
| **LRU Cache** | Eviction Order & Recency Promotion | Verifies `get(A)` promotes A, causing B to be evicted on next `put`. |
| **LRU Cache** | Key Update Does Not Duplicate Node | Updating an existing key updates value in-place without growing size. |
| **LRU Cache** | Zero Capacity Edge Case | Capacity 0 stores nothing and prevents index out-of-bounds. |
| **LRU Cache** | Capacity = 1 Rapid Eviction | Single-slot cache continuously evicts previous item. |
| **LRU Cache** | Multithreaded Concurrency Under Mutex | 5 threads performing 500 concurrent operations maintain intact pointers. |
| **Scheduler** | Adjacent Boundaries `[9,10)` & `[10,11)` | Validates that meetings touching at endpoint do not conflict. |
| **Scheduler** | Partial Overlap `[9,11)` & `[10,12)` | Flags 10:00-11:00 conflict accurately. |
| **Scheduler** | Identical Timestamps | Duplicate intervals correctly allocate 2 independent rooms. |
| **Scheduler** | Nested Intervals with Reuse | `[9,15)` with `[10,11)` and `[12,13)` correctly reuses Room 2. |
| **Scheduler** | Optimal Dual-Heap Room Reuse | Verifies exact `["Room A", "Room B", "Room A"]` reuse sequence. |
| **Scheduler** | Original Index Preservation | Preserves user's original input ordering even after sorting. |

---

## 📁 Repository Structure

```
Assignement/
├── backend/
│   ├── main.py              # FastAPI server with CORS & REST endpoints
│   ├── lru_cache.py         # LRU Cache & ThreadSafeLRUCache implementations
│   ├── scheduler.py         # can_attend_all, min_rooms, and assign_rooms
│   └── test_suite.py        # Automated test suite runner (11 tests)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LRUVisualizer.jsx       # Simple 3-step story LRU queue
│   │   │   ├── SchedulerVisualizer.jsx # 3 Big answers + Gantt timeline
│   │   │   ├── TestSuiteTab.jsx        # Live unit test scorecard
│   │   │   └── ArchitectureGuide.jsx   # Interview Q&A & complexity table
│   │   ├── App.jsx                     # Simple tabbed layout
│   │   └── index.css                   # Clean, high-contrast design system
│   ├── index.html
│   └── package.json
└── README.md
```
