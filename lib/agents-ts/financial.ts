import { callGroq, parseJson, CRITICAL_SCORING_GUIDE } from "./config";
import type { StartupParams } from "./orchestrator";

// Benchmark finansial per kategori (dalam IDR)
const FINANCIAL_BENCHMARKS: Record<string, {
  avg_cac_idr: number; avg_ltv_idr: number; typical_burn_rate_monthly_idr: number;
  avg_gross_margin_pct: number; typical_break_even_months: number; avg_series_a_idr: number;
}> = {
  "Fintech": { avg_cac_idr: 150000, avg_ltv_idr: 2500000, typical_burn_rate_monthly_idr: 500000000, avg_gross_margin_pct: 40, typical_break_even_months: 24, avg_series_a_idr: 30000000000 },
  "Edutech": { avg_cac_idr: 200000, avg_ltv_idr: 1500000, typical_burn_rate_monthly_idr: 300000000, avg_gross_margin_pct: 60, typical_break_even_months: 18, avg_series_a_idr: 15000000000 },
  "Healthtech": { avg_cac_idr: 300000, avg_ltv_idr: 3000000, typical_burn_rate_monthly_idr: 400000000, avg_gross_margin_pct: 35, typical_break_even_months: 30, avg_series_a_idr: 25000000000 },
  "E-commerce & Marketplace": { avg_cac_idr: 50000, avg_ltv_idr: 500000, typical_burn_rate_monthly_idr: 800000000, avg_gross_margin_pct: 15, typical_break_even_months: 36, avg_series_a_idr: 50000000000 },
  "Agritech": { avg_cac_idr: 100000, avg_ltv_idr: 800000, typical_burn_rate_monthly_idr: 200000000, avg_gross_margin_pct: 25, typical_break_even_months: 24, avg_series_a_idr: 10000000000 },
  "F&B": { avg_cac_idr: 30000, avg_ltv_idr: 300000, typical_burn_rate_monthly_idr: 150000000, avg_gross_margin_pct: 45, typical_break_even_months: 12, avg_series_a_idr: 5000000000 },
  "SaaS & Enterprise Software": { avg_cac_idr: 5000000, avg_ltv_idr: 50000000, typical_burn_rate_monthly_idr: 350000000, avg_gross_margin_pct: 70, typical_break_even_months: 18, avg_series_a_idr: 20000000000 },
};

function parseCapitalIDR(capitalStr: string): number {
  const s = capitalStr.toLowerCase().replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  if (s.includes("miliar") || s.includes("b") || s.includes("billion")) return num * 1_000_000_000;
  if (s.includes("juta") || s.includes("m") || s.includes("million")) return num * 1_000_000;
  if (s.includes("ribu") || s.includes("k") || s.includes("rb")) return num * 1_000;
  return num || 500_000_000;
}

const SYSTEM_PROMPT = `Anda adalah Financial Modeling & Sustainability Agent AI untuk startup Indonesia.
Analisis kelayakan finansial berdasarkan 7 dimensi: capital_sufficiency, revenue_model_clarity,
gross_margin_health, cash_efficiency, break_even_achievability, funding_pathway, unit_economics_viability.
Berikan financial_sustainability_score (0-100) sebagai bobot 12% dari skor final.
SEMUA nilai keuangan dalam RUPIAH (IDR).
Output JSON dengan keys: financial_sustainability_score, capital_idr, monthly_burn_rate_idr,
runway_months, break_even_estimate_months, projected_revenue_year1_idr, projected_revenue_year3_idr,
cac_estimate_idr, ltv_estimate_idr, ltv_cac_ratio, gross_margin_pct, dimension_scores (7 keys),
funding_recommendation, financial_red_flags (array), financial_strengths (array), financial_summary.` + CRITICAL_SCORING_GUIDE;

export async function runFinancial(
  params: StartupParams,
  bmcResult: Record<string, unknown>,
  riskResult: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const normalizedCat = params.industry_category.trim();
  const benchmark = FINANCIAL_BENCHMARKS[normalizedCat] ?? FINANCIAL_BENCHMARKS["SaaS & Enterprise Software"];
  const capitalIDR = parseCapitalIDR(params.initial_capital);
  const riskScore = (riskResult.overall_risk_score as number) || 50;
  const bmScore = (bmcResult.business_model_score as number) || 50;

  const userMsg = `Analisis finansial untuk ${params.startup_name} (${params.industry_category}):

Data Modal: ${params.initial_capital} (≈ IDR ${capitalIDR.toLocaleString("id-ID")})
Model Bisnis: ${params.business_model}
Target: ${params.target_market}
Founder: ${params.founder_background}

=== Benchmark Industri ${params.industry_category} (IDR) ===
- CAC rata-rata: IDR ${benchmark.avg_cac_idr.toLocaleString("id-ID")}
- LTV rata-rata: IDR ${benchmark.avg_ltv_idr.toLocaleString("id-ID")}
- Burn rate bulanan tipikal: IDR ${benchmark.typical_burn_rate_monthly_idr.toLocaleString("id-ID")}
- Gross margin rata-rata: ${benchmark.avg_gross_margin_pct}%
- Break-even tipikal: ${benchmark.typical_break_even_months} bulan
- Series A rata-rata: IDR ${benchmark.avg_series_a_idr.toLocaleString("id-ID")}

=== Konteks dari Agen Sebelumnya ===
- Skor BMC: ${bmScore}/100
- Skor Risiko: ${riskScore}/100 (tinggi = risiko besar = burn lebih cepat)

Buat proyeksi finansial 3 tahun dan berikan financial_sustainability_score (0-100).
Tinggi = finansial sehat dan berkelanjutan, rendah = runway pendek atau margin buruk.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.4, maxTokens: 3072 });

  return parseJson(content);
}
