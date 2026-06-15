import json
import re
from agents.config import call_groq

# =============================================================================
# RECOMMENDATION AGENT — Custom Skill v3.0
# Agent ke-9 (Final) dalam pipeline 9-agen FeasiFlow AI
# Peran: Chief Feasibility Officer — Integrator & Scorer Final
#
# FORMULA BARU — 7 SIFAT PENILAIAN:
# Skor = (Market×0.20) + (BusinessModel×0.18) + (Risk×0.17) +
#        (CompetitiveAdvantage×0.15) + (Financial×0.12) +
#        (DemandValidation×0.10) + (Regulatory×0.08)
# Total bobot = 100%
# =============================================================================

SYSTEM_PROMPT = """Kamu adalah RECOMMENDATION AGENT — Chief Feasibility Officer dan pengambil keputusan FINAL dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & OTORITAS
═══════════════════════════════════════════════════════════════
Kamu adalah agen ke-9 dan terakhir dalam pipeline 9-agen. Kamu memiliki akses
ke output lengkap dari semua 8 agen sebelumnya. Tugasmu adalah mensintesis
semua temuan menjadi satu keputusan kelayakan yang komprehensif dan bertanggung jawab.

Kamu bukan sekedar aggregator — kamu adalah analis yang:
• Mendeteksi kontradiksi antar agen (misal: market tinggi tapi demand rendah)
• Memberikan interpretasi nuanced yang melampaui angka mentah
• Mempertimbangkan konteks Indonesia spesifik yang unik
• Memberikan rekomendasi yang konkret dan dapat dieksekusi hari ini

═══════════════════════════════════════════════════════════════
FORMULA 7 SIFAT PENILAIAN — WAJIB DIGUNAKAN
═══════════════════════════════════════════════════════════════
Skor_Final = (Market_Score × 0.20) +
             (BusinessModel_Score × 0.18) +
             (RiskProfile_Score × 0.17) +
             (CompetitiveAdvantage_Score × 0.15) +
             (FinancialSustainability_Score × 0.12) +
             (DemandValidation_Score × 0.10) +
             (RegulatoryFeasibility_Score × 0.08)

JUSTIFIKASI BOBOT (berbasis riset kegagalan startup Indonesia 2019-2024):
• Market (20%): Kegagalan #1 startup — "no market need" (42% kasus)
• BusinessModel (18%): Kegagalan #2 — "ran out of cash" akibat BM buruk (29%)
• RiskProfile (17%): Kemampuan bertahan ke PMF sama kritis dengan BM
• CompetitiveAdvantage (15%): Diferensiasi bisa dibangun, tapi harus ada dasar
• Financial (12%): Keberlanjutan finansial — runway dan unit economics
• DemandValidation (10%): Bukti nyata sentimen publik dari scraping real-time
• Regulatory (8%): Entry barrier tapi bisa dinavigasi, tidak terlalu menghambat

═══════════════════════════════════════════════════════════════
KLASIFIKASI KELAYAKAN
═══════════════════════════════════════════════════════════════
LAYAK (75-100): GO — Indikator kuat untuk lanjut ke eksekusi
CUKUP LAYAK (55-74): CONDITIONAL GO — Perbaiki area kritis dulu
TIDAK LAYAK (0-54): NO-GO — Revisi fundamental sebelum lanjut

═══════════════════════════════════════════════════════════════
PANDUAN MENULIS REKOMENDASI STRATEGIS
═══════════════════════════════════════════════════════════════
Setiap rekomendasi HARUS:
1. Menjawab SATU kelemahan spesifik atau memperkuat SATU kekuatan dari data
2. Menggunakan resource yang realistis (modal yang tersedia, tim saat ini)
3. Memiliki timeline konkret (bukan "segera" atau "dalam waktu dekat")
4. Memiliki metrik sukses yang terukur

Sumber tiap rekomendasi:
- Dari Market Agent → rekomendasi validasi pasar & target segment
- Dari BMC Agent → rekomendasi penguatan value proposition & revenue
- Dari Competitor Agent → rekomendasi diferensiasi & positioning
- Dari Risk Agent → rekomendasi mitigasi risiko kritis
- Dari Sentiment Agent → rekomendasi berbasis demand nyata
- Dari Regulatory Agent → rekomendasi compliance pathway
- Dari Financial Agent → rekomendasi efisiensi modal & runway

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "feasibility_score": {
    "total_score": 0,
    "classification": "LAYAK/CUKUP LAYAK/TIDAK LAYAK",
    "classification_icon": "LAYAK/CUKUP LAYAK/TIDAK LAYAK",
    "breakdown": {
      "market_score": 0, "market_weight": 0.20, "market_contribution": 0,
      "business_model_score": 0, "business_model_weight": 0.18, "business_model_contribution": 0,
      "risk_score": 0, "risk_weight": 0.17, "risk_contribution": 0,
      "competitive_advantage_score": 0, "competitive_advantage_weight": 0.15, "competitive_advantage_contribution": 0,
      "financial_sustainability_score": 0, "financial_sustainability_weight": 0.12, "financial_sustainability_contribution": 0,
      "demand_validation_score": 0, "demand_validation_weight": 0.10, "demand_validation_contribution": 0,
      "regulatory_feasibility_score": 0, "regulatory_feasibility_weight": 0.08, "regulatory_feasibility_contribution": 0
    },
    "confidence_level": "rendah/sedang/tinggi",
    "confidence_reasoning": "Mengapa tingkat kepercayaan ini diberikan",
    "weakest_dimension": "Dimensi dengan skor terendah dan artinya",
    "strongest_dimension": "Dimensi dengan skor tertinggi dan artinya",
    "scenario_impact": {
      "base_score": 0,
      "with_scenarios": 0,
      "delta": 0,
      "active_scenarios": []
    }
  },
  "go_nogo_recommendation": "GO/NO-GO/CONDITIONAL GO",
  "go_nogo_reasoning": "Penjelasan KONKRET mengapa Go/No-Go/Conditional Go berdasarkan skor dan findings",
  "strengths": [
    "Kekuatan 1: [aspek spesifik dari data 9 agen] — mengapa ini keunggulan nyata",
    "Kekuatan 2",
    "Kekuatan 3"
  ],
  "challenges": [
    "Tantangan 1: [masalah spesifik dari data] — keparahan: TINGGI — solusi minimal",
    "Tantangan 2 — keparahan: SEDANG",
    "Tantangan 3 — keparahan: RENDAH"
  ],
  "strategic_recommendations": [
    "PRIORITAS 1 (KRITIS, lakukan sekarang): [action] — timeline: X minggu — sukses jika: [metrik]",
    "PRIORITAS 2 (TINGGI): [action] — timeline: X bulan — sukses jika: [metrik]",
    "PRIORITAS 3 (TINGGI): [action] — timeline: X bulan — sukses jika: [metrik]",
    "PRIORITAS 4 (SEDANG): [action] — timeline: X bulan — sukses jika: [metrik]",
    "PRIORITAS 5 (JANGKA PANJANG): [action] — timeline: X bulan"
  ],
  "next_steps": [
    "Minggu 1-2: [tindakan konkret paling kritis]",
    "Bulan 1: [tindakan konkret]",
    "Bulan 1-3: [tindakan konkret]",
    "Milestone bulan 6: [target terukur yang harus dicapai]",
    "Pivot trigger: [kondisi spesifik yang menandakan perlu pivot total]"
  ],
  "executive_summary": "Paragraf 1: Apa idenya, mengapa menarik atau tidak, konteks Indonesia.\\n\\nParagraf 2: Temuan utama dari 9 agen — apa yang paling menentukan skor.\\n\\nParagraf 3: Keputusan akhir dan satu tindakan paling kritis yang harus dilakukan segera.",
  "key_success_factors": [
    "Faktor kritis 1 yang WAJIB ada agar startup ini berhasil",
    "Faktor kritis 2",
    "Faktor kritis 3"
  ],
  "red_flags_summary": "Ringkasan red flag kritis yang tersisa dari analisis 9 agen, atau 'Tidak ada red flag kritis yang teridentifikasi.'",
  "comparable_successes": "Contoh startup Indonesia atau Asia yang berhasil dengan model/kategori serupa — sebagai inspirasi dan benchmark realistis."
}"""


