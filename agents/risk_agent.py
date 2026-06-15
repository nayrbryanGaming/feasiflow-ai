import json
import re
from agents.config import call_groq

# =============================================================================
# RISK ANALYSIS AGENT — Custom Skill v2.0
# Peran: Multi-Dimensional Risk Assessment Specialist
# 4 Dimensi: Financial (30%), Market (30%), Operational (25%), Regulatory (15%)
# =============================================================================

SYSTEM_PROMPT = """Kamu adalah RISK ANALYSIS AGENT — spesialis analisis risiko multi-dimensi dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & KEAHLIAN
═══════════════════════════════════════════════════════════════
Kamu adalah risk analyst berpengalaman yang menggunakan framework 4-dimensi untuk
menilai risiko startup Indonesia secara komprehensif dan proporsional.

Prinsip analisis risiko yang kamu pegang:
1. PROPORSIONAL: risiko dinilai berdasarkan dampak DAN probabilitas, bukan hanya keberadaannya
2. SPESIFIK: setiap risiko harus dikaitkan dengan parameter startup yang konkret
3. ACTIONABLE: setiap risiko harus disertai mitigasi yang realistis dengan resource yang ada
4. KONTEKSTUAL: mempertimbangkan ekosistem bisnis Indonesia yang spesifik

═══════════════════════════════════════════════════════════════
4 DIMENSI RISIKO (BOBOT TETAP SESUAI PENELITIAN)
═══════════════════════════════════════════════════════════════

DIMENSI 1 — FINANCIAL RISK (Bobot: 30% dari Risk Score)
Sub-faktor yang dinilai:
a) Runway Analysis:
   - < Rp50jt: runway 1-3 bulan saja → HIGH RISK
   - Rp50-500jt: runway 6-18 bulan → MEDIUM RISK
   - Rp500jt-2M: runway 18-36 bulan → LOW-MEDIUM RISK
   - > Rp2M: runway 36+ bulan dengan manajemen baik → LOW RISK

b) Revenue Model Sustainability:
   - Apakah ada path to profitability yang jelas?
   - Seberapa cepat unit economics bisa positif?
   - Apakah ada ketergantungan ekstrem pada satu sumber revenue?

c) Capital Efficiency:
   - Apakah model bisnis ini capital-intensive atau capital-light?
   - Berapa estimasi burn rate bulanan?
   - Apakah ada skenario bootstrap yang viable?

d) Funding Risk:
   - Apakah butuh fundraising untuk survive?
   - Kondisi pasar pendanaan Indonesia 2024-2025 sangat ketat
   - Startup tanpa traction akan sangat sulit raise seed round

Skala Financial Risk (0-100, 0=aman, 100=sangat berisiko):
- 0-30: Modal cukup, revenue model jelas, runway panjang
- 31-60: Modal terbatas tapi manageable, ada path to revenue
- 61-80: Modal sangat terbatas, burn rate tinggi, butuh raise cepat
- 81-100: Modal tidak cukup untuk validate, financial doom loop

DIMENSI 2 — MARKET RISK (Bobot: 30% dari Risk Score)
Sub-faktor yang dinilai:
a) Demand Validation Risk:
   - Apakah ada bukti bahwa masalah ini NYATA dan MENDESAK?
   - Apakah target segmen bersedia MEMBAYAR untuk solusi?
   - Seberapa besar risiko ternyata tidak ada pasar yang cukup?

b) Market Timing Risk:
   - Too Early: pasar belum siap (teknologi, awareness, atau infrastructure belum ada)
   - Too Late: pasar sudah jenuh, sulit untuk capture share
   - Just Right: tren mendukung, demand ada, kompetisi manageable

c) Market Concentration Risk:
   - Apakah 1-2 pemain sudah mendominasi dengan >60% share?
   - Apakah ada platform risk (bergantung pada ekosistem pihak ketiga)?

d) Seasonality & Cyclicality:
   - Apakah ada dampak musiman yang signifikan?
   - Apakah bisnis sensitif terhadap siklus ekonomi?

DIMENSI 3 — OPERATIONAL RISK (Bobot: 25% dari Risk Score)
Sub-faktor yang dinilai:
a) Team Capability Gap:
   - Gap antara keahlian tim yang ada vs yang dibutuhkan untuk eksekusi
   - Ketergantungan pada key person (founder single-point-of-failure)
   - Kemampuan tim untuk scale operasi

b) Execution Complexity:
   - Seberapa kompleks model bisnis ini untuk dieksekusi?
   - Apakah membutuhkan koordinasi supply chain yang rumit?
   - Apakah ada dependensi pada pihak ketiga yang kritis?

c) Technology Risk (untuk tech startup):
   - Apakah ada risiko teknis yang material?
   - Build vs buy decision yang benar?
   - Scalability infrastruktur

d) Operational Scalability:
   - Apakah model bisnis ini bisa scale tanpa biaya meledak?
   - Unit economics yang health dengan lebih banyak pengguna?

DIMENSI 4 — REGULATORY RISK (Bobot: 15% dari Risk Score)
Sub-faktor berdasarkan industri:
- Fintech: OJK licensing (P2P, Payment, Insurance) — HIGH RISK jika tidak ada rencana
- Healthtech: Kemenkes, BPOM untuk produk kesehatan — HIGH RISK
- Edutech: Relatif bebas, tapi ada aturan konten — LOW RISK
- E-commerce: Peraturan BPOM untuk produk makanan/kosmetik jika relevan
- Agritech: Kementan, regulasi pertanian — MEDIUM RISK
- General: UU ITE, perlindungan data pribadi (UU PDP 2022) berlaku untuk semua

═══════════════════════════════════════════════════════════════
FORMULA RISK SCORE FINAL
═══════════════════════════════════════════════════════════════
Risk_Score_Final = 100 - (
  (Financial_Risk × 0.30) +
  (Market_Risk × 0.30) +
  (Operational_Risk × 0.25) +
  (Regulatory_Risk × 0.15)
)

Interpretasi Risk_Score_Final (tinggi = aman):
- 75-100: Profil risiko RENDAH — kondisi sangat mendukung
- 55-74: Profil risiko SEDANG — ada beberapa area perhatian yang manageable
- 35-54: Profil risiko TINGGI — beberapa risiko kritis perlu mitigasi segera
- 0-34: Profil risiko SANGAT TINGGI — ada red flag fundamental

═══════════════════════════════════════════════════════════════
DAMPAK SKENARIO DINAMIS PADA RISK SCORE
═══════════════════════════════════════════════════════════════
- Penambahan Modal: Financial_Risk -15 poin (runway lebih panjang)
- Pembukaan Outlet: Operational_Risk +15 poin (kompleksitas naik), Financial_Risk +10 poin
- Ekspansi Wilayah: Operational_Risk +10 poin, Market_Risk -10 poin (SAM lebih besar)
- Pivot Model Bisnis: semua dimensi +10 poin (uncertainty meningkat)

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "financial_risk": {
    "score": 0,
    "level": "rendah/sedang/tinggi/sangat tinggi",
    "runway_estimate": "estimasi berapa bulan modal bertahan",
    "monthly_burn_estimate": "estimasi Rp X per bulan",
    "key_factors": ["faktor risiko finansial spesifik 1", "faktor 2"],
    "mitigations": ["langkah mitigasi konkret 1", "langkah 2"]
  },
  "market_risk": {
    "score": 0,
    "level": "rendah/sedang/tinggi/sangat tinggi",
    "demand_validation_status": "validated/partially_validated/unvalidated",
    "timing_assessment": "too_early/right_time/too_late",
    "key_factors": ["faktor risiko pasar spesifik 1", "faktor 2"],
    "mitigations": ["mitigasi 1", "mitigasi 2"]
  },
  "operational_risk": {
    "score": 0,
    "level": "rendah/sedang/tinggi/sangat tinggi",
    "team_gap_assessment": "penjelasan gap keahlian tim vs kebutuhan",
    "execution_complexity": "rendah/sedang/tinggi",
    "key_factors": ["faktor risiko operasional 1", "faktor 2"],
    "mitigations": ["mitigasi 1", "mitigasi 2"]
  },
  "regulatory_risk": {
    "score": 0,
    "level": "rendah/sedang/tinggi/sangat tinggi",
    "applicable_regulations": ["regulasi spesifik yang berlaku 1", "regulasi 2"],
    "compliance_cost_estimate": "estimasi biaya/waktu compliance",
    "key_factors": ["faktor regulasi 1", "faktor 2"],
    "mitigations": ["mitigasi 1", "mitigasi 2"]
  },
  "overall_risk_score": 0,
  "risk_level": "rendah/sedang/tinggi/sangat tinggi",
  "scenario_adjustments": {
    "tanpa_skenario": 0,
    "dengan_skenario": 0,
    "delta": 0,
    "explanation": "Penjelasan dampak skenario dinamis pada skor risiko"
  },
  "top_3_critical_risks": [
    "Risiko paling kritis 1 — dampak potensial — cara mitigasi",
    "Risiko kritis 2 — dampak — mitigasi",
    "Risiko kritis 3 — dampak — mitigasi"
  ],
  "runway_estimate": "X bulan dengan modal saat ini",
  "risk_summary": "2-3 kalimat narasi profil risiko keseluruhan dan rekomendasi utama"
}"""

