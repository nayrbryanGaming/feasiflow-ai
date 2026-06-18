"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { LiveMonitor } from "@/components/LiveMonitor";
import { FeasibilityScore } from "@/components/FeasibilityScore";
import { BMCDisplay } from "@/components/BMCDisplay";
import { MarketChart } from "@/components/MarketChart";
import { CompetitorTable } from "@/components/CompetitorTable";
import { SentimentPanel } from "@/components/SentimentPanel";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RegulatoryPanel } from "@/components/RegulatoryPanel";
import { FinancialPanel } from "@/components/FinancialPanel";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { PanelBoundary } from "@/components/PanelBoundary";
import { toTextList } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleComplete = useCallback((data: AnalysisResult) => {
    setResult(data);
  }, []);

  const classification = result?.recommendation?.feasibility_score?.classification;
  const classDot =
    classification === "LAYAK"
      ? "bg-emerald-400"
      : classification === "CUKUP LAYAK"
      ? "bg-amber-400"
      : "bg-rose-400";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a
              href="/"
              className="text-sm text-muted hover:text-fg transition-colors duration-150"
            >
              Beranda
            </a>
            <h1 className="text-2xl font-semibold tracking-tight mt-1 flex items-center gap-2.5">
              {result ? (
                <>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${classDot}`} />
                  <span>{result.params?.topicSubField} — {result.params?.industryCategory}</span>
                </>
              ) : (
                "Analisis Berjalan..."
              )}
            </h1>
            {result && (
              <p className="text-faint text-xs mt-1 font-mono">
                Session: {sessionId}
              </p>
            )}
          </div>
          {result && (
            <a
              href="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-600 rounded-lg text-sm font-medium transition-[background-color,transform] duration-150 active:translate-y-px focus-ring"
            >
              Analisis Baru <ArrowRight size={15} />
            </a>
          )}
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Left: Live Monitor (sticky) */}
          <div className="space-y-4">
            <LiveMonitor sessionId={sessionId} onComplete={handleComplete} />

            {/* Monitoring Stats */}
            {result?.monitoring && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-3">
                  Monitoring
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-faint">Total waktu</span>
                    <span className="text-fg font-mono tnum">
                      {result.monitoring.total_elapsed_seconds}s
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-faint">Total tokens</span>
                    <span className="text-fg font-mono tnum">
                      {result.monitoring.total_tokens?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-faint">Agen aktif</span>
                    <span className="text-muted">9 agents</span>
                  </div>
                  {Object.entries(result.monitoring.agents ?? {}).map(([agent, timing]) => (
                    <div key={agent} className="flex justify-between text-xs pl-2">
                      <span className="text-faint">{agent}</span>
                      <span className="text-faint font-mono tnum">{timing.elapsed}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            {result?.meta && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">
                  Metodologi
                </p>
                <div className="space-y-1 text-xs text-muted">
                  <p>{result.meta.agent_count} agen berbeda</p>
                  <p>{result.meta.assessment_dimensions} dimensi penilaian</p>
                  <p>{result.meta.scraping_methods_count} metode riset</p>
                  {result.meta.formula && (
                    <p className="text-faint font-mono text-[10px] mt-2 leading-relaxed pt-2 border-t border-white/[0.06]">
                      {result.meta.formula}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-5">

            {/* Loading state */}
            {!result && (
              <div className="glass-card rounded-2xl p-10">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={18} className="text-accent-fg animate-spin" />
                  <h2 className="text-base font-semibold">9 Agen AI sedang menganalisis</h2>
                </div>
                <p className="text-muted text-sm mb-8">
                  7 dimensi penilaian · data real-time Indonesia
                </p>
                <div className="space-y-3 animate-pulse">
                  <div className="h-28 rounded-xl bg-white/[0.04]" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-xl bg-white/[0.03]" />
                    <div className="h-20 rounded-xl bg-white/[0.03]" />
                  </div>
                  <div className="h-3 w-3/4 rounded bg-white/[0.03]" />
                  <div className="h-3 w-2/3 rounded bg-white/[0.03]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.03]" />
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Feasibility Score */}
                {result.recommendation?.feasibility_score && (
                  <PanelBoundary name="Skor Kelayakan">
                    <FeasibilityScore data={result.recommendation.feasibility_score} />
                  </PanelBoundary>
                )}

                {/* Early warnings */}
                {toTextList(result.orchestrator?.early_warnings).length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3">
                      Peringatan Awal
                    </h3>
                    {toTextList(result.orchestrator?.early_warnings).map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-muted mb-1.5">
                        <span className="text-amber-400 shrink-0">!</span>
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                  <PanelBoundary name="Rekomendasi Strategis">
                    <RecommendationPanel rec={result.recommendation} />
                  </PanelBoundary>
                )}

                {/* BMC */}
                {result.bmc && (
                  <PanelBoundary name="Business Model Canvas">
                    <BMCDisplay bmc={result.bmc} />
                  </PanelBoundary>
                )}

                {/* Market */}
                {result.market && (
                  <PanelBoundary name="Market Research">
                    <MarketChart market={result.market} />
                  </PanelBoundary>
                )}

                {/* Competitor */}
                {result.competitor && (
                  <PanelBoundary name="Analisis Kompetitor">
                    <CompetitorTable competitor={result.competitor} />
                  </PanelBoundary>
                )}

                {/* Sentiment */}
                {result.sentiment && (
                  <PanelBoundary name="Sentiment & Social Intelligence">
                    <SentimentPanel sentiment={result.sentiment} />
                  </PanelBoundary>
                )}

                {/* Risk */}
                {result.risk && (
                  <PanelBoundary name="Analisis Risiko">
                    <RiskMatrix risk={result.risk} />
                  </PanelBoundary>
                )}

                {/* Regulatory */}
                {result.regulatory && (
                  <PanelBoundary name="Regulatory Intelligence">
                    <RegulatoryPanel regulatory={result.regulatory} />
                  </PanelBoundary>
                )}

                {/* Financial */}
                {result.financial && (
                  <PanelBoundary name="Financial Modeling">
                    <FinancialPanel financial={result.financial} />
                  </PanelBoundary>
                )}

                {/* Footer */}
                <div className="text-center py-10 border-t border-white/[0.06]">
                  <p className="text-muted text-sm mb-1">
                    Dianalisis oleh{" "}
                    <span className="text-fg font-medium">FeasiFlow AI</span>{" "}
                    — 9 Agentic AI
                  </p>
                  <p className="text-faint text-xs mb-6">
                    Skripsi: Sistem Agentic AI untuk Analisis Kelayakan Startup ·
                    Vincentius Bryan Kwandou · 2026
                  </p>
                  <a
                    href="/analyze"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-600 rounded-xl font-medium transition-[background-color,transform] duration-150 active:translate-y-px focus-ring"
                  >
                    Analisis Ide Baru <ArrowRight size={16} />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
