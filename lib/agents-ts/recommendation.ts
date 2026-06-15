import { callGroq, parseJson } from "./config";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Chief Investment & Recommendation Agent AI untuk startup Indonesia.
Anda menerima hasil dari 8 agen sebelumnya dan membuat keputusan investasi final.

Formula skor final (TOTAL 100%):
- Validasi Pasar (market_score) × 0.20 = 20%
- Kekuatan Model Bisnis (business_model_score) × 0.18 = 18%
- Profil Risiko (100 - overall_risk_score) × 0.17 = 17%
- Posisi Kompetitif (competitive_advantage_score) × 0.15 = 15%
- Keberlanjutan Finansial (financial_sustainability_score) × 0.12 = 12%
- Validasi Demand Publik (validated_demand_score) × 0.10 = 10%
- Kelayakan Regulasi (regulatory_feasibility_score) × 0.08 = 8%

Klasifikasi: ≥75 = "Sangat Layak", ≥60 = "Layak dengan Syarat", ≥45 = "Perlu Revisi Major", <45 = "Tidak Layak"
Rekomendasi GO/CONDITIONAL GO/NO-GO

Output JSON dengan keys: total_score, classification, go_nogo_recommendation,
confidence_level (high/medium/low), executive_summary, strengths (array string),
challenges (array string), strategic_recommendations (array string),
next_steps (array string), key_success_factors (array string), red_flags_summary,
score_breakdown (object dengan semua 7 dimensi skor dan kontribusi),
investment_verdict, estimated_success_probability_pct.`;

export async function runRecommendation(
  params: StartupParams,
  orchestratorResult: Record<string, unknown>,
  bmcResult: Record<string, unknown>,
  marketResult: Record<string, unknown>,
  competitorResult: Record<string, unknown>,
  sentimentResult: Record<string, unknown>,
  riskResult: Record<string, unknown>,
  regulatoryResult: Record<string, unknown>,
  financialResult: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const marketScore = (marketResult.market_score as number) || 50;
  const bmScore = (bmcResult.business_model_score as number) || 50;
  const riskOverall = (riskResult.overall_risk_score as number) || 50;
  const riskScore = Math.max(0, 100 - riskOverall);
  const caScore = (competitorResult.competitive_advantage_score as number) || 50;
  const financialScore = (financialResult.financial_sustainability_score as number) || 50;
  const demandScore = (sentimentResult.validated_demand_score as number) || 50;
  const regulatoryScore = (regulatoryResult.regulatory_feasibility_score as number) || 50;

  const totalScore = Math.round(
    (marketScore * 0.20) +
    (bmScore * 0.18) +
    (riskScore * 0.17) +
    (caScore * 0.15) +
    (financialScore * 0.12) +
    (demandScore * 0.10) +
    (regulatoryScore * 0.08)
  );

  const scoreBreakdown = {
    market_score: marketScore,
    market_contribution: +(marketScore * 0.20).toFixed(1),
    business_model_score: bmScore,
    business_model_contribution: +(bmScore * 0.18).toFixed(1),
    risk_score: riskScore,
    risk_contribution: +(riskScore * 0.17).toFixed(1),
    competitive_advantage_score: caScore,
    competitive_advantage_contribution: +(caScore * 0.15).toFixed(1),
    financial_sustainability_score: financialScore,
    financial_sustainability_contribution: +(financialScore * 0.12).toFixed(1),
    demand_validation_score: demandScore,
    demand_validation_contribution: +(demandScore * 0.10).toFixed(1),
    regulatory_feasibility_score: regulatoryScore,
    regulatory_feasibility_contribution: +(regulatoryScore * 0.08).toFixed(1),
  };

  const userMsg = `Buat rekomendasi investasi final untuk ${params.startup_name} (${params.industry_category}):

=== SKOR 8 AGEN SEBELUMNYA ===
1. Market Score: ${marketScore}/100
2. Business Model Score: ${bmScore}/100
3. Risk Score (inverted): ${riskScore}/100 (risiko raw: ${riskOverall})
4. Competitive Advantage Score: ${caScore}/100
5. Financial Sustainability Score: ${financialScore}/100
6. Validated Demand Score (Sentiment): ${demandScore}/100
7. Regulatory Feasibility Score: ${regulatoryScore}/100

=== PERHITUNGAN ===
Total Score (sudah dihitung): ${totalScore}/100

=== KONTEKS STARTUP ===
- Nama: ${params.startup_name}
- Kategori: ${params.industry_category}
- Produk: ${params.product_description}
- Modal: ${params.initial_capital}
- Founder: ${params.founder_background}

=== RINGKASAN DARI AGEN ===
- Market TAM: ${(marketResult.total_addressable_market as string) || "N/A"}
- Kompetitor utama: ${((competitorResult.direct_competitors as any[])?.[0]?.name) || "N/A"}
- Risk level: ${(riskResult.risk_level as string) || "Medium"}
- Runway: ${(financialResult.runway_months as number) || "N/A"} bulan
- Compliance: ${(regulatoryResult.compliance_timeline_months as number) || "N/A"} bulan
- Sentimen: ${(sentimentResult.overall_sentiment as string) || "N/A"}

Berikan analisis mendalam dan rekomendasi strategis.
PENTING: total_score HARUS = ${totalScore} (sudah dihitung, jangan ubah).`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.6, maxTokens: 4096 });

  const result = parseJson(content);
  // Override calculated score to ensure consistency
  result.total_score = totalScore;
  result.score_breakdown = scoreBreakdown;

  return result;
}