# Mapping skenario dinamis ke penyesuaian risk
SCENARIO_RISK_ADJUSTMENTS = {
    "Penambahan Modal di Tengah Jalan": {"financial": -15, "operational": 0, "market": -5, "regulatory": 0},
    "Pembukaan Outlet Fisik Baru": {"financial": +10, "operational": +15, "market": -8, "regulatory": +5},
    "Ekspansi ke Wilayah Baru": {"financial": +5, "operational": +10, "market": -10, "regulatory": +5},
    "Pivot Model Bisnis": {"financial": +10, "operational": +10, "market": +8, "regulatory": +5},
}


class RiskAgent:
    def run(self, params: dict, bmc_result: dict, market_result: dict, competitor_result: dict) -> dict:
        dynamic_scenarios = params.get('dynamicScenarios', [])
        expertise = ', '.join(params.get('teamExpertise', [])) or 'Tidak disebutkan'

        # Hitung penyesuaian skenario dinamis
        scenario_adj = {"financial": 0, "operational": 0, "market": 0, "regulatory": 0}
        for s in dynamic_scenarios:
            if s in SCENARIO_RISK_ADJUSTMENTS:
                adj = SCENARIO_RISK_ADJUSTMENTS[s]
                for key in scenario_adj:
                    scenario_adj[key] += adj[key]

        user_content = f"""═══ PARAMETER IDE STARTUP ═══
• Industri          : {params.get('industryCategory')}
• Sub-bidang        : {params.get('topicSubField')}
• Model Operasi     : {params.get('operatingModel')}
• Modal Awal        : {params.get('initialCapital')}
• Kesiapan          : {params.get('readinessLevel')}
• Keahlian Tim      : {expertise}
• Profil Risiko     : {params.get('riskProfile')}
• Skenario Dinamis  : {', '.join(dynamic_scenarios) or 'Tidak ada'}
• Deskripsi         : {params.get('ideaDescription', '')}

═══ RINGKASAN BMC AGENT ═══
Business Model Score : {bmc_result.get('business_model_score', 'N/A')}
Value Prop Strength  : {bmc_result.get('value_proposition_strength', 'N/A')}
Revenue Model Risk   : {bmc_result.get('revenue_model_risk', 'N/A')}
Revenue Streams      : {'; '.join(bmc_result.get('revenue_streams', [])[:2])}

═══ RINGKASAN MARKET RESEARCH AGENT ═══
Market Score         : {market_result.get('market_score', 'N/A')}
TAM                  : {market_result.get('tam', {}).get('value', 'N/A')}
Growth Rate          : {market_result.get('growth_rate', 'N/A')}
Market Maturity      : {market_result.get('market_maturity', 'N/A')}
Regulatory Env       : {market_result.get('regulatory_environment', 'N/A')}
Regulatory Details   : {market_result.get('regulatory_details', 'N/A')}

═══ RINGKASAN COMPETITOR AGENT ═══
Competition Intensity: {competitor_result.get('competition_intensity', 'N/A')}
CA Score             : {competitor_result.get('competitive_advantage_score', 'N/A')}
Key Risks            : {'; '.join(competitor_result.get('key_competitive_risks', [])[:2])}

═══ PENYESUAIAN SKENARIO DINAMIS ═══
Financial adj  : {scenario_adj['financial']:+d} poin
Operational adj: {scenario_adj['operational']:+d} poin
Market adj     : {scenario_adj['market']:+d} poin
Regulatory adj : {scenario_adj['regulatory']:+d} poin

═══ TUGAS ═══
Lakukan analisis risiko 4 dimensi yang KOMPREHENSIF dan SPESIFIK.
Pertimbangkan:
1. Kombinasi modal {params.get('initialCapital')} + kesiapan {params.get('readinessLevel')} + tim {expertise}
2. Regulatory context dari industri {params.get('industryCategory')}
3. Kompetisi {competitor_result.get('competition_intensity', 'sedang')} yang teridentifikasi
4. Skenario dinamis dan penyesuaiannya (tampilkan skor tanpa dan dengan skenario)

Hitung overall_risk_score menggunakan formula:
100 - ((Financial×0.30) + (Market×0.30) + (Operational×0.25) + (Regulatory×0.15))

Output HANYA JSON valid."""

        content, tokens = call_groq(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=3500,
        )

        try:
            clean = content
            if "<think>" in clean:
                clean = clean[clean.rfind("</think>") + 8:].strip()
            result = json.loads(clean)
        except Exception:
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                try:
                    result = json.loads(match.group())
                except Exception:
                    result = _fallback_risk()
            else:
                result = _fallback_risk()

        result["_tokens"] = tokens
        return result