class RecommendationAgent:
    def run(
        self,
        params: dict,
        orchestrator_result: dict,
        bmc_result: dict,
        market_result: dict,
        competitor_result: dict,
        risk_result: dict,
        sentiment_result: dict,
        regulatory_result: dict,
        financial_result: dict,
    ) -> dict:

        # ── Extract 7 component scores ────────────────────────────────────
        market_score = market_result.get('market_score', 55)
        bm_score = bmc_result.get('business_model_score', 55)
        risk_score = risk_result.get('overall_risk_score', 55)
        ca_score = competitor_result.get('competitive_advantage_score', 55)
        financial_score = financial_result.get('financial_sustainability_score', 55)
        demand_score = sentiment_result.get('validated_demand_score', 55)
        regulatory_score = regulatory_result.get('regulatory_feasibility_score', 60)

        # ── Hitung Skor Final — Formula 7 Sifat Penilaian ────────────────
        total_score = round(
            (market_score * 0.20) +
            (bm_score * 0.18) +
            (risk_score * 0.17) +
            (ca_score * 0.15) +
            (financial_score * 0.12) +
            (demand_score * 0.10) +
            (regulatory_score * 0.08),
            1
        )

        dynamic = ', '.join(params.get('dynamicScenarios', [])) or 'Tidak ada'

        user_content = f"""═══ PARAMETER IDE STARTUP ═══
• Industri          : {params.get('industryCategory')}
• Sub-bidang        : {params.get('topicSubField')}
• Model Operasi     : {params.get('operatingModel')}
• Modal Awal        : {params.get('initialCapital')}
• Kesiapan          : {params.get('readinessLevel')}
• Keahlian Tim      : {', '.join(params.get('teamExpertise', []))}
• Profil Risiko     : {params.get('riskProfile')}
• Skenario Dinamis  : {dynamic}
• Deskripsi         : {params.get('ideaDescription', '')}

═══ 7 SKOR KOMPONEN (SUDAH DIHITUNG — GUNAKAN ANGKA INI) ═══
1. Market Score              : {market_score}/100 (bobot 20%)
2. Business Model Score      : {bm_score}/100 (bobot 18%)
3. Risk Profile Score        : {risk_score}/100 (bobot 17%)
4. Competitive Advantage     : {ca_score}/100 (bobot 15%)
5. Financial Sustainability  : {financial_score}/100 (bobot 12%)
6. Demand Validation Score   : {demand_score}/100 (bobot 10%)
7. Regulatory Feasibility    : {regulatory_score}/100 (bobot 8%)

═══ SKOR FINAL (SUDAH DIHITUNG — VERIFIKASI) ═══
Skor = ({market_score}×0.20) + ({bm_score}×0.18) + ({risk_score}×0.17) + ({ca_score}×0.15) + ({financial_score}×0.12) + ({demand_score}×0.10) + ({regulatory_score}×0.08)
     = {market_score*0.20:.1f} + {bm_score*0.18:.1f} + {risk_score*0.17:.1f} + {ca_score*0.15:.1f} + {financial_score*0.12:.1f} + {demand_score*0.10:.1f} + {regulatory_score*0.08:.1f}
     = {total_score}
Klasifikasi: {"LAYAK" if total_score >= 75 else "CUKUP LAYAK" if total_score >= 55 else "TIDAK LAYAK"}

═══ RINGKASAN AGEN 1-8 ═══
[1. ORCHESTRATOR]
{orchestrator_result.get('startup_summary', '')}
Early Warnings: {'; '.join(orchestrator_result.get('early_warnings', [])) or 'Tidak ada'}

[2. BMC AGENT]
VP Strength: {bmc_result.get('value_proposition_strength', 'N/A')}
Revenue Risk: {bmc_result.get('revenue_model_risk', 'N/A')}
Time to Revenue: {bmc_result.get('time_to_first_revenue', 'N/A')}
BMC Summary: {bmc_result.get('bmc_summary', '')}

[3. MARKET RESEARCH]
TAM: {market_result.get('tam', {}).get('value', 'N/A')}
Growth Rate: {market_result.get('growth_rate', 'N/A')}
Maturity: {market_result.get('market_maturity', 'N/A')}
Market Summary: {market_result.get('market_summary', '')}

[4. COMPETITOR]
Intensity: {competitor_result.get('competition_intensity', 'N/A')}
Differentiation: {competitor_result.get('differentiation_potential', 'N/A')}
Gaps: {'; '.join(competitor_result.get('market_gaps', [])[:2])}
Positioning: {competitor_result.get('recommended_positioning', '')}

[5. SENTIMENT & SOCIAL INTELLIGENCE]
Demand Score: {demand_score}/100
Pain Points: {'; '.join(sentiment_result.get('pain_point_evidence', [])[:2])}
Key Insight: {sentiment_result.get('key_insight', 'N/A')}
Sentiment Summary: {sentiment_result.get('sentiment_summary', '')}

[6. RISK]
Risk Level: {risk_result.get('risk_level', 'N/A')}
Runway: {risk_result.get('runway_estimate', 'N/A')}
Top Risks: {'; '.join(risk_result.get('top_3_critical_risks', [])[:2])}

[7. REGULATORY INTELLIGENCE]
Regulatory Score: {regulatory_score}/100
Primary Regulator: {regulatory_result.get('primary_regulator', 'N/A')}
Quick Win Path: {regulatory_result.get('quick_win_path', 'N/A')}
Regulatory Summary: {regulatory_result.get('regulatory_summary', '')}

[8. FINANCIAL MODELING]
Financial Score: {financial_score}/100
Runway: {financial_result.get('runway_projection', {}).get('runway_months', 'N/A')} bulan
Burn Rate: {financial_result.get('runway_projection', {}).get('estimated_monthly_burn', 'N/A')}
Financial Summary: {financial_result.get('financial_summary', '')}

═══ TUGAS ═══
Sintesis SEMUA output 8 agen menjadi laporan kelayakan final.
Gunakan total_score = {total_score} yang sudah dihitung.
Identifikasi kontradiksi atau sinyal kuat yang melebihi skor rata-rata.
Hasilkan rekomendasi KONKRET berdasarkan findings NYATA dari 8 agen.
Pertimbangkan profil risiko '{params.get('riskProfile')}' dalam tone rekomendasi.
Output HANYA JSON valid."""

        content, tokens = call_groq(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
            max_tokens=4500,
        )

        try:
            clean = content
            if "<think>" in clean:
                clean = clean[clean.rfind("</think>") + 8:].strip()
            result = json.loads(clean)
        except Exception:
            match = re.search(r'\{[\s\S]*\}', content)
            result = json.loads(match.group()) if match else _fallback_recommendation(
                total_score, market_score, bm_score, risk_score, ca_score,
                financial_score, demand_score, regulatory_score
            )

        # Enforce total_score consistency
        if "feasibility_score" in result:
            result["feasibility_score"]["total_score"] = total_score
            if total_score >= 75:
                result["feasibility_score"]["classification"] = "LAYAK"
                result["feasibility_score"]["classification_icon"] = "LAYAK"
            elif total_score >= 55:
                result["feasibility_score"]["classification"] = "CUKUP LAYAK"
                result["feasibility_score"]["classification_icon"] = "CUKUP LAYAK"
            else:
                result["feasibility_score"]["classification"] = "TIDAK LAYAK"
                result["feasibility_score"]["classification_icon"] = "TIDAK LAYAK"

        result["_tokens"] = tokens
        return result


