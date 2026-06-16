import { NextResponse } from "next/server";
import type { StartupParameters, AnalysisResult } from "@/lib/types";
import type { StartupParams } from "@/lib/agents-ts/orchestrator";
import { runOrchestrator } from "@/lib/agents-ts/orchestrator";
import { runBMC } from "@/lib/agents-ts/bmc";
import { runMarketResearch } from "@/lib/agents-ts/market_research";
import { runCompetitor } from "@/lib/agents-ts/competitor";
import { runSentiment } from "@/lib/agents-ts/sentiment";
import { runRisk } from "@/lib/agents-ts/risk";
import { runRegulatory } from "@/lib/agents-ts/regulatory";
import { runFinancial } from "@/lib/agents-ts/financial";
import { runRecommendation } from "@/lib/agents-ts/recommendation";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes (Vercel Pro/Hobby streaming)

// ── Admission control (antrian) ──────────────────────────────────────────────
// Cap concurrent pipelines so each running analysis keeps enough Groq token
// budget to finish within the 300s limit. Over capacity → 503 and the client
// waits in a queue + retries, which also staggers spikes into spread-out load.
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_RUNS ?? 5);
let activeRuns = 0;

// Map form params to agent params
function toAgentParams(p: StartupParameters): StartupParams {
  const startup_name = p.topicSubField || p.ideaDescription.slice(0, 60).trim();
  const founder_background = [
    `Keahlian: ${p.teamExpertise.join(", ")}`,
    `Kesiapan: ${p.readinessLevel}`,
    `Profil risiko: ${p.riskProfile}`,
  ].join(" | ");
  const business_model = [
    p.operatingModel,
    p.platform ? `Platform: ${p.platform}` : "",
    p.location ? `Lokasi: ${p.location}` : "",
  ].filter(Boolean).join(" | ");

  return {
    startup_name,
    industry_category: p.industryCategory,
    product_description: p.ideaDescription,
    target_market: `${p.industryCategory} — ${p.topicSubField}`,
    unique_value_proposition: p.ideaDescription.slice(0, 300),
    business_model,
    initial_capital: p.initialCapital,
    founder_background,
  };
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let body: { params: StartupParameters; sessionId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { params: formParams, sessionId } = body;
  if (!formParams?.industryCategory || !formParams?.ideaDescription) {
    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  }

  // At capacity → tell the client to wait in the antrian and retry shortly.
  if (activeRuns >= MAX_CONCURRENT) {
    return NextResponse.json(
      { queued: true, active: activeRuns, capacity: MAX_CONCURRENT, message: "Sistem sibuk — Anda dalam antrian." },
      { status: 503, headers: { "Retry-After": "5" } }
    );
  }
  activeRuns++;

  const agentParams = toAgentParams(formParams);
  const startTime = Date.now();
  const monitoring: AnalysisResult["monitoring"] = {
    session_id: sessionId,
    total_elapsed_seconds: 0,
    agents: {},
    total_tokens: 0,
    events_count: 0,
  };

  const enc = new TextEncoder();
  let progress = 0;
  let currentAgent = "orchestrator";
  let controller!: ReadableStreamDefaultController<Uint8Array>;

  // Accumulated results
  const results: Partial<AnalysisResult> = { session_id: sessionId, params: formParams };

  const stream = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
  });

  const emit = (data: object) => {
    try {
      controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      monitoring.events_count++;
    } catch { /* client disconnected */ }
  };

  const agentStart = (agent: string, p: number) => {
    progress = p;
    currentAgent = agent;
    emit({ event: "agent_start", agent, progress });
  };

  const agentDone = (agent: string, p: number, elapsed: number, tokens: number) => {
    progress = p;
    monitoring.agents[agent] = { elapsed: +elapsed.toFixed(1), tokens };
    monitoring.total_tokens += tokens;
    emit({ event: "agent_done", agent, progress, elapsed_seconds: +elapsed.toFixed(1), tokens_used: tokens });
  };

  // Run pipeline asynchronously so we can return the stream header immediately
  (async () => {
    try {
      // ── Phase 1: Orchestrator ─────────────────────────────────────────────
      agentStart("orchestrator", 5);
      const t0 = Date.now();
      const orchestratorResult = await runOrchestrator(agentParams);
      results.orchestrator = {
        startup_summary: orchestratorResult.mission,
        industry_context: orchestratorResult.startup_dna,
        analysis_priorities: orchestratorResult.strategic_priorities,
        early_warnings: orchestratorResult.key_questions,
        execution_plan: {},
        key_assumptions: [],
        feasibility_context: orchestratorResult.analysis_framework,
      };
      agentDone("orchestrator", 15, (Date.now() - t0) / 1000, 0);

      // ── Phase 2: BMC ──────────────────────────────────────────────────────
      agentStart("bmc", 15);
      const t1 = Date.now();
      const bmcResult = await runBMC(agentParams, orchestratorResult.mission);
      results.bmc = bmcResult as unknown as AnalysisResult["bmc"];
      agentDone("bmc", 28, (Date.now() - t1) / 1000, 0);

      // ── Phase 3: Market + Competitor + Sentiment (parallel) ───────────────
      agentStart("market_research", 28);
      agentStart("competitor", 28);
      agentStart("sentiment", 28);

      const t2 = Date.now();
      const [marketResult, competitorResult, sentimentResult] = await Promise.all([
        runMarketResearch(agentParams, orchestratorResult.mission),
        runCompetitor(agentParams, orchestratorResult.mission),
        runSentiment(agentParams, orchestratorResult.mission),
      ]);

      results.market = marketResult as unknown as AnalysisResult["market"];
      results.competitor = competitorResult as unknown as AnalysisResult["competitor"];
      results.sentiment = sentimentResult as unknown as AnalysisResult["sentiment"];

      const p3elapsed = (Date.now() - t2) / 1000;
      agentDone("market_research", 50, p3elapsed, 0);
      agentDone("competitor", 50, p3elapsed, 0);
      agentDone("sentiment", 50, p3elapsed, 0);

      // ── Phase 4: Risk + Regulatory (parallel) ─────────────────────────────
      agentStart("risk", 50);
      agentStart("regulatory", 50);

      const t3 = Date.now();
      const [riskResult, regulatoryResult] = await Promise.all([
        runRisk(agentParams, bmcResult, marketResult),
        runRegulatory(agentParams, orchestratorResult.mission),
      ]);

      results.risk = riskResult as unknown as AnalysisResult["risk"];
      results.regulatory = regulatoryResult as unknown as AnalysisResult["regulatory"];

      const p4elapsed = (Date.now() - t3) / 1000;
      agentDone("risk", 70, p4elapsed, 0);
      agentDone("regulatory", 70, p4elapsed, 0);

      // ── Phase 5: Financial ────────────────────────────────────────────────
      agentStart("financial", 70);
      const t4 = Date.now();
      const financialResult = await runFinancial(agentParams, bmcResult, riskResult);
      results.financial = financialResult as unknown as AnalysisResult["financial"];
      agentDone("financial", 85, (Date.now() - t4) / 1000, 0);

      // ── Phase 6: Recommendation ───────────────────────────────────────────
      agentStart("recommendation", 85);
      const t5 = Date.now();
      const recResult = await runRecommendation(
        agentParams,
        orchestratorResult as unknown as Record<string, unknown>,
        bmcResult, marketResult,
        competitorResult, sentimentResult, riskResult, regulatoryResult, financialResult
      );

      // Build FeasibilityScore from score_breakdown
      const sb = recResult.score_breakdown as Record<string, number>;
      const feasibilityScore: AnalysisResult["recommendation"]["feasibility_score"] = {
        total_score: (recResult.total_score as number) || 0,
        classification: (recResult.total_score as number) >= 75
          ? "LAYAK"
          : (recResult.total_score as number) >= 55
          ? "CUKUP LAYAK"
          : "TIDAK LAYAK",
        classification_icon: (recResult.total_score as number) >= 75 ? "🚀" : (recResult.total_score as number) >= 55 ? "⚡" : "🛑",
        breakdown: {
          market_score: sb?.market_score ?? 0,
          market_weight: 0.20,
          market_contribution: sb?.market_contribution ?? 0,
          business_model_score: sb?.business_model_score ?? 0,
          business_model_weight: 0.18,
          business_model_contribution: sb?.business_model_contribution ?? 0,
          risk_score: sb?.risk_score ?? 0,
          risk_weight: 0.17,
          risk_contribution: sb?.risk_contribution ?? 0,
          competitive_advantage_score: sb?.competitive_advantage_score ?? 0,
          competitive_advantage_weight: 0.15,
          competitive_advantage_contribution: sb?.competitive_advantage_contribution ?? 0,
          financial_sustainability_score: sb?.financial_sustainability_score ?? 0,
          financial_sustainability_weight: 0.12,
          financial_sustainability_contribution: sb?.financial_sustainability_contribution ?? 0,
          demand_validation_score: sb?.demand_validation_score ?? 0,
          demand_validation_weight: 0.10,
          demand_validation_contribution: sb?.demand_validation_contribution ?? 0,
          regulatory_feasibility_score: sb?.regulatory_feasibility_score ?? 0,
          regulatory_feasibility_weight: 0.08,
          regulatory_feasibility_contribution: sb?.regulatory_feasibility_contribution ?? 0,
        },
        confidence_level: ((recResult.confidence_level as string) ?? "sedang") as "rendah" | "sedang" | "tinggi",
        confidence_reasoning: "",
        weakest_dimension: "",
        strongest_dimension: "",
        scenario_impact: { base_score: recResult.total_score as number, with_scenarios: recResult.total_score as number, delta: 0, active_scenarios: [] },
      };

      results.recommendation = {
        feasibility_score: feasibilityScore,
        go_nogo_recommendation: (recResult.go_nogo_recommendation as "GO" | "NO-GO" | "CONDITIONAL GO") || "CONDITIONAL GO",
        go_nogo_reasoning: (recResult.executive_summary as string) || "",
        strengths: (recResult.strengths as string[]) || [],
        challenges: (recResult.challenges as string[]) || [],
        strategic_recommendations: (recResult.strategic_recommendations as string[]) || [],
        next_steps: (recResult.next_steps as string[]) || [],
        executive_summary: (recResult.executive_summary as string) || "",
        key_success_factors: (recResult.key_success_factors as string[]) || [],
        red_flags_summary: (recResult.red_flags_summary as string) || "",
        comparable_successes: "",
      };

      agentDone("recommendation", 100, (Date.now() - t5) / 1000, 0);

      // ── Final: emit complete ──────────────────────────────────────────────
      monitoring.total_elapsed_seconds = +((Date.now() - startTime) / 1000).toFixed(1);
      results.monitoring = monitoring;
      results.meta = {
        agent_count: 9,
        assessment_dimensions: 7,
        scraping_methods_count: 7,
        formula: "Score = Market×0.20 + BM×0.18 + Risk×0.17 + CA×0.15 + Fin×0.12 + Demand×0.10 + Reg×0.08",
      };

      emit({ event: "complete", agent: "recommendation", progress: 100, data: results });
    } catch (err) {
      emit({ event: "agent_error", agent: currentAgent, progress, message: String(err) });
    } finally {
      activeRuns = Math.max(0, activeRuns - 1); // release the antrian slot
      try { controller.close(); } catch { /* already closed */ }
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
