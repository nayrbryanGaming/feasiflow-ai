import asyncio
import json
from typing import AsyncGenerator
from concurrent.futures import ThreadPoolExecutor

from agents.orchestrator_agent import OrchestratorAgent
from agents.bmc_agent import BMCAgent
from agents.market_research_agent import MarketResearchAgent
from agents.competitor_agent import CompetitorAgent
from agents.sentiment_agent import SentimentAgent
from agents.risk_agent import RiskAgent
from agents.regulatory_agent import RegulatoryAgent
from agents.financial_agent import FinancialAgent
from agents.recommendation_agent import RecommendationAgent
from agents.monitor import AgentMonitor

# ThreadPoolExecutor with 6 workers for Phase 3 parallel (Market+Competitor+Sentiment)
executor = ThreadPoolExecutor(max_workers=6)

# ─────────────────────────────────────────────────────────────────────────────
# 9-AGENT PIPELINE ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────────────
# Phase 1 (sequential):  Agent 1 — Orchestrator
# Phase 2 (sequential):  Agent 2 — BMC
# Phase 3 (parallel 3×): Agent 3 — Market Research
#                         Agent 4 — Competitor
#                         Agent 5 — Sentiment & Social Intelligence
# Phase 4 (parallel 2×): Agent 6 — Risk Analysis
#                         Agent 7 — Regulatory Intelligence
# Phase 5 (sequential):  Agent 8 — Financial Modeling (needs 6+7 output)
# Phase 6 (sequential):  Agent 9 — Recommendation (needs all 8 outputs)
# ─────────────────────────────────────────────────────────────────────────────

# Progress checkpoints per phase
PROGRESS = {
    "orchestrator_start": 3,
    "orchestrator_done": 11,
    "bmc_start": 11,
    "bmc_done": 21,
    "phase3_start": 21,
    "phase3_done": 52,
    "phase4_start": 52,
    "phase4_done": 72,
    "financial_start": 72,
    "financial_done": 84,
    "recommendation_start": 84,
    "recommendation_done": 100,
}


