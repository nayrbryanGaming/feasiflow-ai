"use client";

import { getScoreColor, getScoreBg, getScoreBorder } from "@/lib/utils";
import type { FeasibilityScore as FScore } from "@/lib/types";

export function FeasibilityScore({ data }: { data: FScore }) {
  const { total, classification, breakdown } = data;
  const scoreColor = getScoreColor(total);
  const scoreBg = getScoreBg(total);
  const scoreBorder = getScoreBorder(total);

  const bars = [
    { label: "Market", weight: "30%", value: breakdown.market_score, color: "bg-blue-500" },
    { label: "Business Model", weight: "25%", value: breakdown.business_model_score, color: "bg-purple-500" },
    { label: "Risk (inv.)", weight: "25%", value: breakdown.risk_score, color: "bg-amber-500" },
    { label: "Comp. Advantage", weight: "20%", value: breakdown.competitive_advantage_score, color: "bg-emerald-500" },
  ];

  const gonogo = data.scenario_impact?.scenario_notes
    ? "CONDITIONAL GO"
    : total >= 75
    ? "GO"
    : total >= 55
    ? "CONDITIONAL GO"
    : "NO GO";

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-6">Skor Kelayakan Final</h2>

      {/* Main score */}
      <div className={`text-center p-8 rounded-2xl border bg-gradient-to-br ${scoreBg} bg-opacity-5 ${scoreBorder} mb-6`}>
        <div className={`text-7xl font-black ${scoreColor}`}>{total}</div>
        <div className="text-gray-400 text-sm mt-1">/ 100</div>
        <div className={`mt-3 text-xl font-bold ${scoreColor}`}>{classification}</div>
        <div className="mt-4">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
            gonogo === "GO" ? "bg-green-500/20 text-green-400 border-green-500/30" :
            gonogo === "CONDITIONAL GO" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
            "bg-red-500/20 text-red-400 border-red-500/30"
          }`}>
            {gonogo === "GO" ? "🚀 GO" : gonogo === "CONDITIONAL GO" ? "⚡ CONDITIONAL GO" : "🛑 NO GO"}
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-4">
        {bars.map(({ label, weight, value, color }) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-400">{label} <span className="text-gray-600">({weight})</span></span>
              <span className="text-white font-bold">{value}</span>
            </div>
            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-1000`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Scenario impact */}
      {data.scenario_impact && data.scenario_impact.scenario_adjustments !== 0 && (
        <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
          <p className="text-blue-400 font-semibold mb-1">Dampak Skenario Dinamis</p>
          <p className="text-gray-400">
            Skor dasar: <b>{data.scenario_impact.base_score}</b> →
            Penyesuaian: <b className="text-blue-400">{data.scenario_impact.scenario_adjustments > 0 ? "+" : ""}{data.scenario_impact.scenario_adjustments}</b> →
            Skor final: <b className={scoreColor}>{data.scenario_impact.final_score}</b>
          </p>
        </div>
      )}
    </div>
  );
}
