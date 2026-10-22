"""
Automated Comprehensive Test Runner for LRU Cache and Event Scheduler
Executes edge cases, boundary scenarios, and benchmarks.
"""

import time
from typing import Dict, Any, List
from lru_cache import LRUCache, ThreadSafeLRUCache
from scheduler import can_attend_all, min_rooms_required, assign_rooms


def run_all_tests() -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    overall_start = time.perf_counter()

    def test(name: str, category: str, fn):
        t0 = time.perf_counter()
        try:
            fn()
            duration_ms = (time.perf_counter() - t0) * 1000
            results.append({
                "name": name,
                "category": category,
                "status": "PASSED",
                "duration_ms": round(duration_ms, 3),
                "error": None
            })
        except Exception as e:
            duration_ms = (time.perf_counter() - t0) * 1000
            results.append({
                "name": name,
                "category": category,
                "status": "FAILED",
                "duration_ms": round(duration_ms, 3),
                "error": str(e)
            })

    # ---------- Problem 1: LRU Cache Tests ----------
    def t_lru_basic():
        c = LRUCache(2)
        c.put("A", 10)
        c.put("B", 20)
        v, _ = c.get("A")
        assert v == 10, f"Expected 10, got {v}"
        c.put("C", 30)  # Evicts B because A was touched
        vB, _ = c.get("B")
        vC, _ = c.get("C")
        assert vB == -1, f"Expected -1 for B, got {vB}"
        assert vC == 30, f"Expected 30 for C, got {vC}"
    test("LRU: Eviction Order & Recency Promotion", "LRU Cache", t_lru_basic)

    def t_lru_update():
        c = LRUCache(2)
        c.put("A", 10)
        c.put("A", 99)
        v, _ = c.get("A")
        assert v == 99, f"Expected updated value 99, got {v}"
        assert len(c.nodes) == 1, "Length of map should remain 1 on update"
    test("LRU: Key Update Does Not Duplicate Node", "LRU Cache", t_lru_update)

    def t_lru_zero_cap():
        c = LRUCache(0)
        c.put("X", 50)
        v, _ = c.get("X")
        assert v == -1, "Capacity 0 should store nothing"
    test("LRU: Zero Capacity Edge Case", "LRU Cache", t_lru_zero_cap)

    def t_lru_single_cap():
        c = LRUCache(1)
        c.put("X", 1)
        c.put("Y", 2)
        vX, _ = c.get("X")
        vY, _ = c.get("Y")
        assert vX == -1 and vY == 2, "Capacity 1 should immediately evict previous"
    test("LRU: Capacity = 1 Rapid Eviction", "LRU Cache", t_lru_single_cap)

    def t_lru_thread_safe():
        import threading
        ts_cache = ThreadSafeLRUCache(10)
        def worker(tid):
            for i in range(100):
                ts_cache.put(f"key_{tid}_{i % 5}", i)
                ts_cache.get(f"key_{tid}_{(i - 1) % 5}")
        threads = [threading.Thread(target=worker, args=(t,)) for t in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()
        state = ts_cache.get_state()
        assert state["size"] <= 10, "Thread-safe cache size must remain <= capacity"
    test("LRU: Multithreaded Concurrency Under Mutex", "LRU Cache", t_lru_thread_safe)

    # ---------- Problem 2: Event Scheduler Tests ----------
    def t_sched_attend_adjacent():
        res = can_attend_all([(9, 10), (10, 11), (11, 12)])
        assert res["can_attend"] is True, "Adjacent meetings do NOT overlap"
    test("Scheduler: can_attend_all - Adjacent Boundaries [9,10) & [10,11)", "Event Scheduler", t_sched_attend_adjacent)

    def t_sched_attend_overlap():
        res = can_attend_all([(9, 11), (10, 12)])
        assert res["can_attend"] is False, "Overlapping meetings must return False"
    test("Scheduler: can_attend_all - Partial Overlap", "Event Scheduler", t_sched_attend_overlap)

    def t_sched_rooms_identical():
        res = min_rooms_required([(9, 10), (9, 10)])
        assert res["min_rooms"] == 2, f"Identical times need 2 rooms, got {res['min_rooms']}"
    test("Scheduler: min_rooms_required - Identical Timestamps", "Event Scheduler", t_sched_rooms_identical)

    def t_sched_rooms_nested():
        # Meeting 1: 9-15. Inside it: 10-11 and 12-13.
        # Room 1 takes 9-15. Room 2 takes 10-11, then gets freed, then reuses for 12-13. Total rooms = 2!
        res = min_rooms_required([(9, 15), (10, 11), (12, 13)])
        assert res["min_rooms"] == 2, f"Nested with reuse should need 2 rooms, got {res['min_rooms']}"
    test("Scheduler: min_rooms_required - Nested Intervals with Room Reuse", "Event Scheduler", t_sched_rooms_nested)

    def t_sched_assign_order():
        events = [(9, 11), (10, 12), (11, 13)]
        res = assign_rooms(events)
        assert res["assignments"] == ["Room A", "Room B", "Room A"], f"Got: {res['assignments']}"
    test("Scheduler: assign_rooms - Optimal Dual-Heap Room Reuse", "Event Scheduler", t_sched_assign_order)

    def t_sched_assign_unordered():
        # Input out of order: Meeting 3 first, then 1, then 2
        events = [(11, 13), (9, 11), (10, 12)]
        res = assign_rooms(events)
        # In original positions:
        # idx 0: [11, 13) -> Room A (reusing Room A from meeting 9-11)
        # idx 1: [9, 11)  -> Room A
        # idx 2: [10, 12) -> Room B
        assert res["assignments"] == ["Room A", "Room A", "Room B"], f"Got: {res['assignments']}"
    test("Scheduler: assign_rooms - Original Index Preservation", "Event Scheduler", t_sched_assign_unordered)

    total_time_ms = round((time.perf_counter() - overall_start) * 1000, 2)
    passed_count = sum(1 for r in results if r["status"] == "PASSED")

    return {
        "total_tests": len(results),
        "passed": passed_count,
        "failed": len(results) - passed_count,
        "total_time_ms": total_time_ms,
        "results": results
    }


if __name__ == "__main__":
    report = run_all_tests()
    print(f"Results: {report['passed']}/{report['total_tests']} passed in {report['total_time_ms']}ms")
    for r in report["results"]:
        status_icon = "✔" if r["status"] == "PASSED" else "✖"
        print(f"  {status_icon} [{r['category']}] {r['name']} ({r['duration_ms']}ms)")
