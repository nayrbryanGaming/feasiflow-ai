"use client";

import type { AnalysisResult } from "@/lib/types";
import { toText, toTextList } from "@/lib/utils";

export function BMCDisplay({ bmc }: { bmc: AnalysisResult["bmc"] }) {
  // Cast to any for LLM-generated dynamic sub-fields
  const b = bmc as any;

  const blocks = [
    {
      title: "💡 Value Propositions",
      color: "border-blue-500/40 bg-blue-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-medium text-white">{toText(b.value_propositions?.core_value)}</p>
          <p className="text-gray-500 text-xs">Differentiator: {toText(b.value_propositions?.differentiator)}</p>
          {toTextList(b.value_propositions?.pain_relievers).map((p, i) => (
            <div key={i} className="flex gap-2"><span className="text-red-400">•</span>{p}</div>
          ))}
          {toTextList(b.value_propositions?.gain_creators).map((g, i) => (
            <div key={i} className="flex gap-2"><span className="text-green-400">+</span>{g}</div>
          ))}
          {/* Fallback: show value_proposition_strength if no detailed data */}
          {!b.value_propositions?.core_value && bmc.value_proposition_strength && (
            <p className="text-gray-300">{toText(bmc.value_proposition_strength)}</p>
          )}
        </div>
      ),
    },
    {
      title: "👥 Customer Segments",
      color: "border-purple-500/40 bg-purple-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-medium text-white">{toText(b.customer_segments?.primary_segment)}</p>
          <p className="text-gray-400 text-xs">{toText(b.customer_segments?.customer_profile)}</p>
          <p className="text-blue-400 text-xs">Target: {toText(b.customer_segments?.estimated_size)}</p>
          {toTextList(b.customer_segments?.secondary_segments).map((s, i) => (
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
          <p className="font-medium text-white">{toText(b.revenue_streams?.primary_revenue)}</p>
          <p className="text-gray-400 text-xs">{toText(b.revenue_streams?.revenue_model)}</p>
          <p className="text-gray-400 text-xs">{toText(b.revenue_streams?.pricing_strategy)}</p>
          <p className="text-green-400 font-semibold text-xs">
            Est. Bulan 1: {toText(b.revenue_streams?.estimated_monthly_revenue_year1)}
          </p>
          {/* Fallback fields */}
          {bmc.time_to_first_revenue && (
            <p className="text-yellow-400 text-xs">Time to Revenue: {toText(bmc.time_to_first_revenue)}</p>
          )}
          {bmc.revenue_model_risk && (
            <p className="text-orange-400 text-xs">Revenue Risk: {toText(bmc.revenue_model_risk)}</p>
          )}
        </div>
      ),
    },
    {
      title: "📣 Channels",
      color: "border-amber-500/40 bg-amber-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          {toTextList(b.channels?.primary_channels).map((c, i) => (
            <div key={i} className="flex gap-2"><span className="text-amber-400">›</span>{c}</div>
          ))}
          <p className="text-gray-400 text-xs mt-2">{toText(b.channels?.channel_strategy)}</p>
          <p className="text-gray-500 text-xs">{toText(b.channels?.digital_presence)}</p>
        </div>
      ),
    },
    {
      title: "🔑 Key Resources",
      color: "border-rose-500/40 bg-rose-500/5",
      content: (
        <div className="space-y-2 text-sm text-gray-300">
          {toTextList(b.key_resources?.human_resources).map((r, i) => (
            <div key={i} className="flex gap-2"><span className="text-blue-400">👤</span><span className="text-xs">{r}</span></div>
          ))}
          {toTextList(b.key_resources?.intellectual_resources).map((r, i) => (
            <div key={i} className="flex gap-2"><span className="text-purple-400">💾</span><span className="text-xs">{r}</span></div>
          ))}
          <p className="text-rose-400 text-xs mt-2">Finansial: {toText(b.key_resources?.financial_requirements)}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">📊 Business Model Canvas</h2>
        <span className="text-2xl font-black text-purple-400">
          {bmc.business_model_score}<span className="text-sm text-gray-500">/100</span>
        </span>
      </div>
      {bmc.bmc_summary && (
        <p className="text-sm text-gray-400 mb-4">{toText(bmc.bmc_summary)}</p>
      )}
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
