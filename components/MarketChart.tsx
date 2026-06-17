import type { AnalysisResult } from "@/lib/types";
import { toText, toTextList } from "@/lib/utils";

export function MarketChart({ market }: { market: AnalysisResult["market"] }) {
  const maturityColors: Record<string, string> = {
    Emerging: "text-blue-400",
    Growing: "text-green-400",
    Mature: "text-yellow-400",
    Declining: "text-red-400",
  };
  const maturityColor = maturityColors[market?.market_maturity ?? ""] ?? "text-gray-400";
  const trends = toTextList(market?.market_trends);
  const drivers = toTextList(market?.key_market_drivers);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-5">📈 Market Research</h2>

      <p className="text-gray-300 text-sm mb-6">{toText(market?.market_overview)}</p>

      {/* TAM/SAM/SOM */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "TAM", value: market?.tam?.value, sub: "Total Addressable Market", color: "from-blue-600 to-blue-400" },
          { label: "SAM", value: market?.sam?.value, sub: market?.sam?.percentage_of_tam + " dari TAM", color: "from-purple-600 to-purple-400" },
          { label: "SOM", value: market?.som?.year_1_target, sub: "Target Tahun 1", color: "from-green-600 to-green-400" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} bg-opacity-10 rounded-xl p-4 border border-white/10 text-center`}>
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="font-black text-sm text-white leading-tight">{toText(value) || "—"}</div>
            <div className="text-xs text-gray-400 mt-1">{toText(sub)}</div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500">Growth Rate</div>
          <div className="text-green-400 font-bold text-sm mt-1">{toText(market?.growth_rate)}</div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500">Market Stage</div>
          <div className={`font-bold text-sm mt-1 ${maturityColor}`}>{toText(market?.market_maturity)}</div>
        </div>
      </div>

      {/* Trends */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 mb-3">Tren Pasar</h3>
        <div className="space-y-2">
          {trends.map((t, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-blue-400 mt-0.5">▸</span>{t}
            </div>
          ))}
        </div>
      </div>

      {/* Drivers */}
      {drivers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Market Drivers</h3>
          <div className="flex flex-wrap gap-2">
            {drivers.map((d, i) => (
              <span key={i} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300">{d}</span>
            ))}
          </div>
        </div>
      )}

      {market?.regulatory_environment && (
        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-400 font-semibold mb-1">⚖️ Regulasi</p>
          <p className="text-xs text-gray-400">{toText(market.regulatory_environment)}</p>
        </div>
      )}
    </div>
  );
}
