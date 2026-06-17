"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const classDot = classification === "LAYAK" ? "bg-emerald-400" : classification === "CUKUP LAYAK" ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Beranda
            </a>
            <h1 className="text-2xl font-black mt-1 flex items-center gap-2.5">
              {result ? (
                <>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${classDot}`} />
                  <span>{result.params?.topicSubField} — {result.params?.industryCategory}</span>
                </>
              ) : "Analisis Berjalan..."}
            </h1>
            {result && (
              <p className="text-gray-500 text-sm mt-0.5">Session: {sessionId}</p>
            )}
          </div>
          {result && (
            <a
              href="/analyze"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
            >
              Analisis Baru
            </a>
          )}
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">

          {/* Left: Live Monitor (sticky) */}
          <div className="space-y-4">
            <LiveMonitor sessionId={sessionId} onComplete={handleComplete} />

            {/* Monitoring Stats */}
            {result?.monitoring && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 mb-3">Monitoring Stats</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total waktu</span>
                    <span className="text-white font-mono">{result.monitoring.total_elapsed_seconds}s</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total tokens</span>
                    <span className="text-white font-mono">{result.monitoring.total_tokens?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Agen aktif</span>
                    <span className="text-white">9 agents</span>
                  </div>
                  {Object.entries(result.monitoring.agents ?? {}).map(([agent, timing]) => (
                    <div key={agent} className="flex justify-between text-xs pl-2">
                      <span className="text-gray-600">{agent}</span>
                      <span className="text-gray-500 font-mono">{timing.elapsed}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            {result?.meta && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 mb-2">Metodologi</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>• {result.meta.agent_count} agen berbeda</p>
                  <p>• {result.meta.assessment_dimensions} sifat penilaian</p>
                  <p>• {result.meta.scraping_methods_count} metode scraping</p>
                  <p className="text-gray-600 font-mono text-[10px] mt-2 leading-relaxed">
                    {result.meta.formula}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-6">

            {/* Loading state */}
            {!result && (
              <div className="glass-card rounded-2xl p-10">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                  <h2 className="text-lg font-bold text-gray-200">9 Agen AI sedang menganalisis</h2>
                </div>
                <p className="text-gray-500 text-sm mb-8">
                  7 sifat penilaian · 7 metode scraping · data real-time Indonesia
                </p>
                <div className="space-y-4 animate-pulse">
                  <div className="h-28 rounded-xl bg-gray-800/60" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-xl bg-gray-800/40" />
                    <div className="h-20 rounded-xl bg-gray-800/40" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-gray-800/50" />
                  <div className="h-4 w-2/3 rounded bg-gray-800/50" />
                  <div className="h-4 w-1/2 rounded bg-gray-800/50" />
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Agent 9: Feasibility Score (TOP) */}
                {result.recommendation?.feasibility_score && (
                  <PanelBoundary name="Skor Kelayakan">
                    <FeasibilityScore data={result.recommendation.feasibility_score} />
                  </PanelBoundary>
                )}

                {/* Early warnings from Orchestrator */}
                {toTextList(result.orchestrator?.early_warnings).length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-yellow-400 mb-3">
                      Peringatan Awal (dari Orchestrator)
                    </h3>
                    {toTextList(result.orchestrator?.early_warnings).map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-gray-300 mb-1.5">
                        <span className="text-yellow-400 shrink-0">!</span>{w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Agent 9: Strategic Recommendation */}
                {result.recommendation && (
                  <PanelBoundary name="Rekomendasi Strategis">
                    <RecommendationPanel rec={result.recommendation} />
                  </PanelBoundary>
                )}

                {/* Agent 2: BMC */}
                {result.bmc && (
                  <PanelBoundary name="Business Model Canvas">
                    <BMCDisplay bmc={result.bmc} />
                  </PanelBoundary>
                )}

                {/* Agent 3: Market Research */}
                {result.market && (
                  <PanelBoundary name="Market Research">
                    <MarketChart market={result.market} />
                  </PanelBoundary>
                )}

                {/* Agent 4: Competitor Analysis */}
                {result.competitor && (
                  <PanelBoundary name="Analisis Kompetitor">
                    <CompetitorTable competitor={result.competitor} />
                  </PanelBoundary>
                )}

                {/* Agent 5: Sentiment & Social Intelligence (NEW) */}
                {result.sentiment && (
                  <PanelBoundary name="Sentiment & Social Intelligence">
                    <SentimentPanel sentiment={result.sentiment} />
                  </PanelBoundary>
                )}

                {/* Agent 6: Risk Analysis */}
                {result.risk && (
                  <PanelBoundary name="Analisis Risiko">
                    <RiskMatrix risk={result.risk} />
                  </PanelBoundary>
                )}

                {/* Agent 7: Regulatory Intelligence (NEW) */}
                {result.regulatory && (
                  <PanelBoundary name="Regulatory Intelligence">
                    <RegulatoryPanel regulatory={result.regulatory} />
                  </PanelBoundary>
                )}

                {/* Agent 8: Financial Modeling (NEW) */}
                {result.financial && (
                  <PanelBoundary name="Financial Modeling">
                    <FinancialPanel financial={result.financial} />
                  </PanelBoundary>
                )}

                {/* Footer */}
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-1">
                    Dianalisis oleh <strong className="text-gray-400">FeasiFlow AI</strong> — 9 Agentic AI
                  </p>
                  <p className="text-gray-600 text-xs mb-4">
                    Skripsi: Pengembangan Sistem Agentic AI untuk Analisis Kelayakan Startup · Vincentius Bryan Kwandou · 2026
                  </p>
                  <a
                    href="/analyze"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl font-semibold transition-opacity"
                  >
                    Analisis Ide Baru
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
