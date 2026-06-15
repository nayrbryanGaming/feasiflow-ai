import type { AnalysisResult } from "@/lib/types";
import { getPriorityColor } from "@/lib/utils";

export function RecommendationPanel({ rec }: { rec: AnalysisResult["recommendation"] }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-bold">✅ Rekomendasi Strategis</h2>

      {/* Executive Summary */}
      <div className="p-4 bg-gray-800 rounded-xl">
        <p className="text-sm font-bold text-blue-400 mb-2">Executive Summary</p>
        <p className="text-sm text-gray-300 leading-relaxed">{rec?.executive_summary}</p>
      </div>

      {/* Strengths & Challenges */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-xs font-bold text-green-400 mb-3">💪 Kekuatan Utama</p>
          <div className="space-y-2">
            {rec?.key_strengths?.map((s, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-300">
                <span className="text-green-400">✓</span>{s}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <p className="text-xs font-bold text-red-400 mb-3">⚡ Tantangan Kritis</p>
          <div className="space-y-2">
            {rec?.critical_challenges?.map((c, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-300">
                <span className="text-red-400">!</span>{c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div>
        <h3 className="text-sm font-bold text-gray-200 mb-4">Rekomendasi Aksi (berdasarkan prioritas)</h3>
        <div className="space-y-3">
          {rec?.strategic_recommendations?.map((r, i) => (
            <div key={i} className="border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getPriorityColor(r.priority)}`}>
                  {r.priority}
                </span>
                <span className="text-xs text-gray-500">{r.timeline}</span>
              </div>
              <p className="text-sm text-white font-medium">{r.action}</p>
              <p className="text-xs text-gray-400 mt-1">Impact: {r.expected_impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <p className="text-sm font-bold text-blue-400 mb-3">🚀 Langkah Berikutnya</p>
        <div className="space-y-2">
          {rec?.next_steps?.map((step, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-blue-400 font-bold">{i + 1}.</span>{step}
            </div>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Confidence Level: <span className={`font-bold ${rec?.confidence_level === "High" ? "text-green-400" : rec?.confidence_level === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{rec?.confidence_level}</span></span>
        {rec?.validation_notes && <span className="text-xs text-gray-600 max-w-xs text-right">{rec.validation_notes}</span>}
      </div>
    </div>
  );
}
