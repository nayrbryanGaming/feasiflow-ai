"use client";

import type { AnalysisResult } from "@/lib/types";

export function CompetitorTable({ competitor }: { competitor: AnalysisResult["competitor"] }) {
  const c = competitor as any;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">🔍 Analisis Kompetitor</h2>
        <div className="text-right">
          <span className="text-2xl font-black text-cyan-400">
            {competitor?.competitive_advantage_score}<span className="text-sm text-gray-500">/100</span>
          </span>
        </div>
      </div>

      {/* Competition Intensity */}
      {competitor?.competition_intensity && (
        <div className="mb-4 flex gap-2 items-center">
          <span className="text-xs text-gray-500">Intensitas Kompetisi:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            competitor.competition_intensity.toLowerCase().includes("sangat") || competitor.competition_intensity.toLowerCase().includes("very")
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          }`}>{competitor.competition_intensity}</span>
        </div>
      )}

      {/* Our edge */}
      <div className="mb-5 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <p className="text-xs font-bold text-green-400 mb-1">🏆 Diferensiasi Kita</p>
        <p className="text-sm text-gray-300">{competitor?.our_differentiation}</p>
        {competitor?.competitive_moat && (
          <p className="text-xs text-gray-500 mt-2">Moat: {competitor.competitive_moat}</p>
        )}
      </div>

      {/* Recommended Positioning */}
      {competitor?.recommended_positioning && (
        <div className="mb-5 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-xs font-bold text-blue-400 mb-1">🎯 Positioning Rekomendasi</p>
          <p className="text-sm text-gray-300">{competitor.recommended_positioning}</p>
        </div>
      )}

      {/* Direct competitors */}
      {(competitor?.direct_competitors?.length ?? 0) > 0 && (
        <>
          <h3 className="text-sm font-bold text-gray-300 mb-3">Kompetitor Langsung</h3>
          <div className="space-y-4 mb-5">
            {competitor!.direct_competitors.map((comp, i) => (
              <div key={i} className="border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-white">{comp.name}</span>
                    {comp.funding_status && (
                      <span className="ml-2 text-xs text-gray-500">{comp.funding_status}</span>
                    )}
                  </div>
                  {comp.estimated_market_share && (
                    <span className="text-xs text-gray-400">{comp.estimated_market_share}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">{comp.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-400 font-semibold mb-1">Kekuatan</p>
                    {comp.strengths?.map((s, si) => (
                      <div key={si} className="text-xs text-gray-300 flex gap-1">
                        <span className="text-green-400">+</span>{s}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-1">Kelemahan</p>
                    {comp.weaknesses?.map((w, wi) => (
                      <div key={wi} className="text-xs text-gray-300 flex gap-1">
                        <span className="text-red-400">-</span>{w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Market Gaps */}
      {(competitor?.market_gaps?.length ?? 0) > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Celah Pasar</h3>
          <div className="flex flex-wrap gap-2">
            {competitor!.market_gaps.map((gap, i) => (
              <span key={i} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-300">
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entry barriers (support both new and old field names) */}
      {(c?.entry_barriers?.length ?? c?.key_competitive_risks?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-2">
            {c?.entry_barriers ? "Hambatan Masuk" : "Risiko Kompetitif"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(c?.entry_barriers ?? c?.key_competitive_risks ?? []).map((b: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
