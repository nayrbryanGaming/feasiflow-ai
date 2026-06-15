import asyncio
import json
import os
from typing import Optional, List

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from agents.pipeline import FeasibilityPipeline

load_dotenv()

app = FastAPI(title="FeasiFlow AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active sessions store: session_id → {events, status, result}
sessions: dict = {}


class StartupParams(BaseModel):
    industryCategory: str
    topicSubField: str
    operatingModel: str
    location: Optional[str] = None
    platform: Optional[str] = None
    initialCapital: str
    readinessLevel: str
    teamExpertise: List[str]
    riskProfile: str
    dynamicScenarios: Optional[List[str]] = []
    ideaDescription: str


class AnalyzeRequest(BaseModel):
    session_id: str
    params: StartupParams


async def _run_pipeline(session_id: str, params: dict):
    """Background task: run pipeline and collect events."""
    pipeline = FeasibilityPipeline(session_id)
    sessions[session_id] = {"events": [], "status": "running", "result": None}

    try:
        async for event in pipeline.run(params):
            sessions[session_id]["events"].append(event)
            if event.get("event") == "complete":
                sessions[session_id]["result"] = event.get("data")
                sessions[session_id]["status"] = "done"
    except Exception as e:
        sessions[session_id]["status"] = "error"
        sessions[session_id]["error"] = str(e)


@app.post("/analyze")
async def start_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    session_id = request.session_id
    sessions[session_id] = {"events": [], "status": "queued", "result": None}
    background_tasks.add_task(_run_pipeline, session_id, request.params.model_dump())
    return {"status": "started", "session_id": session_id}


@app.get("/stream/{session_id}")
async def stream_events(session_id: str):
    """SSE endpoint streaming events for a session."""

    async def event_gen():
        sent = 0
        timeout = 0
        while timeout < 300:  # 5 minute max
            session = sessions.get(session_id)
            if not session:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                return

            events = session.get("events", [])
            if len(events) > sent:
                for ev in events[sent:]:
                    yield f"data: {json.dumps(ev)}\n\n"
                sent = len(events)
                timeout = 0  # reset timeout on activity

            if session.get("status") in ("done", "error"):
                break

            await asyncio.sleep(0.2)
            timeout += 0.2

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.get("/result/{session_id}")
async def get_result(session_id: str):
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found", "status": "not_found"}
    return {
        "status": session.get("status"),
        "result": session.get("result"),
        "events_count": len(session.get("events", [])),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "FeasiFlow AI", "sessions_active": len(sessions)}
