"use client";

import type { AnalysisResult } from "@/lib/types";
import { getRiskColor, toText, toTextList } from "@/lib/utils";

const RISK_DIM_LABELS: Record<string, string> = {
  financial_risk: "Risiko Finansial",
  market_risk: "Risiko Pasar",
  operational_risk: "Risiko Operasional",
  regulatory_risk: "Risiko Regulasi",
};

// LLM scores sometimes arrive as strings/objects — coerce to a finite number.
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export function RiskMatrix({ risk }: { risk: AnalysisResult["risk"] }) {
  const riskLevelColor = getRiskColor(risk?.risk_level ?? "");
  const criticalRisks = toTextList(risk?.top_3_critical_risks);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold">Analisis Risiko</h2>
        <div className="text-right">
          <div className="text-2xl font-semibold text-fg tnum">
            {num(risk?.overall_risk_score)}<span className="text-sm text-faint">/100</span>
          </div>
          <div className={`text-xs font-bold ${riskLevelColor}`}>{toText(risk?.risk_level)}</div>
        </div>
      </div>

      {/* Runway estimate */}
      {risk?.runway_estimate && (
        <div className="mb-5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-400 font-bold">Estimasi Runway</p>
          <p className="text-sm text-white font-semibold mt-1">{toText(risk.runway_estimate)}</p>
        </div>
      )}

      {/* Top 3 Critical Risks */}
      {criticalRisks.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-red-400 mb-2">3 Risiko Kritis Teratas</h3>
          <div className="space-y-1">
            {criticalRisks.map((r, i) => (
              <div key={i} className="flex gap-2 text-sm text-muted">
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
            const dim = (dimRaw && typeof dimRaw === "object" ? dimRaw : {}) as any;
            const dimScore = num(dim.score);
            const dimLevel = toText(dim.level) || "Medium";
            const dimRisks = Array.isArray(dim.risks) ? dim.risks : [];
            return (
              <div key={key} className="border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-fg">{RISK_DIM_LABELS[key] ?? key}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dimScore >= 70 ? "bg-red-500" :
                          dimScore >= 50 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${dimScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${getRiskColor(dimLevel)}`}>
                      {dimLevel} ({dimScore})
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {dimRisks.slice(0, 2).map((r: any, i: number) => {
                    const rr = (r && typeof r === "object" ? r : {}) as any;
                    const prob = toText(rr.probability);
                    return (
                      <div key={i} className="text-xs bg-white/[0.03] border border-white/[0.04] rounded-lg p-2">
                        <div className="flex gap-2 text-fg">
                          <span className={`font-bold ${
                            prob === "High" ? "text-red-400" :
                            prob === "Medium" ? "text-yellow-400" : "text-green-400"
                          }`}>
                            [{prob || "—"}]
                          </span>
                          {toText(rr.risk ?? r)}
                        </div>
                        {toText(rr.mitigation) && (
                          <div className="text-faint mt-1">{toText(rr.mitigation)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Risk breakdown bars */}
      {risk?.risk_breakdown && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-faint mb-2">Skor per Dimensi Risiko</p>
          {Object.entries(risk.risk_breakdown).map(([key, valRaw]) => {
            const val = num(valRaw);
            return (
              <div key={key} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-faint capitalize">{key.replace("_", " ")} risk</span>
                  <span className="text-muted">{val}</span>
                </div>
                <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${val >= 70 ? "bg-red-500" : val >= 50 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary — support both field names */}
      {(risk?.risk_summary ?? (risk as any)?.risk_mitigation_summary) && (
        <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-xs text-green-400 font-bold mb-1">Ringkasan Risiko & Mitigasi</p>
          <p className="text-xs text-muted">
            {toText(risk?.risk_summary ?? (risk as any)?.risk_mitigation_summary)}
          </p>
        </div>
      )}
    </div>
  );
}