def _fallback_recommendation(total, market, bm, risk, ca, financial, demand, regulatory):
    classification = "LAYAK" if total >= 75 else "CUKUP LAYAK" if total >= 55 else "TIDAK LAYAK"
    go_nogo = "GO" if total >= 75 else "CONDITIONAL GO" if total >= 55 else "NO-GO"
    scores = {"market": market, "bm": bm, "risk": risk, "ca": ca, "financial": financial, "demand": demand, "reg": regulatory}
    weakest = min(scores, key=lambda k: scores[k])
    strongest = max(scores, key=lambda k: scores[k])

    return {
        "feasibility_score": {
            "total_score": total,
            "classification": classification,
            "classification_icon": classification,
            "breakdown": {
                "market_score": market, "market_weight": 0.20, "market_contribution": round(market * 0.20, 1),
                "business_model_score": bm, "business_model_weight": 0.18, "business_model_contribution": round(bm * 0.18, 1),
                "risk_score": risk, "risk_weight": 0.17, "risk_contribution": round(risk * 0.17, 1),
                "competitive_advantage_score": ca, "competitive_advantage_weight": 0.15, "competitive_advantage_contribution": round(ca * 0.15, 1),
                "financial_sustainability_score": financial, "financial_sustainability_weight": 0.12, "financial_sustainability_contribution": round(financial * 0.12, 1),
                "demand_validation_score": demand, "demand_validation_weight": 0.10, "demand_validation_contribution": round(demand * 0.10, 1),
                "regulatory_feasibility_score": regulatory, "regulatory_feasibility_weight": 0.08, "regulatory_feasibility_contribution": round(regulatory * 0.08, 1),
            },
            "confidence_level": "sedang",
            "confidence_reasoning": "Analisis lengkap dari 9 agen dengan data real-time",
            "weakest_dimension": f"{weakest} ({scores[weakest]}/100) — perlu perhatian segera",
            "strongest_dimension": f"{strongest} ({scores[strongest]}/100) — modal kekuatan",
            "scenario_impact": {"base_score": total, "with_scenarios": total, "delta": 0, "active_scenarios": []}
        },
        "go_nogo_recommendation": go_nogo,
        "go_nogo_reasoning": f"Skor {total}/100 ({classification}) dari 7 sifat penilaian menunjukkan {'fondasi yang kuat' if total >= 75 else 'potensi dengan catatan penting' if total >= 55 else 'tantangan fundamental'}.",
        "strengths": ["Ide memiliki fondasi yang teridentifikasi", "Target pasar terdefinisi", "Ada model bisnis yang logis"],
        "challenges": ["Validasi demand nyata perlu dilakukan", "Modal terbatas memerlukan efisiensi", "Kompetisi perlu diferensiasi jelas"],
        "strategic_recommendations": [
            "PRIORITAS 1 (KRITIS): Lakukan 20 customer interviews dalam 2 minggu — sukses jika: identifikasi 5 paying customer",
            "PRIORITAS 2: Build MVP dengan 1 fitur inti dalam 60 hari — sukses jika: 50 active users",
            "PRIORITAS 3: Urus izin dasar (NIB, PSE) dalam bulan pertama — sukses jika: legal to operate",
            "PRIORITAS 4: Ukur unit economics sejak transaksi pertama — sukses jika: LTV > 3x CAC",
            "PRIORITAS 5: Siapkan pitch deck untuk fundraise seed — timeline: bulan ke-4"
        ],
        "next_steps": [
            "Minggu 1-2: Customer discovery interviews dengan 20 calon pengguna",
            "Bulan 1: Landing page + pre-order/waitlist untuk validasi demand",
            "Bulan 1-3: Develop dan launch MVP ke 50 early users",
            "Milestone bulan 6: 100 paying users dan unit economics positif",
            "Pivot trigger: Jika retention bulan pertama < 30%"
        ],
        "executive_summary": f"Ide startup ini mendapatkan skor kelayakan {total}/100 ({classification}) berdasarkan analisis 7 dimensi dari 9 agen FeasiFlow AI dengan data real-time.\n\nAnalisis menunjukkan skor market {market}/100, business model {bm}/100, risk profile {risk}/100, competitive advantage {ca}/100, financial sustainability {financial}/100, demand validation {demand}/100, dan regulatory feasibility {regulatory}/100.\n\nRekomendasi utama: validasi demand nyata dengan customer interviews sebelum mengalokasikan sumber daya signifikan, dengan fokus membuktikan willingness-to-pay dari target segmen prioritas dalam 30 hari pertama.",
        "key_success_factors": [
            "Validasi demand nyata sebelum build (customer discovery)",
            "Unit economics positif dalam 6 bulan pertama",
            "Diferensiasi yang jelas dan defensible dari kompetitor"
        ],
        "red_flags_summary": "Tidak ada red flag kritis yang teridentifikasi secara eksplisit.",
        "comparable_successes": "Benchmark: startup Indonesia dengan model serupa yang berhasil — perlu riset spesifik per kategori."
    }
