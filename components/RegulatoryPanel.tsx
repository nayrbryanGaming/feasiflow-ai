"use client";

import type { RegulatoryResult } from "@/lib/types";
import { toText, toTextList, toNum } from "@/lib/utils";

interface Props {
  regulatory: RegulatoryResult;
}

const DIM_CONFIG: Record<string, { label: string; icon: string }> = {
  regulatory_clarity: { label: "Kejelasan Regulasi", icon: "" },
  licensing_accessibility: { label: "Kemudahan Perizinan", icon: "" },
  compliance_cost_feasibility: { label: "Kelayakan Biaya Compliance", icon: "" },
  regulatory_timeline: { label: "Kecepatan Timeline Izin", icon: "" },
  regulatory_trend: { label: "Tren Regulasi", icon: "" },
  enforcement_risk: { label: "Risiko Penegakan Hukum", icon: "" },
  government_support: { label: "Dukungan Pemerintah", icon: "" },
};

function ScorePill({ score }: { score: number }) {
  const color = score >= 70
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : score >= 50
    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

export function RegulatoryPanel({ regulatory }: Props) {
  const score = toNum(regulatory.regulatory_feasibility_score);
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const licenses = toTextList(regulatory.required_licenses);
  const costDrivers = toTextList(regulatory.compliance_cost_breakdown?.main_cost_drivers);
  const roadmap = toTextList(regulatory.compliance_roadmap);
  const criticalRisks = toTextList(regulatory.critical_regulatory_risks);

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold">Regulatory Intelligence</h3>
          <p className="text-muted text-xs mt-1">
            {toText(regulatory.primary_regulator)}
          </p>
        </div>
        <div className="text-right p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs text-muted">Regulatory Score</p>
          <p className={`text-3xl font-semibold tnum ${scoreColor}`}>{score}</p>
          <p className="text-xs text-faint">/100</p>
        </div>
      </div>

      {/* 7 Regulatory Dimensions */}
      {regulatory.regulatory_dimensions && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-3">
            7 Sifat Penilaian Regulasi
          </p>
          <div className="space-y-2">
            {(Object.entries(regulatory.regulatory_dimensions) as [string, any][]).map(([key, dimRaw]) => {
              const cfg = DIM_CONFIG[key];
              if (!cfg) return null;
              const dim = (dimRaw && typeof dimRaw === "object" ? dimRaw : {}) as any;
              return (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-fg">{cfg.label}</span>
                    <ScorePill score={toNum(dim.score)} />
                  </div>
                  {dim.reasoning && (
                    <p className="text-xs text-faint">{toText(dim.reasoning)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Required Licenses */}
        {licenses.length > 0 && (
          <div className="bg-accent/[0.04] border border-accent/20 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-accent-fg mb-2">Izin yang Diperlukan</p>
            <ul className="space-y-1.5">
              {licenses.map((lic, i) => (
                <li key={i} className="text-xs text-muted flex gap-1.5">
                  <span className="text-blue-400 shrink-0">{i + 1}.</span>{lic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Compliance Cost Breakdown */}
        {regulatory.compliance_cost_breakdown && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-400 mb-2">Estimasi Biaya Compliance</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Minimum:</span>
                <span className="text-gray-200">{toText(regulatory.compliance_cost_breakdown.minimum)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Realistis:</span>
                <span className="text-yellow-300 font-bold">{toText(regulatory.compliance_cost_breakdown.realistic)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Maksimum:</span>
                <span className="text-gray-200">{toText(regulatory.compliance_cost_breakdown.maximum)}</span>
              </div>
              {costDrivers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-xs text-faint mb-1">Driver biaya utama:</p>
                  {costDrivers.map((d, i) => (
                    <p key={i} className="text-xs text-muted">• {d}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compliance Roadmap */}
      {roadmap.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-3">Compliance Roadmap</p>
          <div className="space-y-2">
            {roadmap.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                <p className="text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Regulatory Risks */}
      {criticalRisks.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-red-400 mb-2">Risiko Regulasi Kritis</p>
          {criticalRisks.map((r, i) => (
            <p key={i} className="text-xs text-gray-300 mb-1 flex gap-1.5">
              <span className="text-red-400 shrink-0">!</span>{r}
            </p>
          ))}
        </div>
      )}

      {/* Quick Win Path */}
      {regulatory.quick_win_path && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-green-400 mb-1">Quick Win Path (30-90 hari)</p>
          <p className="text-sm text-muted">{toText(regulatory.quick_win_path)}</p>
        </div>
      )}

      {/* Summary */}
      {regulatory.regulatory_summary && (
        <p className="text-sm text-gray-400 border-t border-white/[0.06] pt-4">{toText(regulatory.regulatory_summary)}</p>
      )}
    </div>
  );
}
