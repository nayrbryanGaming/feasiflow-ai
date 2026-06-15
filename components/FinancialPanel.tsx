"use client";

import type { FinancialResult } from "@/lib/types";

interface Props {
  financial: FinancialResult;
}

const FIN_DIM_CONFIG: Record<string, { label: string; icon: string }> = {
  capital_sufficiency: { label: "Kecukupan Modal", icon: "🏦" },
  revenue_model_clarity: { label: "Kejelasan Model Revenue", icon: "💡" },
  gross_margin_health: { label: "Kesehatan Gross Margin", icon: "📊" },
  cash_efficiency: { label: "Efisiensi Penggunaan Modal", icon: "⚡" },
  break_even_achievability: { label: "Ketercapaian Break Even", icon: "🎯" },
  funding_pathway: { label: "Akses ke Funding Berikutnya", icon: "🚀" },
  unit_economics_viability: { label: "Viabilitas Unit Economics", icon: "🔢" },
};

function RunwayGauge({ months }: { months: number }) {
  const pct = Math.min(100, (months / 18) * 100);
  const color = months >= 12 ? "bg-green-500" : months >= 6 ? "bg-yellow-500" : "bg-red-500";
  const label = months >= 12 ? "Ideal" : months >= 6 ? "Cukup" : "Kritis";
  const textColor = months >= 12 ? "text-green-400" : months >= 6 ? "text-yellow-400" : "text-red-400";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Runway</span>
        <span className={`text-xs font-bold ${textColor}`}>{months} bulan — {label}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FinancialPanel({ financial }: Props) {
  const score = financial.financial_sustainability_score ?? 0;
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const runway = financial.runway_projection;

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span>Financial Modeling</span>
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Proyeksi keuangan · Unit economics · Runway
          </p>
        </div>
        <div className="text-right p-3 rounded-xl bg-green-500/5 border border-green-500/20">
          <p className="text-xs text-gray-400">Financial Score</p>
          <p className={`text-3xl font-black ${scoreColor}`}>{score}</p>
          <p className="text-xs text-gray-500">/100</p>
        </div>
      </div>

      {/* Runway Projection */}
      {runway && (
        <div className="bg-gray-800/60 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📊 Proyeksi Runway</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Modal Awal</p>
              <p className="text-sm font-bold text-gray-200">
                {runway.initial_capital_idr ? `Rp${(runway.initial_capital_idr / 1_000_000).toFixed(0)}Jt` : "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Burn Rate/Bulan</p>
              <p className="text-sm font-bold text-orange-300">{runway.estimated_monthly_burn || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Assessment</p>
              <p className="text-sm font-bold text-gray-200">{runway.runway_assessment || "—"}</p>
            </div>
          </div>
          {runway.runway_months > 0 && <RunwayGauge months={runway.runway_months} />}
        </div>
      )}

      {/* Revenue Projection */}
      {financial.revenue_projection && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📈 Proyeksi Revenue</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Bulan 3", value: financial.revenue_projection.month_3 },
              { label: "Bulan 6", value: financial.revenue_projection.month_6 },
              { label: "Bulan 12", value: financial.revenue_projection.month_12 },
              { label: "Break Even", value: financial.revenue_projection.break_even_month },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800/40 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-xs font-bold text-green-300">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 Financial Dimensions */}
      {financial.financial_dimensions && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            7 Sifat Penilaian Finansial
          </p>
          <div className="space-y-2">
            {(Object.entries(financial.financial_dimensions) as [string, { score: number; reasoning: string }][]).map(([key, dim]) => {
              const cfg = FIN_DIM_CONFIG[key];
              if (!cfg) return null;
              const barColor = dim.score >= 70 ? "bg-green-500" : dim.score >= 50 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">{cfg.icon} {cfg.label}</span>
                    <span className={`text-xs font-bold ${dim.score >= 70 ? "text-green-400" : dim.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {dim.score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${dim.score}%` }} />
                  </div>
                  {dim.reasoning && <p className="text-xs text-gray-600 mt-0.5">{dim.reasoning}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Cost Structure */}
        {financial.cost_structure && (
          <div className="bg-gray-800/40 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">🏗️ Struktur Biaya</p>
            {financial.cost_structure.fixed_costs?.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-1">Fixed Costs:</p>
                {financial.cost_structure.fixed_costs.map((c, i) => (
                  <p key={i} className="text-xs text-gray-300 mb-0.5">• {c}</p>
                ))}
              </>
            )}
            {financial.cost_structure.total_estimated_monthly_burn && (
              <p className="text-xs font-bold text-orange-300 mt-2 pt-2 border-t border-gray-700/50">
                Total: {financial.cost_structure.total_estimated_monthly_burn}
              </p>
            )}
          </div>
        )}

        {/* Funding Recommendation */}
        {financial.funding_recommendation && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-2">🚀 Rekomendasi Pendanaan</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Jenis:</span>
                <span className="text-gray-200">{financial.funding_recommendation.investor_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah:</span>
                <span className="text-green-300 font-bold">{financial.funding_recommendation.recommended_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timing:</span>
                <span className="text-gray-300">{financial.funding_recommendation.next_fundraise_timing}</span>
              </div>
              {financial.funding_recommendation.use_of_funds?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <p className="text-gray-500 mb-1">Alokasi dana:</p>
                  {financial.funding_recommendation.use_of_funds.map((u, i) => (
                    <p key={i} className="text-gray-400">• {u}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Financial Risks */}
      {financial.financial_risks?.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-red-400 mb-2">⚠️ Risiko Finansial</p>
          {financial.financial_risks.map((r, i) => (
            <p key={i} className="text-xs text-gray-300 mb-1 flex gap-1.5">
              <span className="text-red-400 shrink-0">!</span>{r}
            </p>
          ))}
        </div>
      )}

      {/* Summary */}
      {financial.financial_summary && (
        <p className="text-sm text-gray-300 border-t border-gray-700/50 pt-4">{financial.financial_summary}</p>
      )}
    </div>
  );
}
