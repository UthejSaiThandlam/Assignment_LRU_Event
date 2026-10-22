"""
FastAPI Server for Data Structures & Systems Design SE Intern Project
Exposes LRU Cache, Event Scheduler, and Test Suite endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Tuple, Any, Optional

from lru_cache import ThreadSafeLRUCache
from scheduler import can_attend_all, min_rooms_required, assign_rooms
from test_suite import run_all_tests

app = FastAPI(
    title="Data Structures & Systems Design Lab",
    description="Interactive backend supporting LRU Cache (Hash Map + DLL) and Event Scheduler (Min-Heap)",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (and any origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory singleton LRU cache instance
lru_instance = ThreadSafeLRUCache(capacity=3)


# Pydantic Schemas
class LRUInitRequest(BaseModel):
    capacity: int = Field(..., ge=0, le=100)


class LRUPutRequest(BaseModel):
    key: str
    value: str


class LRUGetRequest(BaseModel):
    key: str


class EventsRequest(BaseModel):
    events: List[Tuple[float, float]]


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Data Structures & Systems Design Engine",
        "lru_capacity": lru_instance.capacity,
        "lru_size": len(lru_instance.nodes)
    }


# ==================== LRU Cache Endpoints ====================

@app.post("/api/lru/init")
def init_lru(req: LRUInitRequest):
    global lru_instance
    lru_instance = ThreadSafeLRUCache(capacity=req.capacity)
    return {
        "message": f"LRU Cache reinitialized with capacity {req.capacity}",
        "state": lru_instance.get_state()
    }


@app.post("/api/lru/set_capacity")
def set_lru_capacity(req: LRUInitRequest):
    global lru_instance
    evicted = lru_instance.set_capacity(req.capacity)
    return {
        "message": f"Capacity set to {req.capacity}",
        "evicted": evicted,
        "state": lru_instance.get_state()
    }


@app.get("/api/lru/state")
def get_lru_state():
    return {"state": lru_instance.get_state()}


@app.post("/api/lru/put")
def lru_put(req: LRUPutRequest):
    updated, evicted, trace = lru_instance.put(req.key, req.value)
    return {
        "key": req.key,
        "value": req.value,
        "is_updated": updated,
        "evicted_key": evicted,
        "trace": trace,
        "state": lru_instance.get_state()
    }


@app.post("/api/lru/get")
def lru_get(req: LRUGetRequest):
    val, trace = lru_instance.get(req.key)
    return {
        "key": req.key,
        "value": val,
        "found": val != -1,
        "trace": trace,
        "state": lru_instance.get_state()
    }


# ==================== Event Scheduler Endpoints ====================

@app.post("/api/scheduler/can_attend")
def api_can_attend(req: EventsRequest):
    # Validate intervals
    for start, end in req.events:
        if start >= end:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval [{start}, {end}]. Start must be strictly less than end."
            )
    return can_attend_all(req.events)


@app.post("/api/scheduler/min_rooms")
def api_min_rooms(req: EventsRequest):
    for start, end in req.events:
        if start >= end:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval [{start}, {end}]. Start must be strictly less than end."
            )
    return min_rooms_required(req.events)


@app.post("/api/scheduler/assign_rooms")
def api_assign_rooms(req: EventsRequest):
    for start, end in req.events:
        if start >= end:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval [{start}, {end}]. Start must be strictly less than end."
            )
    return assign_rooms(req.events)


# ==================== Test Suite Runner ====================

@app.get("/api/test_suite/run")
def api_run_test_suite():
    return run_all_tests()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