class FeasibilityPipeline:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.monitor = AgentMonitor(session_id)

        # Instantiate all 9 agents
        self.orchestrator = OrchestratorAgent()
        self.bmc = BMCAgent()
        self.market = MarketResearchAgent()
        self.competitor = CompetitorAgent()
        self.sentiment = SentimentAgent()
        self.risk = RiskAgent()
        self.regulatory = RegulatoryAgent()
        self.financial = FinancialAgent()
        self.recommendation = RecommendationAgent()

    async def run(self, params: dict) -> AsyncGenerator[dict, None]:
        """
        Run 9-agent pipeline with SSE streaming progress events.

        7 Sifat Penilaian dari 9 Agen:
        1. Market Validation     → Market Research Agent      (bobot 20%)
        2. Business Model        → BMC Agent                  (bobot 18%)
        3. Risk Profile          → Risk Agent                 (bobot 17%)
        4. Competitive Advantage → Competitor Agent           (bobot 15%)
        5. Financial Sustainability → Financial Agent         (bobot 12%)
        6. Demand Validation     → Sentiment Agent            (bobot 10%)
        7. Regulatory Feasibility → Regulatory Agent         (bobot 8%)
        """
        results = {}
        loop = asyncio.get_event_loop()

        # ══════════════════════════════════════════════════════════════════
        # PHASE 1: ORCHESTRATOR (sequential)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("orchestrator")
        yield self._event("agent_start", "orchestrator", PROGRESS["orchestrator_start"])

        try:
            orch = await loop.run_in_executor(executor, self.orchestrator.run, params)
            results["orchestrator"] = orch
            self.monitor.agent_done("orchestrator", orch.pop("_tokens", 0))
            yield self._event("agent_done", "orchestrator", PROGRESS["orchestrator_done"], data={
                "startup_summary": orch.get("startup_summary", ""),
                "early_warnings": orch.get("early_warnings", []),
                "industry_context": orch.get("industry_context", ""),
            })
        except Exception as e:
            self.monitor.agent_error("orchestrator", str(e))
            results["orchestrator"] = {"startup_summary": "Analisis dimulai", "early_warnings": [], "execution_plan": {}}
            yield self._event("agent_error", "orchestrator", PROGRESS["orchestrator_done"], data={"error": str(e)})

        # ══════════════════════════════════════════════════════════════════
        # PHASE 2: BMC (sequential)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("bmc")
        yield self._event("agent_start", "bmc", PROGRESS["bmc_start"])

        try:
            bmc = await loop.run_in_executor(executor, self.bmc.run, params, results["orchestrator"])
            results["bmc"] = bmc
            self.monitor.agent_done("bmc", bmc.pop("_tokens", 0))
            yield self._event("agent_done", "bmc", PROGRESS["bmc_done"], data={
                "business_model_score": bmc.get("business_model_score", 0),
                "value_proposition_strength": bmc.get("value_proposition_strength", ""),
                "revenue_model_risk": bmc.get("revenue_model_risk", ""),
                "time_to_first_revenue": bmc.get("time_to_first_revenue", ""),
            })
        except Exception as e:
            self.monitor.agent_error("bmc", str(e))
            results["bmc"] = {"business_model_score": 55}
            yield self._event("agent_error", "bmc", PROGRESS["bmc_done"], data={"error": str(e)})

        # ══════════════════════════════════════════════════════════════════
        # PHASE 3: Market Research + Competitor + Sentiment (parallel 3×)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("market_research")
        self.monitor.agent_start("competitor")
        self.monitor.agent_start("sentiment")

        yield self._event("agent_start", "market_research", PROGRESS["phase3_start"])
        yield self._event("agent_start", "competitor", PROGRESS["phase3_start"] + 2)
        yield self._event("agent_start", "sentiment", PROGRESS["phase3_start"] + 4)

        def run_market():
            return self.market.run(params, results["orchestrator"])

        def run_competitor():
            return self.competitor.run(params, results["orchestrator"])

        def run_sentiment():
            return self.sentiment.run(params, results["orchestrator"])

        try:
            market_fut = loop.run_in_executor(executor, run_market)
            competitor_fut = loop.run_in_executor(executor, run_competitor)
            sentiment_fut = loop.run_in_executor(executor, run_sentiment)

            market, competitor, sentiment = await asyncio.gather(
                market_fut, competitor_fut, sentiment_fut
            )

            results["market"] = market
            results["competitor"] = competitor
            results["sentiment"] = sentiment

            self.monitor.agent_done("market_research", market.pop("_tokens", 0))
            self.monitor.agent_done("competitor", competitor.pop("_tokens", 0))
            self.monitor.agent_done("sentiment", sentiment.pop("_tokens", 0))

            yield self._event("agent_done", "market_research", PROGRESS["phase3_done"] - 10, data={
                "market_score": market.get("market_score", 0),
                "tam": market.get("tam", {}),
                "sam": market.get("sam", {}),
                "som": market.get("som", {}),
                "growth_rate": market.get("growth_rate", ""),
                "market_maturity": market.get("market_maturity", ""),
                "market_trends": market.get("market_trends", []),
            })
            yield self._event("agent_done", "competitor", PROGRESS["phase3_done"] - 5, data={
                "competitive_advantage_score": competitor.get("competitive_advantage_score", 0),
                "direct_competitors": competitor.get("direct_competitors", []),
                "competitive_landscape": competitor.get("competitive_landscape", ""),
                "our_differentiation": competitor.get("our_differentiation", ""),
            })
            yield self._event("agent_done", "sentiment", PROGRESS["phase3_done"], data={
                "validated_demand_score": sentiment.get("validated_demand_score", 0),
                "pain_point_evidence": sentiment.get("pain_point_evidence", []),
                "positive_signals": sentiment.get("positive_signals", []),
                "key_insight": sentiment.get("key_insight", ""),
                "sentiment_summary": sentiment.get("sentiment_summary", ""),
            })
        except Exception as e:
            results["market"] = {"market_score": 55}
            results["competitor"] = {"competitive_advantage_score": 55}
            results["sentiment"] = {"validated_demand_score": 55}
            self.monitor.agent_error("market_research", str(e))
            self.monitor.agent_error("competitor", str(e))
            self.monitor.agent_error("sentiment", str(e))
            yield self._event("agent_error", "market_research", PROGRESS["phase3_done"], data={"error": str(e)})

        # ══════════════════════════════════════════════════════════════════
        # PHASE 4: Risk + Regulatory (parallel 2×)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("risk")
        self.monitor.agent_start("regulatory")

        yield self._event("agent_start", "risk", PROGRESS["phase4_start"])
        yield self._event("agent_start", "regulatory", PROGRESS["phase4_start"] + 2)

        def run_risk():
            return self.risk.run(
                params, results["bmc"], results["market"], results["competitor"]
            )

        def run_regulatory():
            # Pass empty dict for risk if not ready yet (fallback)
            risk_partial = results.get("risk", {"risk_level": "Medium", "risk_breakdown": {}})
            return self.regulatory.run(params, results["orchestrator"], risk_partial)

        try:
            risk_fut = loop.run_in_executor(executor, run_risk)
            regulatory_fut = loop.run_in_executor(executor, run_regulatory)

            risk, regulatory = await asyncio.gather(risk_fut, regulatory_fut)

            results["risk"] = risk
            results["regulatory"] = regulatory

            self.monitor.agent_done("risk", risk.pop("_tokens", 0))
            self.monitor.agent_done("regulatory", regulatory.pop("_tokens", 0))

            yield self._event("agent_done", "risk", PROGRESS["phase4_done"] - 5, data={
                "overall_risk_score": risk.get("overall_risk_score", 0),
                "risk_level": risk.get("risk_level", ""),
                "top_3_critical_risks": risk.get("top_3_critical_risks", []),
                "runway_estimate": risk.get("runway_estimate", ""),
            })
            yield self._event("agent_done", "regulatory", PROGRESS["phase4_done"], data={
                "regulatory_feasibility_score": regulatory.get("regulatory_feasibility_score", 0),
                "primary_regulator": regulatory.get("primary_regulator", ""),
                "required_licenses": regulatory.get("required_licenses", []),
                "compliance_roadmap": regulatory.get("compliance_roadmap", []),
                "quick_win_path": regulatory.get("quick_win_path", ""),
            })
        except Exception as e:
            results["risk"] = {"overall_risk_score": 55, "risk_level": "Medium", "top_3_critical_risks": []}
            results["regulatory"] = {"regulatory_feasibility_score": 60}
            self.monitor.agent_error("risk", str(e))
            self.monitor.agent_error("regulatory", str(e))
            yield self._event("agent_error", "risk", PROGRESS["phase4_done"], data={"error": str(e)})

        # ══════════════════════════════════════════════════════════════════
        # PHASE 5: Financial Modeling (sequential — needs Risk + Regulatory)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("financial")
        yield self._event("agent_start", "financial", PROGRESS["financial_start"])

        try:
            financial = await loop.run_in_executor(
                executor,
                self.financial.run,
                params,
                results["orchestrator"],
                results["bmc"],
                results["market"],
                results["risk"],
                results["regulatory"],
            )
            results["financial"] = financial
            self.monitor.agent_done("financial", financial.pop("_tokens", 0))
            yield self._event("agent_done", "financial", PROGRESS["financial_done"], data={
                "financial_sustainability_score": financial.get("financial_sustainability_score", 0),
                "runway_projection": financial.get("runway_projection", {}),
                "revenue_projection": financial.get("revenue_projection", {}),
                "funding_recommendation": financial.get("funding_recommendation", {}),
                "financial_summary": financial.get("financial_summary", ""),
            })
        except Exception as e:
            self.monitor.agent_error("financial", str(e))
            results["financial"] = {"financial_sustainability_score": 55}
            yield self._event("agent_error", "financial", PROGRESS["financial_done"], data={"error": str(e)})

        # ══════════════════════════════════════════════════════════════════
        # PHASE 6: Recommendation (sequential — needs all 8 outputs)
        # ══════════════════════════════════════════════════════════════════
        self.monitor.agent_start("recommendation")
        yield self._event("agent_start", "recommendation", PROGRESS["recommendation_start"])

        try:
            rec = await loop.run_in_executor(
                executor,
                self.recommendation.run,
                params,
                results["orchestrator"],
                results["bmc"],
                results["market"],
                results["competitor"],
                results["risk"],
                results["sentiment"],
                results["regulatory"],
                results["financial"],
            )
            results["recommendation"] = rec
            self.monitor.agent_done("recommendation", rec.pop("_tokens", 0))

            # Build complete final result with all 9 agents
            final = {
                "session_id": self.session_id,
                "params": params,
                "orchestrator": results["orchestrator"],
                "bmc": results["bmc"],
                "market": results["market"],
                "competitor": results["competitor"],
                "sentiment": results["sentiment"],
                "risk": results["risk"],
                "regulatory": results["regulatory"],
                "financial": results["financial"],
                "recommendation": rec,
                "monitoring": self.monitor.get_summary(),
                "meta": {
                    "agent_count": 9,
                    "assessment_dimensions": 7,
                    "scraping_methods_count": 7,
                    "formula": "Skor = (Market×0.20) + (BM×0.18) + (Risk×0.17) + (CA×0.15) + (Financial×0.12) + (Demand×0.10) + (Regulatory×0.08)"
                }
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
