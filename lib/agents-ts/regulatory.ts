import { callGroq, parseJson, CRITICAL_SCORING_GUIDE } from "./config";
import type { StartupParams } from "./orchestrator";

// Database regulasi per kategori
const REGULATORY_DB: Record<string, { regulators: string[]; key_laws: string[]; notes: string }> = {
  "Fintech": {
    regulators: ["OJK (Otoritas Jasa Keuangan)", "Bank Indonesia (BI)", "PPATK"],
    key_laws: ["UU No. 4/2023 (P2SK)", "POJK 10/2022 (Inovasi Keuangan Digital)", "PBI 23/2021 (Sistem Pembayaran)", "POJK 77/2016 (P2P Lending)"],
    notes: "Wajib izin OJK untuk P2P/crowdfunding, izin BI untuk payment gateway. Modal minimum Rp2.5M (P2P) hingga Rp3T (bank).",
  },
  "Edutech": {
    regulators: ["Kemendikbudristek", "Kemdikbud", "BSNP"],
    key_laws: ["UU No. 20/2003 (Sisdiknas)", "PP No. 17/2010 (Pengelolaan Pendidikan)", "Permendikbud No. 30/2021"],
    notes: "Akreditasi lembaga pendidikan online diperlukan untuk sertifikasi resmi. Konten harus sesuai kurikulum Merdeka Belajar.",
  },
  "Healthtech": {
    regulators: ["Kemenkes", "BPOM", "IDI (Ikatan Dokter Indonesia)", "BPJS Kesehatan"],
    key_laws: ["UU No. 36/2009 (Kesehatan)", "UU No. 29/2004 (Praktik Kedokteran)", "Permenkes 20/2019 (Telemedicine)", "PP 47/2021"],
    notes: "Telemedicine wajib izin Kemenkes. Obat keras tidak boleh dijual online tanpa resep dokter. Data medis wajib dienkripsi.",
  },
  "E-commerce & Marketplace": {
    regulators: ["Kemendag", "Kominfo", "BPKP", "Bea Cukai"],
    key_laws: ["PP No. 80/2019 (PMSE)", "Permendag 31/2023 (TikTok Shop)", "UU ITE No. 19/2016", "UU PDP No. 27/2022"],
    notes: "Wajib daftar PMSE di Kemendag. Marketplace cross-border wajib PPh. Data buyer harus dilindungi UU PDP.",
  },
  "Agritech": {
    regulators: ["Kementan", "BPOM", "BSN", "Kemendag"],
    key_laws: ["UU No. 13/2010 (Hortikultura)", "UU No. 22/2019 (Pertanian)", "PP No. 20/2021", "UU PerlindunganVarietas"],
    notes: "Pestisida dan pupuk wajib izin Kementan. Platform distribusi hasil tani perlu izin perdagangan. Relatif regulasi ringan.",
  },
  "F&B": {
    regulators: ["BPOM", "MUI", "Kemenkes", "Kemendag", "Pemda setempat"],
    key_laws: ["UU No. 18/2012 (Pangan)", "PP No. 86/2019 (Keamanan Pangan)", "Peraturan BPOM 2021", "UU Jaminan Produk Halal"],
    notes: "Wajib sertifikasi BPOM untuk produk pangan olahan. Halal MUI jika target pasar Muslim. IUMK/NIB untuk usaha. Kompleksitas tinggi.",
  },
  "SaaS & Enterprise Software": {
    regulators: ["Kominfo", "BSSN", "OJK (jika fintech)", "Kemendag"],
    key_laws: ["UU PDP No. 27/2022", "PP PSTE No. 71/2019", "Perkominfo 20/2016 (PSE)", "ISO 27001"],
    notes: "Wajib daftar PSE di Kominfo. Data center harus di Indonesia jika simpan data strategis. UU PDP berlaku penuh 2024.",
  },
};

const SYSTEM_PROMPT = `Anda adalah Regulatory Intelligence Agent AI untuk startup Indonesia.
Analisis kelayakan regulasi berdasarkan 7 dimensi: regulatory_clarity, licensing_accessibility,
compliance_cost_feasibility, regulatory_timeline, regulatory_trend, enforcement_risk, government_support.
Berikan regulatory_feasibility_score (0-100) sebagai bobot 8% dari skor final.
Output JSON dengan keys: regulatory_feasibility_score, regulatory_status,
dimension_scores (object dengan 7 keys), required_licenses (array), compliance_timeline_months,
compliance_cost_estimate_idr, key_regulators (array), regulatory_risks (array),
regulatory_opportunities (array), regulatory_summary.` + CRITICAL_SCORING_GUIDE;

export async function runRegulatory(
  params: StartupParams,
  orchestratorMission: string
): Promise<Record<string, unknown>> {
  const normalizedCat = params.industry_category.trim();
  const regData = REGULATORY_DB[normalizedCat] ?? REGULATORY_DB["SaaS & Enterprise Software"];

  const userMsg = `Analisis regulasi untuk ${params.startup_name} (${params.industry_category}):

Mission: ${orchestratorMission}
Produk: ${params.product_description}
Model Bisnis: ${params.business_model}
Modal: ${params.initial_capital}

=== Database Regulasi ${params.industry_category} ===
Regulator: ${regData.regulators.join(", ")}
UU/Peraturan Utama: ${regData.key_laws.join(", ")}
Catatan Regulasi: ${regData.notes}

Analisis kelayakan regulasi dan berikan regulatory_feasibility_score (0-100).
Tinggi = regulasi clear, mudah dipenuhi. Rendah = banyak hambatan regulasi.
Estimasikan compliance_cost dalam IDR dan timeline dalam bulan.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.4, maxTokens: 2048 });

  return parseJson(content);
}
