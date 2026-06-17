"use client";

import { getScoreColor, getScoreBg, getScoreBorder, toText } from "@/lib/utils";
import type { FeasibilityScore as FScore } from "@/lib/types";

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export function FeasibilityScore({ data }: { data: FScore }) {
  const total = num(data?.total_score ?? (data as any)?.total);
  const classification = toText(data?.classification ?? (data as any)?.classification) || "—";
  const breakdown = data?.breakdown ?? {};
  const scoreColor = getScoreColor(total);
  const scoreBg = getScoreBg(total);
  const scoreBorder = getScoreBorder(total);

  // ── 7 Sifat Penilaian dengan bobot baru ───────────────────────────────────
  const bars = [
    {
      label: "Validasi Pasar",
      weight: "20%",
      value: num(breakdown.market_score),
      contribution: num(breakdown.market_contribution),
      color: "bg-blue-500",
    },
    {
      label: "Kekuatan Model Bisnis",
      weight: "18%",
      value: num(breakdown.business_model_score),
      contribution: num(breakdown.business_model_contribution),
      color: "bg-purple-500",
    },
    {
      label: "Profil Risiko",
      weight: "17%",
      value: num(breakdown.risk_score),
      contribution: num(breakdown.risk_contribution),
      color: "bg-amber-500",
    },
    {
      label: "Posisi Kompetitif",
      weight: "15%",
      value: num(breakdown.competitive_advantage_score),
      contribution: num(breakdown.competitive_advantage_contribution),
      color: "bg-emerald-500",
    },
    {
      label: "Keberlanjutan Finansial",
      weight: "12%",
      value: num(breakdown.financial_sustainability_score),
      contribution: num(breakdown.financial_sustainability_contribution),
      color: "bg-green-400",
    },
    {
      label: "Validasi Demand Publik",
      weight: "10%",
      value: num(breakdown.demand_validation_score),
      contribution: num(breakdown.demand_validation_contribution),
      color: "bg-pink-500",
    },
    {
      label: "Kelayakan Regulasi",
      weight: "8%",
      value: num(breakdown.regulatory_feasibility_score),
      contribution: num(breakdown.regulatory_feasibility_contribution),
      color: "bg-yellow-400",
    },
  ];

  const gonogo = toText((data as any)?.go_nogo_recommendation)
    || (total >= 75 ? "GO" : total >= 55 ? "CONDITIONAL GO" : "NO-GO");

  const weakest = toText(data?.weakest_dimension);
  const strongest = toText(data?.strongest_dimension);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Skor Kelayakan Final</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          7 Dimensi · 9 Agen
        </span>
      </div>

      {/* Main score */}
      <div className={`text-center p-8 rounded-2xl border bg-gradient-to-br ${scoreBg} bg-opacity-5 ${scoreBorder} mb-6`}>
        <div className={`text-7xl font-black ${scoreColor}`}>{total}</div>
        <div className="text-gray-400 text-sm mt-1">/ 100</div>
        <div className={`mt-2 text-xl font-bold ${scoreColor}`}>{classification}</div>

        <div className="mt-4">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
            gonogo === "GO" ? "bg-green-500/20 text-green-400 border-green-500/30" :
            gonogo === "CONDITIONAL GO" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
            "bg-red-500/20 text-red-400 border-red-500/30"
          }`}>
            {gonogo === "GO" ? "🚀 GO" : gonogo === "CONDITIONAL GO" ? "⚡ CONDITIONAL GO" : "🛑 NO-GO"}
          </span>
        </div>

        {/* Confidence */}
        {data?.confidence_level && (
          <p className="text-xs text-gray-500 mt-3">
            Kepercayaan analisis: <span className="text-gray-300 font-medium capitalize">{toText(data.confidence_level)}</span>
          </p>
        )}
      </div>

      {/* 7-dimension breakdown bars */}
      <div className="space-y-3 mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">7 Sifat Penilaian</p>
        {bars.map(({ label, weight, value, contribution, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">
                {label} <span className="text-gray-600">({weight})</span>
              </span>
              <div className="flex gap-2 items-center">
                <span className="text-gray-500 text-[10px]">+{contribution.toFixed(1)}</span>
                <span className="text-white font-bold w-6 text-right">{value}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-1000`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Formula display */}
      <div className="bg-gray-800/50 rounded-xl p-3 mb-4 text-xs">
        <p className="text-gray-500 mb-1 font-bold">Formula:</p>
        <p className="text-gray-400 font-mono leading-relaxed">
          Skor = (Market×0.20) + (BM×0.18) + (Risk×0.17) +<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(CA×0.15) + (Fin×0.12) + (Demand×0.10) + (Reg×0.08)
        </p>
        <p className="text-gray-300 font-mono mt-1">= {total}</p>
      </div>

      {/* Weakest & Strongest */}
      {(weakest || strongest) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {strongest && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-green-400 font-bold mb-1">💪 Terkuat</p>
              <p className="text-xs text-gray-300">{strongest}</p>
            </div>
          )}
          {weakest && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400 font-bold mb-1">⚠️ Terlemah</p>
              <p className="text-xs text-gray-300">{weakest}</p>
            </div>
          )}
        </div>
      )}

      {/* Scenario impact */}
      {data?.scenario_impact && data.scenario_impact.delta !== 0 && (
        <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
          <p className="text-blue-400 font-semibold mb-1">Dampak Skenario Dinamis</p>
          <p className="text-gray-400">
            Base: <b>{data.scenario_impact.base_score}</b> →
            Delta: <b className="text-blue-400">{data.scenario_impact.delta > 0 ? "+" : ""}{data.scenario_impact.delta}</b> →
            Final: <b className={scoreColor}>{data.scenario_impact.with_scenarios}</b>
          </p>
          {data.scenario_impact.active_scenarios?.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Skenario: {data.scenario_impact.active_scenarios.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
