"use client";

import type { AnalysisResult } from "@/lib/types";

export function RecommendationPanel({ rec }: { rec: AnalysisResult["recommendation"] }) {
  if (!rec) return null;

  // strategic_recommendations is now string[] in v3.0
  const recs: string[] = Array.isArray(rec.strategic_recommendations)
    ? (rec.strategic_recommendations as unknown as string[])
    : [];

  // Support both new fields (strengths/challenges) and legacy (key_strengths/critical_challenges)
  const strengths: string[] = (rec as any).strengths ?? (rec as any).key_strengths ?? [];
  const challenges: string[] = (rec as any).challenges ?? (rec as any).critical_challenges ?? [];

  const goNogo = rec.go_nogo_recommendation ?? "CONDITIONAL GO";
  const goColor =
    goNogo === "GO"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : goNogo === "NO-GO"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  const goIcon = goNogo === "GO" ? "🚀" : goNogo === "NO-GO" ? "🛑" : "⚡";

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">✅ Rekomendasi Strategis</h2>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${goColor}`}>
          {goIcon} {goNogo}
        </span>
      </div>

      {/* Go/No-Go Reasoning */}
      {rec.go_nogo_reasoning && (
        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/40">
          <p className="text-xs font-bold text-gray-400 mb-1">Alasan Keputusan</p>
          <p className="text-sm text-gray-200">{rec.go_nogo_reasoning}</p>
        </div>
      )}

      {/* Executive Summary */}
      {rec.executive_summary && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-sm font-bold text-blue-400 mb-2">📋 Executive Summary</p>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {rec.executive_summary}
          </div>
        </div>
      )}

      {/* Strengths & Challenges */}
      <div className="grid md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <p className="text-xs font-bold text-green-400 mb-3">💪 Kekuatan Utama</p>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-300">
                  <span className="text-green-400 shrink-0">✓</span>{s}
                </div>
              ))}
            </div>
          </div>
        )}
        {challenges.length > 0 && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-xs font-bold text-red-400 mb-3">⚡ Tantangan Kritis</p>
            <div className="space-y-2">
              {challenges.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-300">
                  <span className="text-red-400 shrink-0">!</span>{c}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategic Recommendations */}
      {recs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-200 mb-4">Rekomendasi Aksi</h3>
          <div className="space-y-2">
            {recs.map((r, i) => {
              const isHigh = r.toLowerCase().includes("kritis") || r.toLowerCase().includes("prioritas 1");
              const isMed = r.toLowerCase().includes("prioritas 2") || r.toLowerCase().includes("prioritas 3");
              const badgeCls = isHigh
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : isMed
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30";
              const badgeLabel = isHigh ? "KRITIS" : isMed ? "TINGGI" : "SEDANG";
              return (
                <div key={i} className="border border-gray-700/50 rounded-xl p-4 bg-gray-800/30">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${badgeCls}`}>
                      {badgeLabel}
                    </span>
                    <p className="text-sm text-gray-200">{r}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {(rec.next_steps?.length ?? 0) > 0 && (
        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
          <p className="text-sm font-bold text-purple-400 mb-3">🗺️ Langkah Berikutnya</p>
          <div className="space-y-2">
            {rec.next_steps!.map((step, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>{step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Success Factors */}
      {rec.key_success_factors && rec.key_success_factors.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs font-bold text-amber-400 mb-2">🔑 Faktor Kritis Keberhasilan</p>
          {rec.key_success_factors.map((f, i) => (
            <p key={i} className="text-xs text-gray-300 mb-1 flex gap-2">
              <span className="text-amber-400 shrink-0">★</span>{f}
            </p>
          ))}
        </div>
      )}

      {/* Red Flags */}
      {rec.red_flags_summary && rec.red_flags_summary !== "Tidak ada red flag kritis yang teridentifikasi." && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <p className="text-xs font-bold text-red-400 mb-2">🚨 Red Flag Tersisa</p>
          <p className="text-xs text-gray-300">{rec.red_flags_summary}</p>
        </div>
      )}

      {/* Comparable Successes */}
      {rec.comparable_successes && (
        <div className="text-xs text-gray-500 border-t border-gray-700/50 pt-4">
          <span className="text-gray-400 font-medium">Benchmark: </span>{rec.comparable_successes}
        </div>
      )}
    </div>
  );
}
