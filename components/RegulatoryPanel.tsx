"use client";

import type { RegulatoryResult } from "@/lib/types";

interface Props {
  regulatory: RegulatoryResult;
}

const DIM_CONFIG: Record<string, { label: string; icon: string }> = {
  regulatory_clarity: { label: "Kejelasan Regulasi", icon: "📋" },
  licensing_accessibility: { label: "Kemudahan Perizinan", icon: "🔓" },
  compliance_cost_feasibility: { label: "Kelayakan Biaya Compliance", icon: "💵" },
  regulatory_timeline: { label: "Kecepatan Timeline Izin", icon: "⏱️" },
  regulatory_trend: { label: "Tren Regulasi", icon: "📈" },
  enforcement_risk: { label: "Risiko Penegakan Hukum", icon: "🚨" },
  government_support: { label: "Dukungan Pemerintah", icon: "🤝" },
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
  const score = regulatory.regulatory_feasibility_score ?? 0;
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span>Regulatory Intelligence</span>
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {regulatory.primary_regulator}
          </p>
        </div>
        <div className="text-right p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs text-gray-400">Regulatory Score</p>
          <p className={`text-3xl font-black ${scoreColor}`}>{score}</p>
          <p className="text-xs text-gray-500">/100</p>
        </div>
      </div>

      {/* 7 Regulatory Dimensions */}
      {regulatory.regulatory_dimensions && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            7 Sifat Penilaian Regulasi
          </p>
          <div className="space-y-2">
            {(Object.entries(regulatory.regulatory_dimensions) as [string, { score: number; reasoning: string }][]).map(([key, dim]) => {
              const cfg = DIM_CONFIG[key];
              if (!cfg) return null;
              return (
                <div key={key} className="bg-gray-800/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-200">
                      {cfg.icon} {cfg.label}
                    </span>
                    <ScorePill score={dim.score} />
                  </div>
                  {dim.reasoning && (
                    <p className="text-xs text-gray-500">{dim.reasoning}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Required Licenses */}
        {regulatory.required_licenses?.length > 0 && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-2">📄 Izin yang Diperlukan</p>
            <ul className="space-y-1.5">
              {regulatory.required_licenses.map((lic, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-blue-400 shrink-0">{i + 1}.</span>{lic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Compliance Cost Breakdown */}
        {regulatory.compliance_cost_breakdown && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-400 mb-2">💰 Estimasi Biaya Compliance</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Minimum:</span>
                <span className="text-gray-200">{regulatory.compliance_cost_breakdown.minimum}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Realistis:</span>
                <span className="text-yellow-300 font-bold">{regulatory.compliance_cost_breakdown.realistic}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Maksimum:</span>
                <span className="text-gray-200">{regulatory.compliance_cost_breakdown.maximum}</span>
              </div>
              {regulatory.compliance_cost_breakdown.main_cost_drivers?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Driver biaya utama:</p>
                  {regulatory.compliance_cost_breakdown.main_cost_drivers.map((d, i) => (
                    <p key={i} className="text-xs text-gray-400">• {d}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compliance Roadmap */}
      {regulatory.compliance_roadmap?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🗓️ Compliance Roadmap</p>
          <div className="space-y-2">
            {regulatory.compliance_roadmap.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                <p className="text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Regulatory Risks */}
      {regulatory.critical_regulatory_risks?.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-red-400 mb-2">🚨 Risiko Regulasi Kritis</p>
          {regulatory.critical_regulatory_risks.map((r, i) => (
            <p key={i} className="text-xs text-gray-300 mb-1 flex gap-1.5">
              <span className="text-red-400 shrink-0">!</span>{r}
            </p>
          ))}
        </div>
      )}

      {/* Quick Win Path */}
      {regulatory.quick_win_path && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-green-400 mb-1">⚡ Quick Win Path (30-90 hari)</p>
          <p className="text-sm text-gray-300">{regulatory.quick_win_path}</p>
        </div>
      )}

      {/* Summary */}
      {regulatory.regulatory_summary && (
        <p className="text-sm text-gray-400 border-t border-gray-700/50 pt-4">{regulatory.regulatory_summary}</p>
      )}
    </div>
  );
}
