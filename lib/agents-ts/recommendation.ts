import { callGroq, parseJson, CRITICAL_SCORING_GUIDE } from "./config";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Chief Investment & Recommendation Agent AI untuk startup Indonesia — seorang investor due-diligence yang SANGAT KRITIS.
Anda menerima hasil dari 8 agen sebelumnya dan membuat keputusan investasi final yang JUJUR dan tegas.
WAJIB: berikan reasoning konkret untuk setiap penilaian. Jangan ada skor tanpa justifikasi. Jika input/ide lemah, katakan terus terang dan beri rekomendasi NO-GO.

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
investment_verdict, estimated_success_probability_pct, score_justification (penjelasan kenapa skor segini).` + CRITICAL_SCORING_GUIDE;

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

  // Input-quality gate from the Orchestrator: vague/random input can NOT score high.
  const inputQuality = Math.max(0, Math.min(100,
    Number(orchestratorResult.input_quality_score) || 50));
  const inputQualityReasoning = String(orchestratorResult.input_quality_reasoning || "");

  const enrichedUserMsg = `${userMsg}

=== KUALITAS INPUT (dari Orchestrator) ===
Skor kualitas input: ${inputQuality}/100. ${inputQualityReasoning}
Jika kualitas input rendah, JANGAN beri skor tinggi — jelaskan keterbatasannya dan rekomendasikan perbaikan/NO-GO.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: enrichedUserMsg },
  ], { temperature: 0.55, maxTokens: 4096 });

  const result = parseJson(content);

  // Transparent penalty: scale the weighted score by input quality, hard-cap
  // for garbage input. This is what stops random input from scoring ~68.
  const qualityMult = 0.4 + 0.6 * (inputQuality / 100);   // 0.40 .. 1.00
  let adjusted = Math.round(totalScore * qualityMult);
  if (inputQuality < 25) adjusted = Math.min(adjusted, 30);
  adjusted = Math.max(1, Math.min(100, adjusted));

  result.base_score = totalScore;
  result.total_score = adjusted;
  result.score_breakdown = scoreBreakdown;
  result.input_quality_score = inputQuality;
  result.input_quality_reasoning = inputQualityReasoning;
  result.input_quality_penalty = totalScore - adjusted;

  return result;
}
