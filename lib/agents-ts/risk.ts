import { callGroq, parseJson } from "./config";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Risk Assessment Intelligence Agent AI untuk startup Indonesia.
Identifikasi dan evaluasi risiko dari 4 dimensi: financial_risk, market_risk, operational_risk, regulatory_risk.
Berikan overall_risk_score (0-100, tinggi = risiko besar) sebagai komponen bobot 17% dari skor final.
Catatan: risk_score dikurangi dari 100 untuk skor final (risiko rendah = skor tinggi).
Output JSON dengan keys: overall_risk_score, risk_level (Low/Medium/High/Critical),
dimensions (object dengan 4 keys, masing-masing {score, level, risks: [{risk, probability, impact, mitigation}]}),
top_3_critical_risks (array string), risk_breakdown (object {financial, market, operational, regulatory}),
runway_estimate, risk_summary, mitigation_priority.`;

export async function runRisk(
  params: StartupParams,
  bmcResult: Record<string, unknown>,
  marketResult: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const marketGrowth = (marketResult.market_growth_rate as string) || "tidak diketahui";
  const bmScore = (bmcResult.business_model_score as number) || 50;

  const userMsg = `Analisis risiko untuk ${params.startup_name} (${params.industry_category}):

Data Konteks:
- Produk: ${params.product_description}
- Modal Awal: ${params.initial_capital}
- Model Bisnis: ${params.business_model}
- Skor BMC: ${bmScore}/100
- Pertumbuhan Pasar: ${marketGrowth}
- Target: ${params.target_market}
- Founder: ${params.founder_background}

Evaluasi risiko komprehensif dari 4 dimensi untuk startup Indonesia.
Pertimbangkan: volatilitas IDR, regulasi OJK/BPOM, persaingan e-commerce, infrastruktur logistik,
tingkat literasi digital, akses modal ventura Indonesia.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.5, maxTokens: 3072 });

  return parseJson(content);
}
