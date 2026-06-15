"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { LiveMonitor } from "@/components/LiveMonitor";
import { FeasibilityScore } from "@/components/FeasibilityScore";
import { BMCDisplay } from "@/components/BMCDisplay";
import { MarketChart } from "@/components/MarketChart";
import { CompetitorTable } from "@/components/CompetitorTable";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import type { AnalysisResult } from "@/lib/types";

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleComplete = useCallback((data: AnalysisResult) => {
    setResult(data);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-blue-400 text-sm hover:text-blue-300">← Beranda</a>
            <h1 className="text-2xl font-black mt-1">
              {result ? (
                <>
                  {result.recommendation?.feasibility_score?.classification === "LAYAK" ? "🚀" :
                   result.recommendation?.feasibility_score?.classification === "CUKUP LAYAK" ? "⚡" : "🛑"}
                  {" "}{result.params?.topicSubField} — {result.params?.industryCategory}
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

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Left: Live Monitor (sticky) */}
          <div>
            <LiveMonitor sessionId={sessionId} onComplete={handleComplete} />

            {/* Monitoring stats */}
            {result?.monitoring && (
              <div className="mt-4 glass-card rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 mb-3">📊 Monitoring Stats</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total waktu</span>
                    <span className="text-white">{result.monitoring.total_elapsed_seconds}s</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total tokens</span>
                    <span className="text-white">{result.monitoring.total_tokens?.toLocaleString()}</span>
                  </div>
                  {Object.entries(result.monitoring.agents ?? {}).map(([agent, timing]) => (
                    <div key={agent} className="flex justify-between text-xs">
                      <span className="text-gray-600">{agent}</span>
                      <span className="text-gray-400">{timing.elapsed}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {!result && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h2 className="text-xl font-bold text-gray-300">Agen AI sedang bekerja...</h2>
                <p className="text-gray-500 mt-2">Pantau progress di panel kiri. Hasil akan muncul di sini secara bertahap.</p>
                <div className="mt-6 flex justify-center gap-2">
                  {["🧠", "📊", "📈", "🔍", "⚠️", "✅"].map((e, i) => (
                    <span
                      key={i}
                      className="text-2xl opacity-30"
                      style={{ animation: `agent-pulse 1.5s ease-in-out ${i * 0.25}s infinite` }}
                    >{e}</span>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Feasibility Score — top priority */}
                {result.recommendation?.feasibility_score && (
                  <FeasibilityScore data={result.recommendation.feasibility_score} />
                )}

                {/* Early warnings from orchestrator */}
                {result.orchestrator?.early_warnings?.length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-yellow-400 mb-3">⚠️ Peringatan Awal</h3>
                    {result.orchestrator.early_warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-gray-300 mb-1">
                        <span className="text-yellow-400">!</span>{w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendation && <RecommendationPanel rec={result.recommendation} />}

                {/* BMC */}
                {result.bmc && <BMCDisplay bmc={result.bmc} />}

                {/* Market */}
                {result.market && <MarketChart market={result.market} />}

                {/* Competitor */}
                {result.competitor && <CompetitorTable competitor={result.competitor} />}

                {/* Risk */}
                {result.risk && <RiskMatrix risk={result.risk} />}

                {/* Footer action */}
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">
                    Analisis ini dihasilkan oleh FeasiFlow AI (Agentic AI System)
                  </p>
                  <a
                    href="/analyze"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl font-semibold transition-opacity"
                  >
                    🚀 Analisis Ide Baru
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
