import type { AnalysisResult } from "@/lib/types";

export function BMCDisplay({ bmc }: { bmc: AnalysisResult["bmc"] }) {
  const blocks = [
    {
      title: "💡 Value Propositions",
      color: "border-blue-500/40 bg-blue-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-medium text-white">{bmc.value_propositions?.core_value}</p>
          <p className="text-gray-500 text-xs">Differentiator: {bmc.value_propositions?.differentiator}</p>
          {bmc.value_propositions?.pain_relievers?.map((p, i) => (
            <div key={i} className="flex gap-2"><span className="text-red-400">•</span>{p}</div>
          ))}
          {bmc.value_propositions?.gain_creators?.map((g, i) => (
            <div key={i} className="flex gap-2"><span className="text-green-400">+</span>{g}</div>
          ))}
        </div>
      ),
    },
    {
      title: "👥 Customer Segments",
      color: "border-purple-500/40 bg-purple-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-medium text-white">{bmc.customer_segments?.primary_segment}</p>
          <p className="text-gray-400 text-xs">{bmc.customer_segments?.customer_profile}</p>
          <p className="text-blue-400 text-xs">Target: {bmc.customer_segments?.estimated_size}</p>
          {bmc.customer_segments?.secondary_segments?.map((s, i) => (
            <div key={i} className="flex gap-2 text-xs"><span className="text-gray-500">›</span>{s}</div>
          ))}
        </div>
      ),
    },
    {
      title: "💰 Revenue Streams",
      color: "border-green-500/40 bg-green-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-medium text-white">{bmc.revenue_streams?.primary_revenue}</p>
          <p className="text-gray-400 text-xs">{bmc.revenue_streams?.revenue_model}</p>
          <p className="text-gray-400 text-xs">{bmc.revenue_streams?.pricing_strategy}</p>
          <p className="text-green-400 font-semibold text-xs">Est. Bulan 1: {bmc.revenue_streams?.estimated_monthly_revenue_year1}</p>
        </div>
      ),
    },
    {
      title: "📣 Channels",
      color: "border-amber-500/40 bg-amber-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          {bmc.channels?.primary_channels?.map((c, i) => (
            <div key={i} className="flex gap-2"><span className="text-amber-400">›</span>{c}</div>
          ))}
          <p className="text-gray-400 text-xs mt-2">{bmc.channels?.channel_strategy}</p>
        </div>
      ),
    },
    {
      title: "🔑 Key Resources",
      color: "border-rose-500/40 bg-rose-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          {bmc.key_resources?.human_resources?.map((r, i) => (
            <div key={i} className="flex gap-2"><span className="text-blue-400">👤</span><span className="text-xs">{r}</span></div>
          ))}
          {bmc.key_resources?.intellectual_resources?.map((r, i) => (
            <div key={i} className="flex gap-2"><span className="text-purple-400">💾</span><span className="text-xs">{r}</span></div>
          ))}
          <p className="text-rose-400 text-xs mt-2">Finansial: {bmc.key_resources?.financial_requirements}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-5">📊 Business Model Canvas</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {blocks.map(({ title, color, content }) => (
          <div key={title} className={`rounded-xl border p-4 ${color}`}>
            <h3 className="text-sm font-bold mb-3 text-gray-200">{title}</h3>
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
