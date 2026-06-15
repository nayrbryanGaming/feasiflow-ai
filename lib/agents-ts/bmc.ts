import { callGroq, parseJson } from "./config";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Business Model Canvas Specialist AI untuk startup Indonesia.
Analisis dan validasi Business Model Canvas dengan 9 building blocks standar Osterwalder.
Berikan business_model_score (0-100) berdasarkan kekuatan dan koherensi model bisnis.
Pertimbangkan konteks Indonesia: perilaku konsumen lokal, infrastruktur digital, daya beli IDR.
Output JSON dengan keys: value_propositions, customer_segments, channels, customer_relationships,
revenue_streams, key_resources, key_activities, key_partnerships, cost_structure,
business_model_score, model_coherence_analysis, revenue_model_clarity, scalability_assessment,
unit_economics_preview, critical_assumptions.`;

export async function runBMC(params: StartupParams, orchestratorMission: string): Promise<Record<string, unknown>> {
  const userMsg = `Analisis BMC untuk ${params.startup_name} (${params.industry_category}):

Mission dari Orchestrator: ${orchestratorMission}

Data Startup:
- Produk: ${params.product_description}
- Target: ${params.target_market}
- UVP: ${params.unique_value_proposition}
- Model Bisnis: ${params.business_model}
- Modal: ${params.initial_capital}
- Founder: ${params.founder_background}

Buat Business Model Canvas lengkap dan berikan skor kelayakan model bisnis (0-100).`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.65, maxTokens: 3072 });

  return parseJson(content);
}
