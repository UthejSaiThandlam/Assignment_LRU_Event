"""
Problem 2: Event Scheduler
Core Algorithms:
- can_attend_all: Chronological sort + adjacent boundary checking O(n log n)
- min_rooms_required: Chronological sort + Min-Heap (priority queue) of active end times O(n log n)
- assign_rooms: Dual Min-Heap (Occupied + Free room pool) with index-preservation O(n log n)
"""

import heapq
from typing import List, Tuple, Dict, Any, Optional


def room_label(index: int) -> str:
    """Converts 0 -> 'Room 1', 1 -> 'Room 2' (or Room A, Room B)."""
    return f"Room {index + 1}"


def can_attend_all(events: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Determines if one person can attend every event without overlapping.
    Events ending at T and starting at T do NOT clash.
    """
    steps = []
    if len(events) <= 1:
        steps.append("0 or 1 event provided: no conflicts possible. Can attend all.")
        return {
            "can_attend": True,
            "conflict": None,
            "sorted_events": events,
            "steps": steps
        }

    # Sort events by start time
    ordered = sorted(events, key=lambda e: (e[0], e[1]))
    steps.append(f"Sorted events chronologically: {ordered}")

    for i in range(1, len(ordered)):
        prev_start, prev_end = ordered[i - 1]
        curr_start, curr_end = ordered[i]

        steps.append(f"Comparing adjacent: Meeting [{prev_start}, {prev_end}) with Meeting [{curr_start}, {curr_end})")

        # Strict inequality: adjacent meetings do not clash
        if curr_start < prev_end:
            steps.append(f"CONFLICT DETECTED: Next meeting starts at {curr_start} before previous finishes at {prev_end}!")
            return {
                "can_attend": False,
                "conflict": {
                    "event1": [prev_start, prev_end],
                    "event2": [curr_start, curr_end],
                    "overlap_range": [curr_start, prev_end]
                },
                "sorted_events": ordered,
                "steps": steps
            }

    steps.append("All adjacent meetings satisfy curr_start >= prev_end. Person can attend all events.")
    return {
        "can_attend": True,
        "conflict": None,
        "sorted_events": ordered,
        "steps": steps
    }


def min_rooms_required(events: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Computes minimum number of rooms needed using a Min-Heap.
    Returns step-by-step trace showing heap mutations and formatted execution steps.
    """
    if not events:
        return {
            "min_rooms": 0,
            "timeline": [],
            "execution_steps": [],
            "heap_snapshot": [],
            "steps": ["Empty event list: 0 rooms required."]
        }

    ordered = sorted(events, key=lambda e: (e[0], e[1]))
    active_ends = []  # Min-heap of end times
    max_rooms = 0
    timeline = []
    execution_steps = []
    steps = [f"Sorted {len(events)} meetings by start time: {ordered}"]

    execution_steps.append({
        "step_num": 1,
        "desc": "Sort intervals by start time",
        "complexity": "O(n log n)"
    })

    for idx, (start, end) in enumerate(ordered):
        freed = []
        # Release all rooms whose meeting ended at or before current start
        while active_ends and active_ends[0] <= start:
            freed_end = heapq.heappop(active_ends)
            freed.append(freed_end)

        heapq.heappush(active_ends, end)
        curr_count = len(active_ends)
        max_rooms = max(max_rooms, curr_count)

        # Build clean description for the execution step
        if freed:
            freed_str = ", ".join(str(f) for f in freed)
            step_desc = f"Process meeting ({start}, {end}) - Remove {freed_str}, Add {end}: {list(active_ends)}"
        else:
            step_desc = f"Process meeting ({start}, {end}) - Add to heap: {list(active_ends)}"

        execution_steps.append({
            "step_num": idx + 2,
            "desc": step_desc,
            "complexity": "O(log n)"
        })

        steps.append(f"Meeting #{idx+1} [{start}, {end}): Assigned room. Active ends in heap: {list(active_ends)}. Rooms in use: {curr_count}.")

        timeline.append({
            "meeting": [start, end],
            "freed_ends": freed,
            "active_ends": list(active_ends),
            "rooms_occupied": curr_count,
            "peak_so_far": max_rooms
        })

    return {
        "min_rooms": max_rooms,
        "timeline": timeline,
        "execution_steps": execution_steps,
        "heap_snapshot": list(active_ends),
        "steps": steps
    }


def assign_rooms(events: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Assigns specific room labels ('Room 1', 'Room 2', ...) minimizing total rooms.
    Uses Dual Min-Heap (Occupied rooms heap + Free room IDs heap).
    Preserves original event input order.
    """
    if not events:
        return {
            "assignments": [],
            "total_rooms": 0,
            "allocations": [],
            "steps": ["Empty events list: 0 room assignments."]
        }

    indexed = sorted(enumerate(events), key=lambda x: (x[1][0], x[1][1], x[0]))
    busy_heap = []   # Min-heap of (end_time, room_id)
    free_pool = []   # Min-heap of free room IDs (0, 1, 2...)
    next_room_id = 0
    assignments = [None] * len(events)
    steps = [f"Indexed and sorted events chronologically."]
    allocation_details = []

    for orig_idx, (start, end) in indexed:
        freed_rooms = []
        while busy_heap and busy_heap[0][0] <= start:
            freed_end, freed_room = heapq.heappop(busy_heap)
            heapq.heappush(free_pool, freed_room)
            freed_rooms.append(room_label(freed_room))

        if free_pool:
            room_id = heapq.heappop(free_pool)
            reason = f"Reused free {room_label(room_id)}"
        else:
            room_id = next_room_id
            next_room_id += 1
            reason = f"Opened brand-new {room_label(room_id)}"

        room_str = room_label(room_id)
        assignments[orig_idx] = room_str
        heapq.heappush(busy_heap, (end, room_id))

        allocation_details.append({
            "original_index": orig_idx,
            "event": [start, end],
            "assigned_room": room_str,
            "room_id": room_id,
            "reason": reason
        })

    return {
        "assignments": assignments,
        "total_rooms": next_room_id,
        "allocations": allocation_details,
        "steps": steps
    }
