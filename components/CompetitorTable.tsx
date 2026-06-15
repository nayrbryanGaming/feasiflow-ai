import type { AnalysisResult } from "@/lib/types";

export function CompetitorTable({ competitor }: { competitor: AnalysisResult["competitor"] }) {
  const landscapeColors: Record<string, string> = {
    "Blue Ocean": "text-blue-400 bg-blue-500/10 border-blue-500/30",
    "Red Ocean": "text-red-400 bg-red-500/10 border-red-500/30",
    "Emerging": "text-green-400 bg-green-500/10 border-green-500/30",
  };
  const lcClass = landscapeColors[competitor?.competitive_landscape ?? ""] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30";

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">🔍 Analisis Kompetitor</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${lcClass}`}>
          {competitor?.competitive_landscape}
        </span>
      </div>

      {/* Our edge */}
      <div className="mb-5 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <p className="text-xs font-bold text-green-400 mb-1">🏆 Diferensiasi Kita</p>
        <p className="text-sm text-gray-300">{competitor?.our_differentiation}</p>
        {competitor?.competitive_moat && (
          <p className="text-xs text-gray-500 mt-2">Moat: {competitor.competitive_moat}</p>
        )}
      </div>

      {/* Direct competitors */}
      <h3 className="text-sm font-bold text-gray-300 mb-3">Kompetitor Langsung</h3>
      <div className="space-y-4 mb-5">
        {competitor?.direct_competitors?.map((c, i) => (
          <div key={i} className="border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-white">{c.name}</span>
                <span className="ml-2 text-xs text-gray-500">{c.funding_status}</span>
              </div>
              <span className="text-xs text-gray-400">{c.estimated_market_share}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{c.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-green-400 font-semibold mb-1">Kekuatan</p>
                {c.strengths?.map((s, si) => (
                  <div key={si} className="text-xs text-gray-300 flex gap-1"><span className="text-green-400">+</span>{s}</div>
                ))}
              </div>
              <div>
                <p className="text-xs text-red-400 font-semibold mb-1">Kelemahan</p>
                {c.weaknesses?.map((w, wi) => (
                  <div key={wi} className="text-xs text-gray-300 flex gap-1"><span className="text-red-400">-</span>{w}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Entry barriers */}
      {competitor?.entry_barriers?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-2">Hambatan Masuk</h3>
          <div className="flex flex-wrap gap-2">
            {competitor.entry_barriers.map((b, i) => (
              <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