def _fallback_risk():
    return {
        "financial_risk": {"score": 45, "level": "sedang", "runway_estimate": "12 bulan", "monthly_burn_estimate": "Rp 25-50 juta", "key_factors": ["Modal terbatas", "Revenue belum ada"], "mitigations": ["Lean operations", "Cari early revenue cepat"]},
        "market_risk": {"score": 40, "level": "sedang", "demand_validation_status": "partially_validated", "timing_assessment": "right_time", "key_factors": ["Kompetisi ada", "Demand belum tervalidasi penuh"], "mitigations": ["Lakukan customer interviews", "Build MVP cepat"]},
        "operational_risk": {"score": 50, "level": "sedang", "team_gap_assessment": "Ada gap yang perlu diisi", "execution_complexity": "sedang", "key_factors": ["Tim belum lengkap"], "mitigations": ["Rekrut co-founder", "Outsource non-core"]},
        "regulatory_risk": {"score": 30, "level": "rendah", "applicable_regulations": ["UU ITE", "UU PDP 2022"], "compliance_cost_estimate": "Minimal", "key_factors": ["Regulasi umum bisnis digital"], "mitigations": ["Konsultasi legal awal"]},
        "overall_risk_score": 61,
        "risk_level": "sedang",
        "scenario_adjustments": {"tanpa_skenario": 61, "dengan_skenario": 61, "delta": 0, "explanation": "Tidak ada skenario dinamis"},
        "top_3_critical_risks": ["Modal terbatas — habis sebelum revenue — minimalisir pengeluaran", "Pasar belum tervalidasi — tidak ada demand — lakukan MVP test cepat", "Tim belum lengkap — eksekusi terhambat — identifikasi co-founder"],
        "runway_estimate": "12 bulan",
        "risk_summary": "Profil risiko sedang dengan beberapa area yang perlu perhatian aktif."
    }
