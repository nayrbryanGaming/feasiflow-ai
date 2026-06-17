"use client";

import type { SentimentResult } from "@/lib/types";
import { toText, toTextList, toNum } from "@/lib/utils";

interface Props {
  sentiment: SentimentResult;
}

const DIMENSION_CONFIG = {
  urgency: { label: "Urgensi Masalah", description: "Seberapa mendesak problem ini dirasakan" },
  frequency: { label: "Frekuensi Diskusi", description: "Seberapa sering dibahas di publik" },
  willingness_to_pay: { label: "Willingness to Pay", description: "Sinyal orang mau bayar untuk solusi" },
  trust_deficit: { label: "Trust Deficit (existing)", description: "Ketidakpuasan terhadap solusi yang ada" },
  viral_potential: { label: "Potensi Viral", description: "Potensi word-of-mouth & penyebaran organik" },
  community_strength: { label: "Kekuatan Komunitas", description: "Ukuran dan keaktifan komunitas pengguna" },
  regulatory_acceptance: { label: "Penerimaan Sosial", description: "Diterima secara sosial dan regulasi" },
};

function ScoreBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`w-full bg-gray-700 rounded-full ${h} overflow-hidden`}>
      <div
        className={`${h} ${color} rounded-full transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function SentimentPanel({ sentiment }: Props) {
  const painPoints = toTextList(sentiment.pain_point_evidence);
  const positives = toTextList(sentiment.positive_signals);
  const score = toNum(sentiment.validated_demand_score);
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const bgColor = score >= 70 ? "from-green-500/10 to-emerald-500/5" : score >= 50 ? "from-yellow-500/10 to-amber-500/5" : "from-red-500/10 to-rose-500/5";

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Sentiment &amp; Social Intelligence</h3>
          <p className="text-gray-400 text-xs mt-1">
            7 metode scraping real-time · Validasi demand publik
          </p>
        </div>
        <div className={`text-right p-3 rounded-xl bg-gradient-to-br ${bgColor} border border-white/5`}>
          <p className="text-xs text-gray-400">Demand Score</p>
          <p className={`text-3xl font-black ${scoreColor}`}>{score}</p>
          <p className="text-xs text-gray-500">/100</p>
        </div>
      </div>

      {/* 7 Sentiment Dimensions */}
      {sentiment.sentiment_dimensions && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            7 Sifat Penilaian Sentimen
          </p>
          <div className="space-y-3">
            {(Object.entries(sentiment.sentiment_dimensions) as [string, any][]).map(([key, dimRaw]) => {
              const config = DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG];
              if (!config) return null;
              const dim = (dimRaw && typeof dimRaw === "object" ? dimRaw : {}) as any;
              const dimScore = toNum(dim.score);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-200">{config.label}</span>
                      <span className="text-xs text-gray-500 ml-2">{config.description}</span>
                    </div>
                    <span className={`text-sm font-bold ${dimScore >= 70 ? "text-green-400" : dimScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {dimScore}
                    </span>
                  </div>
                  <ScoreBar score={dimScore} size="sm" />
                  {dim.evidence && (
                    <p className="text-xs text-gray-500 mt-1 pl-1">{toText(dim.evidence)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Pain Point Evidence */}
        {painPoints.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 mb-2">Bukti Pain Point Nyata</p>
            <ul className="space-y-1">
              {painPoints.map((e, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>{e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive Signals */}
        {positives.length > 0 && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-green-400 mb-2">Sinyal Positif</p>
            <ul className="space-y-1">
              {positives.map((s, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-green-400 mt-0.5 shrink-0">+</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Insight */}
      {sentiment.key_insight && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-blue-400 mb-1">Key Insight</p>
          <p className="text-sm text-gray-200">{toText(sentiment.key_insight)}</p>
        </div>
      )}

      {/* Target Community */}
      {sentiment.target_community && (
        <div className="flex gap-2 items-start text-xs text-gray-400 mb-3">
          <span className="text-purple-400 shrink-0"></span>
          <span><strong className="text-gray-300">Early Adopter Target:</strong> {toText(sentiment.target_community)}</span>
        </div>
      )}

      {/* Summary */}
      {sentiment.sentiment_summary && (
        <p className="text-sm text-gray-300 border-t border-gray-700/50 pt-4">{toText(sentiment.sentiment_summary)}</p>
      )}
    </div>
  );
}
