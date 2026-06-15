"use client";

import type { AnalysisResult } from "@/lib/types";
import { getRiskColor } from "@/lib/utils";

const RISK_DIM_LABELS: Record<string, string> = {
  financial_risk: "💵 Risiko Finansial",
  market_risk: "📊 Risiko Pasar",
  operational_risk: "⚙️ Risiko Operasional",
  regulatory_risk: "⚖️ Risiko Regulasi",
};

export function RiskMatrix({ risk }: { risk: AnalysisResult["risk"] }) {
  const riskLevelColor = getRiskColor(risk?.risk_level ?? "");

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">⚠️ Analisis Risiko</h2>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {risk?.overall_risk_score}<span className="text-sm text-gray-500">/100</span>
          </div>
          <div className={`text-xs font-bold ${riskLevelColor}`}>{risk?.risk_level}</div>
        </div>
      </div>

      {/* Runway estimate */}
      {risk?.runway_estimate && (
        <div className="mb-5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-400 font-bold">⏱ Estimasi Runway</p>
          <p className="text-sm text-white font-semibold mt-1">{risk.runway_estimate}</p>
        </div>
      )}

      {/* Top 3 Critical Risks */}
      {(risk?.top_3_critical_risks?.length ?? 0) > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-red-400 mb-2">3 Risiko Kritis Teratas</h3>
          <div className="space-y-1">
            {risk!.top_3_critical_risks.map((r, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-red-400 font-bold">{i + 1}.</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimensions — cast to any since LLM generates dynamic structure */}
      {risk?.dimensions && Object.keys(risk.dimensions).length > 0 && (
        <div className="space-y-4 mb-4">
          {Object.entries(risk.dimensions).map(([key, dimRaw]) => {
            const dim = dimRaw as any;
            return (
              <div key={key} className="border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-200">{RISK_DIM_LABELS[key] ?? key}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (dim.score ?? 0) >= 70 ? "bg-red-500" :
                          (dim.score ?? 0) >= 50 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${dim.score ?? 0}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${getRiskColor(dim.level ?? "Medium")}`}>
                      {dim.level} ({dim.score})
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {(dim.risks as any[] | undefined)?.slice(0, 2).map((r: any, i: number) => (
                    <div key={i} className="text-xs bg-gray-800 rounded-lg p-2">
                      <div className="flex gap-2 text-gray-200">
                        <span className={`font-bold ${
                          r.probability === "High" ? "text-red-400" :
                          r.probability === "Medium" ? "text-yellow-400" : "text-green-400"
                        }`}>
                          [{r.probability}]
                        </span>
                        {r.risk}
                      </div>
                      <div className="text-gray-500 mt-1">↳ {r.mitigation}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Risk breakdown bars */}
      {risk?.risk_breakdown && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 mb-2">Skor per Dimensi Risiko</p>
          {Object.entries(risk.risk_breakdown).map(([key, val]) => (
            <div key={key} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 capitalize">{key.replace("_", " ")} risk</span>
                <span className="text-gray-300">{val}</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${val >= 70 ? "bg-red-500" : val >= 50 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary — support both field names */}
      {(risk?.risk_summary ?? (risk as any)?.risk_mitigation_summary) && (
        <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-xs text-green-400 font-bold mb-1">✅ Ringkasan Risiko & Mitigasi</p>
          <p className="text-xs text-gray-300">
            {risk?.risk_summary ?? (risk as any)?.risk_mitigation_summary}
          </p>
        </div>
      )}
    </div>
  );
}
