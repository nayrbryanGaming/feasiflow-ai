import asyncio
import json
from typing import AsyncGenerator
from concurrent.futures import ThreadPoolExecutor

from agents.orchestrator_agent import OrchestratorAgent
from agents.bmc_agent import BMCAgent
from agents.market_research_agent import MarketResearchAgent
from agents.competitor_agent import CompetitorAgent
from agents.risk_agent import RiskAgent
from agents.recommendation_agent import RecommendationAgent
from agents.monitor import AgentMonitor

executor = ThreadPoolExecutor(max_workers=4)


def _run_sync(fn, *args):
    """Run a synchronous agent in thread pool."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(executor, fn, *args)


class FeasibilityPipeline:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.monitor = AgentMonitor(session_id)
        self.orchestrator = OrchestratorAgent()
        self.bmc = BMCAgent()
        self.market = MarketResearchAgent()
        self.competitor = CompetitorAgent()
        self.risk = RiskAgent()
        self.recommendation = RecommendationAgent()

    async def run(self, params: dict) -> AsyncGenerator[dict, None]:
        """Run 6 agents with SSE streaming progress events."""
        results = {}

        # ── Agent 1: Orchestrator ──────────────────────────────────
        self.monitor.agent_start("orchestrator")
        yield self._event("agent_start", "orchestrator", 5)

        try:
            orch = await asyncio.get_event_loop().run_in_executor(
                executor, self.orchestrator.run, params
            )
            results["orchestrator"] = orch
            self.monitor.agent_done("orchestrator", orch.pop("_tokens", 0))
            yield self._event("agent_done", "orchestrator", 15, data={
                "startup_summary": orch.get("startup_summary", ""),
                "early_warnings": orch.get("early_warnings", []),
            })
        except Exception as e:
            self.monitor.agent_error("orchestrator", str(e))
            results["orchestrator"] = {"startup_summary": "Analisis dimulai", "early_warnings": [], "execution_plan": {}}
            yield self._event("agent_error", "orchestrator", 15, data={"error": str(e)})

        # ── Agent 2: BMC ───────────────────────────────────────────
        self.monitor.agent_start("bmc")
        yield self._event("agent_start", "bmc", 15)

        try:
            bmc = await asyncio.get_event_loop().run_in_executor(
                executor, self.bmc.run, params, results["orchestrator"]
            )
            results["bmc"] = bmc
            self.monitor.agent_done("bmc", bmc.pop("_tokens", 0))
            yield self._event("agent_done", "bmc", 30, data=bmc)
        except Exception as e:
            self.monitor.agent_error("bmc", str(e))
            results["bmc"] = {}
            yield self._event("agent_error", "bmc", 30, data={"error": str(e)})

        # ── Agent 3 & 4: Market Research + Competitor (parallel) ──
        self.monitor.agent_start("market_research")
        self.monitor.agent_start("competitor")
        yield self._event("agent_start", "market_research", 30)
        yield self._event("agent_start", "competitor", 35)

        def run_market():
            return self.market.run(params, results["orchestrator"])

        def run_competitor():
            return self.competitor.run(params, results["orchestrator"])

        try:
            loop = asyncio.get_event_loop()
            market_fut = loop.run_in_executor(executor, run_market)
            competitor_fut = loop.run_in_executor(executor, run_competitor)
            market, competitor = await asyncio.gather(market_fut, competitor_fut)

            results["market"] = market
            results["competitor"] = competitor

            self.monitor.agent_done("market_research", market.pop("_tokens", 0))
            self.monitor.agent_done("competitor", competitor.pop("_tokens", 0))

            yield self._event("agent_done", "market_research", 55, data={
                "tam": market.get("tam", {}),
                "sam": market.get("sam", {}),
                "som": market.get("som", {}),
                "market_trends": market.get("market_trends", []),
                "growth_rate": market.get("growth_rate", ""),
                "market_maturity": market.get("market_maturity", ""),
            })
            yield self._event("agent_done", "competitor", 60, data={
                "direct_competitors": competitor.get("direct_competitors", []),
                "competitive_landscape": competitor.get("competitive_landscape", ""),
                "our_differentiation": competitor.get("our_differentiation", ""),
            })
        except Exception as e:
            results["market"] = {}
            results["competitor"] = {}
            yield self._event("agent_error", "market_research", 60, data={"error": str(e)})

        # ── Agent 5: Risk Analysis ─────────────────────────────────
        self.monitor.agent_start("risk")
        yield self._event("agent_start", "risk", 60)

        try:
            risk = await asyncio.get_event_loop().run_in_executor(
                executor, self.risk.run,
                params, results["bmc"], results["market"], results["competitor"]
            )
            results["risk"] = risk
            self.monitor.agent_done("risk", risk.pop("_tokens", 0))
            yield self._event("agent_done", "risk", 80, data={
                "overall_risk_score": risk.get("overall_risk_score", 50),
                "risk_level": risk.get("risk_level", "Medium"),
                "top_3_critical_risks": risk.get("top_3_critical_risks", []),
                "runway_estimate": risk.get("runway_estimate", ""),
            })
        except Exception as e:
            self.monitor.agent_error("risk", str(e))
            results["risk"] = {"overall_risk_score": 50, "risk_level": "Medium", "top_3_critical_risks": []}
            yield self._event("agent_error", "risk", 80, data={"error": str(e)})

        # ── Agent 6: Recommendation + Scoring ─────────────────────
        self.monitor.agent_start("recommendation")
        yield self._event("agent_start", "recommendation", 80)

        try:
            rec = await asyncio.get_event_loop().run_in_executor(
                executor, self.recommendation.run,
                params,
                results["orchestrator"],
                results["bmc"],
                results["market"],
                results["competitor"],
                results["risk"],
            )
            results["recommendation"] = rec
            self.monitor.agent_done("recommendation", rec.pop("_tokens", 0))

            # Build final complete result
            final = {
                "session_id": self.session_id,
                "params": params,
                "orchestrator": results["orchestrator"],
                "bmc": results["bmc"],
                "market": results["market"],
                "competitor": results["competitor"],
                "risk": results["risk"],
                "recommendation": rec,
                "monitoring": self.monitor.get_summary(),
            }

            yield self._event("complete", "recommendation", 100, data=final)

        except Exception as e:
            self.monitor.agent_error("recommendation", str(e))
            yield self._event("agent_error", "recommendation", 100, data={"error": str(e)})

    def _event(self, event_type: str, agent: str, progress: int, data: dict = None) -> dict:
        ev = {"event": event_type, "agent": agent, "progress": progress}
        if data:
            ev["data"] = data
        return ev
