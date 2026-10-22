"""
Problem 1: LRU Cache (Least Recently Used)
Core Architecture: Hash Map + Doubly Linked List with Sentinel Nodes
Thread-safe implementation with Mutex lock and trace instrumentation for visualizer.
"""

import threading
from typing import Any, Dict, List, Optional, Tuple


class Node:
    __slots__ = ("key", "value", "prev", "next")

    def __init__(self, key: Any = None, value: Any = None):
        self.key = key
        self.value = value
        self.prev: Optional["Node"] = None
        self.next: Optional["Node"] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key": self.key,
            "value": self.value,
            "prev_key": self.prev.key if self.prev and self.prev.key is not None else ("HEAD" if self.prev else None),
            "next_key": self.next.key if self.next and self.next.key is not None else ("TAIL" if self.next else None),
        }


class LRUCache:
    def __init__(self, capacity: int):
        if capacity < 0:
            raise ValueError("Capacity cannot be negative")
        self.capacity = capacity
        self.nodes: Dict[Any, Node] = {}

        # Sentinel nodes
        self.head = Node("HEAD_SENTINEL", None)
        self.tail = Node("TAIL_SENTINEL", None)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _unlink(self, node: Node) -> None:
        """Unlinks a node from the doubly linked list in O(1) time."""
        node.prev.next = node.next
        node.next.prev = node.prev

    def _append_mru(self, node: Node) -> None:
        """Attaches a node immediately before the tail sentinel (MRU side) in O(1)."""
        last_real = self.tail.prev
        last_real.next = node
        node.prev = last_real
        node.next = self.tail
        self.tail.prev = node

    def _promote_to_mru(self, node: Node) -> None:
        """Moves an existing node to the MRU position."""
        self._unlink(node)
        self._append_mru(node)

    def set_capacity(self, new_capacity: int) -> List[Any]:
        """Dynamically adjusts capacity and evicts LRU items if shrinking."""
        if new_capacity < 0:
            raise ValueError("Capacity cannot be negative")
        self.capacity = new_capacity
        evicted = []
        while len(self.nodes) > self.capacity and self.capacity > 0:
            lru_node = self.head.next
            evicted.append(lru_node.key)
            self._unlink(lru_node)
            del self.nodes[lru_node.key]
        return evicted

    def get(self, key: Any) -> Tuple[Any, List[str]]:
        """
        Retrieves value for key. If key exists, promotes it to MRU.
        Returns (value, trace_messages).
        """
        trace = []
        node = self.nodes.get(key)
        if node is None:
            trace.append(f"CACHE MISS: Key '{key}' not found in hash map. Returned -1.")
            return -1, trace

        # Read mutates recency order
        self._promote_to_mru(node)
        trace.append(f"CACHE HIT: Key '{key}' found with value '{node.value}'.")
        trace.append(f"RECENCY UPDATE: Unlinked '{key}' from DLL and appended to MRU end (before TAIL).")
        return node.value, trace

    def put(self, key: Any, value: Any) -> Tuple[bool, Optional[Any], List[str]]:
        """
        Inserts or updates (key, value). Evicts LRU if capacity exceeded.
        Returns (is_updated, evicted_key, trace_messages).
        """
        trace = []
        if self.capacity == 0:
            trace.append("CAPACITY ZERO: Cache cannot store any elements. No-op.")
            return False, None, trace

        # Case 1: Key already exists (Update)
        if key in self.nodes:
            node = self.nodes[key]
            old_val = node.value
            node.value = value
            self._promote_to_mru(node)
            trace.append(f"UPDATE KEY: Key '{key}' already exists (old: {old_val}, new: {value}).")
            trace.append(f"RECENCY UPDATE: Promoted '{key}' to MRU end.")
            return True, None, trace

        evicted_key = None
        # Case 2: Capacity reached -> Evict LRU (head.next)
        if len(self.nodes) == self.capacity:
            lru_node = self.head.next
            evicted_key = lru_node.key
            self._unlink(lru_node)
            del self.nodes[evicted_key]
            trace.append(f"CAPACITY REACHED ({self.capacity}): Evicted LRU key '{evicted_key}' (front of line).")
            trace.append(f"DESYNC GUARD: Removed key '{evicted_key}' from both Doubly Linked List AND Hash Map.")

        # Case 3: Insert new item
        new_node = Node(key, value)
        self.nodes[key] = new_node
        self._append_mru(new_node)
        trace.append(f"INSERT NEW KEY: Stored '{key}' -> '{value}' in hash map.")
        trace.append(f"MRU INSERT: Appended node '{key}' directly before TAIL sentinel.")

        return False, evicted_key, trace

    def get_state(self) -> Dict[str, Any]:
        """Serializes current state for the visualizer."""
        # Walk list from head.next to tail.prev
        chain = []
        curr = self.head.next
        while curr and curr != self.tail:
            chain.append({
                "key": str(curr.key),
                "value": str(curr.value)
            })
            curr = curr.next

        hash_map = {str(k): str(v.value) for k, v in self.nodes.items()}

        return {
            "capacity": self.capacity,
            "size": len(self.nodes),
            "chain": chain,  # [LRU ... MRU]
            "hash_map": hash_map,
            "lru_key": chain[0]["key"] if chain else None,
            "mru_key": chain[-1]["key"] if chain else None,
        }


class ThreadSafeLRUCache(LRUCache):
    """Thread-safe variant protecting all state mutations with a mutual exclusion lock."""
    def __init__(self, capacity: int):
        super().__init__(capacity)
        self._lock = threading.RLock()

    def get(self, key: Any) -> Tuple[Any, List[str]]:
        with self._lock:
            return super().get(key)

    def put(self, key: Any, value: Any) -> Tuple[bool, Optional[Any], List[str]]:
        with self._lock:
            return super().put(key, value)

    def set_capacity(self, new_capacity: int) -> List[Any]:
        with self._lock:
            return super().set_capacity(new_capacity)

    def get_state(self) -> Dict[str, Any]:
        with self._lock:
            return super().get_state()
