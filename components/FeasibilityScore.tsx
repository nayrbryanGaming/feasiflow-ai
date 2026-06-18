"use client";

import { getScoreColor, getScoreBg, getScoreBorder, toText } from "@/lib/utils";
import type { FeasibilityScore as FScore } from "@/lib/types";

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export function FeasibilityScore({ data }: { data: FScore }) {
  const total = num(data?.total_score ?? (data as any)?.total);
  const classification =
    toText(data?.classification ?? (data as any)?.classification) || "—";
  const breakdown = data?.breakdown ?? {};
  const scoreColor = getScoreColor(total);
  const scoreBorder = getScoreBorder(total);

  const bars = [
    { label: "Validasi Pasar", weight: "20%", value: num(breakdown.market_score), contribution: num(breakdown.market_contribution), color: "bg-indigo-500" },
    { label: "Model Bisnis", weight: "18%", value: num(breakdown.business_model_score), contribution: num(breakdown.business_model_contribution), color: "bg-violet-500" },
    { label: "Profil Risiko", weight: "17%", value: num(breakdown.risk_score), contribution: num(breakdown.risk_contribution), color: "bg-amber-500" },
    { label: "Posisi Kompetitif", weight: "15%", value: num(breakdown.competitive_advantage_score), contribution: num(breakdown.competitive_advantage_contribution), color: "bg-emerald-500" },
    { label: "Keberlanjutan Finansial", weight: "12%", value: num(breakdown.financial_sustainability_score), contribution: num(breakdown.financial_sustainability_contribution), color: "bg-sky-500" },
    { label: "Validasi Demand", weight: "10%", value: num(breakdown.demand_validation_score), contribution: num(breakdown.demand_validation_contribution), color: "bg-pink-500" },
    { label: "Kelayakan Regulasi", weight: "8%", value: num(breakdown.regulatory_feasibility_score), contribution: num(breakdown.regulatory_feasibility_contribution), color: "bg-yellow-500" },
  ];

  const gonogo =
    toText((data as any)?.go_nogo_recommendation) ||
    (total >= 75 ? "GO" : total >= 55 ? "CONDITIONAL GO" : "NO-GO");

  const weakest = toText(data?.weakest_dimension);
  const strongest = toText(data?.strongest_dimension);

  const si = data?.scenario_impact;
  const baseScore = num(si?.base_score) || total;
  const penalty = Math.max(0, Math.round((baseScore - total) * 10) / 10);
  const qualityReason = toText(data?.confidence_reasoning);

  const gonogoStyle =
    gonogo === "GO"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
      : gonogo === "CONDITIONAL GO"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
      : "bg-rose-500/10 text-rose-400 border-rose-500/25";

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold">Skor Kelayakan Final</h2>
        <span className="text-[11px] text-faint border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 rounded-lg font-mono">
          7 Dimensi · 9 Agen
        </span>
      </div>

      {/* Main score */}
      <div className={`text-center px-6 py-8 rounded-xl border ${scoreBorder} bg-white/[0.02] mb-6`}>
        <div className={`text-8xl font-semibold tracking-tight tnum ${scoreColor}`}>
          {total}
        </div>
        <div className="text-faint text-sm mt-1 tnum">/ 100</div>
        <div className={`mt-2 text-lg font-semibold tracking-tight ${scoreColor}`}>
          {classification}
        </div>

        <div className="mt-4">
          <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border tracking-wide ${gonogoStyle}`}>
            {gonogo}
          </span>
        </div>

        {data?.confidence_level && (
          <p className="text-xs text-faint mt-4">
            Kepercayaan:{" "}
            <span className="text-muted font-medium capitalize">
              {toText(data.confidence_level)}
            </span>
          </p>
        )}
        {qualityReason && (
          <p className="text-xs text-muted mt-2 max-w-lg mx-auto leading-relaxed">
            {qualityReason}
          </p>
        )}
      </div>

      {/* 7-dimension bars */}
      <div className="space-y-3 mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wider">
          7 Dimensi Penilaian
        </p>
        {bars.map(({ label, weight, value, contribution, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted">
                {label}{" "}
                <span className="text-faint">({weight})</span>
              </span>
              <div className="flex gap-2 items-center">
                <span className="text-faint text-[10px] tnum">+{contribution.toFixed(1)}</span>
                <span className="text-fg font-semibold tnum w-6 text-right">{value}</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-1000`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score calculation */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4 text-xs space-y-2">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wider">
          Kalkulasi Skor
        </p>
        <p className="text-faint font-mono leading-relaxed text-[10px]">
          Market·0.20 + BM·0.18 + Risk·0.17 + CA·0.15 + Fin·0.12 + Demand·0.10 + Reg·0.08
        </p>
        <div className="flex justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-muted">Skor tertimbang (mentah)</span>
          <span className="text-fg font-mono font-semibold tnum">{baseScore}</span>
        </div>
        {penalty > 0 && (
          <div className="flex justify-between text-rose-400">
            <span>Penalti kualitas input</span>
            <span className="font-mono font-semibold tnum">− {penalty}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-fg font-medium">Skor final</span>
          <span className={`font-mono font-bold tnum ${scoreColor}`}>{total} / 100</span>
        </div>
      </div>

      {/* Weakest & Strongest */}
      {(weakest || strongest) && (
        <div className="grid grid-cols-2 gap-2">
          {strongest && (
            <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[11px] text-emerald-400 font-semibold mb-1">
                Dimensi Terkuat
              </p>
              <p className="text-xs text-muted">{strongest}</p>
            </div>
          )}
          {weakest && (
            <div className="bg-rose-500/[0.05] border border-rose-500/20 rounded-lg p-3">
              <p className="text-[11px] text-rose-400 font-semibold mb-1">
                Dimensi Terlemah
              </p>
              <p className="text-xs text-muted">{weakest}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
