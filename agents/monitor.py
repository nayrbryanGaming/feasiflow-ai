import json
import time
import os
from datetime import datetime
from typing import Dict, Any, List


class AgentMonitor:
    """Tracks execution time, token usage, and status for each agent."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.start_time = time.time()
        self.agent_timings: Dict[str, Any] = {}
        self.agent_statuses: Dict[str, str] = {}
        self.events: List[Dict] = []

    def agent_start(self, agent_name: str):
        self.agent_timings[agent_name] = {"start": time.time(), "elapsed": None, "tokens": 0}
        self.agent_statuses[agent_name] = "running"
        self._record_event("agent_start", agent_name)

    def agent_done(self, agent_name: str, tokens_used: int = 0):
        if agent_name in self.agent_timings:
            elapsed = time.time() - self.agent_timings[agent_name]["start"]
            self.agent_timings[agent_name]["elapsed"] = round(elapsed, 2)
            self.agent_timings[agent_name]["tokens"] = tokens_used
        self.agent_statuses[agent_name] = "done"
        self._record_event("agent_done", agent_name, {"elapsed_seconds": self.agent_timings.get(agent_name, {}).get("elapsed"), "tokens_used": tokens_used})

    def agent_error(self, agent_name: str, error: str):
        self.agent_statuses[agent_name] = "error"
        self._record_event("agent_error", agent_name, {"error": error})

    def _record_event(self, event_type: str, agent_name: str, extra: Dict = None):
        event = {
            "timestamp": datetime.now().isoformat(),
            "session_id": self.session_id,
            "event": event_type,
            "agent": agent_name,
        }
        if extra:
            event.update(extra)
        self.events.append(event)

    def get_total_elapsed(self) -> float:
        return round(time.time() - self.start_time, 2)

    def get_summary(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "total_elapsed_seconds": self.get_total_elapsed(),
            "agents": self.agent_timings,
            "statuses": self.agent_statuses,
            "events_count": len(self.events),
            "total_tokens": sum(
                v.get("tokens", 0) for v in self.agent_timings.values()
            ),
        }
