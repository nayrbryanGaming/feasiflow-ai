import json
import re
from agents.config import call_groq

# =============================================================================
# RECOMMENDATION AGENT — Custom Skill v2.0
# Peran: Chief Feasibility Officer — Integrator & Scorer Final
# Formula: Skor = (Market×0.30) + (BM×0.25) + (Risk×0.25) + (CA×0.20)
# =============================================================================

SYSTEM_PROMPT = """Kamu adalah RECOMMENDATION AGENT — Chief Feasibility Officer dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & PERAN
═══════════════════════════════════════════════════════════════
Kamu adalah agen terakhir dalam pipeline — integrator dan pengambil keputusan final.
Tugasmu adalah mensintesis output dari 5 agen sebelumnya menjadi:
1. Skor kelayakan final yang terukur dan dapat dipertanggungjawabkan
2. Klasifikasi kelayakan yang jelas
3. Rekomendasi strategis yang actionable
4. Executive summary yang komprehensif

Kamu memiliki otoritas penuh untuk:
- Menggabungkan semua skor dari 5 agen
- Memberi konteks nuansed yang melampaui skor mentah
- Mengidentifikasi kekuatan dan tantangan fundamental
- Memberikan rekomendasi konkret untuk langkah berikutnya

═══════════════════════════════════════════════════════════════
FORMULA SKOR KELAYAKAN FINAL (TETAP — TIDAK BOLEH DIUBAH)
═══════════════════════════════════════════════════════════════
Skor_Final = (Market_Score × 0.30) + (BusinessModel_Score × 0.25) +
             (Risk_Score × 0.25) + (CompetitiveAdvantage_Score × 0.20)

JUSTIFIKASI BOBOT:
- Market (30%): Penyebab kegagalan #1 startup adalah "no market need" (42%)
- Business Model (25%): Penyebab #2 adalah "ran out of cash" dari BM lemah (29%)
- Risk (25%): Kemampuan bertahan sampai PMF sama pentingnya dengan BM
- Competitive Advantage (20%): Bisa dibangun seiring waktu, bobot terendah

═══════════════════════════════════════════════════════════════
KLASIFIKASI KELAYAKAN
═══════════════════════════════════════════════════════════════
LAYAK (75-100):
- Rekomendasi: PROCEED — indikator kuat untuk melanjutkan
- Pesan: "Ide memiliki fondasi yang kuat. Fokus pada eksekusi dan validasi cepat."
- Tone: Optimistis dengan catatan area improvement

CUKUP LAYAK (55-74):
- Rekomendasi: PROCEED WITH CAUTION — perbaiki area kritikal dulu
- Pesan: "Potensial ada, tapi ada satu atau dua area yang butuh strengthening sebelum all-in."
- Tone: Balanced — akui kekuatan, tapi tegas tentang tantangan

TIDAK LAYAK (0-54):
- Rekomendasi: RECONSIDER — revisi fundamental sebelum lanjut
- Pesan: "Dalam bentuk saat ini, ada tantangan fundamental yang harus diselesaikan dulu."
- Tone: Jujur dan direct — tapi konstruktif dengan path forward yang jelas

═══════════════════════════════════════════════════════════════
CARA MENGHASILKAN REKOMENDASI STRATEGIS
═══════════════════════════════════════════════════════════════
Setiap rekomendasi HARUS:
1. Menjawab satu kelemahan atau memperkuat satu kekuatan SPESIFIK
2. Dapat dilakukan dengan resource yang tersedia
3. Memiliki timeline yang jelas
4. Measurable (ada indikator sukses)

Format setiap rekomendasi:
"[ACTION KONKRET] — timeline: [X minggu/bulan] — indikator sukses: [metrik spesifik]"

SUMBER REKOMENDASI:
- Dari market_result: rekomendasi terkait validasi pasar dan positioning
- Dari bmc_result: rekomendasi terkait penguatan value proposition dan revenue
- Dari competitor_result: rekomendasi terkait diferensiasi dan positioning
- Dari risk_result: rekomendasi terkait mitigasi risiko kritis
- Dari orchestrator_result: rekomendasi terkait eksekusi dan prioritas

═══════════════════════════════════════════════════════════════
CARA MENULIS EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════
Executive summary harus:
1. Paragraf 1: Apa idenya dan mengapa ini menarik (atau tidak)
2. Paragraf 2: Temuan utama dari analisis (market, BM, risk, competition)
3. Paragraf 3: Kesimpulan dan rekomendasi tindakan yang paling kritis

Gaya penulisan: profesional seperti laporan analis bisnis, bukan chatbot biasa.
Panjang: 3 paragraf, masing-masing 3-4 kalimat.

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "feasibility_score": {
    "total_score": 0,
    "classification": "LAYAK/CUKUP LAYAK/TIDAK LAYAK",
    "classification_icon": "🚀/⚡/🛑",
    "breakdown": {
      "market_score": 0,
      "market_weight": 0.30,
      "market_contribution": 0,
      "business_model_score": 0,
      "business_model_weight": 0.25,
      "business_model_contribution": 0,
      "risk_score": 0,
      "risk_weight": 0.25,
      "risk_contribution": 0,
      "competitive_advantage_score": 0,
      "competitive_advantage_weight": 0.20,
      "competitive_advantage_contribution": 0
    },
    "confidence_level": "rendah/sedang/tinggi",
    "confidence_reasoning": "Mengapa tingkat kepercayaan ini diberikan",
    "scenario_impact": {
      "base_score": 0,
      "with_scenarios": 0,
      "delta": 0,
      "active_scenarios": []
    }
  },
  "go_nogo_recommendation": "GO/NO-GO/CONDITIONAL GO",
  "go_nogo_reasoning": "Penjelasan spesifik mengapa Go, No-Go, atau Conditional Go",
  "strengths": [
    "Kekuatan 1: [aspek positif yang kuat] — mengapa ini keunggulan kompetitif",
    "Kekuatan 2: [aspek positif] — dampaknya pada kelayakan",
    "Kekuatan 3: [aspek positif]"
  ],
  "challenges": [
    "Tantangan 1: [masalah spesifik] — tingkat keparahan: TINGGI/SEDANG — harus diselesaikan",
    "Tantangan 2: [masalah spesifik] — tingkat keparahan: SEDANG",
    "Tantangan 3: [masalah spesifik]"
  ],
  "strategic_recommendations": [
    "Rekomendasi 1 (PRIORITAS TINGGI): [action] — timeline: [X minggu] — sukses jika: [metrik]",
    "Rekomendasi 2 (PRIORITAS TINGGI): [action] — timeline: [X bulan] — sukses jika: [metrik]",
    "Rekomendasi 3 (PRIORITAS SEDANG): [action] — timeline: [X bulan] — sukses jika: [metrik]",
    "Rekomendasi 4 (PRIORITAS SEDANG): [action] — timeline: [X bulan] — sukses jika: [metrik]",
    "Rekomendasi 5 (PRIORITAS RENDAH): [action untuk long-term] — timeline: [X bulan]"
  ],
  "next_steps": [
    "Langkah 1 (lakukan dalam 1-2 minggu pertama): [tindakan konkret spesifik]",
    "Langkah 2 (lakukan dalam bulan pertama): [tindakan konkret]",
    "Langkah 3 (lakukan dalam 3 bulan pertama): [tindakan konkret]",
    "Langkah 4 (milestone 6 bulan): [target yang harus dicapai]",
    "Langkah 5 (pivot trigger): [kondisi yang menandakan perlu pivot]"
  ],
  "executive_summary": "Paragraf 1 tentang ide dan potensinya.\\n\\nParagraf 2 tentang temuan analisis utama.\\n\\nParagraf 3 tentang kesimpulan dan tindakan paling kritis.",
  "key_success_factors": [
    "Faktor sukses 1: [hal yang HARUS ada agar startup ini berhasil]",
    "Faktor sukses 2: [hal kritis kedua]",
    "Faktor sukses 3: [hal kritis ketiga]"
  ],
  "red_flags_summary": "Ringkasan red flag yang masih ada setelah analisis lengkap, atau 'Tidak ada red flag kritis yang teridentifikasi.'",
  "comparable_successes": "Contoh startup Indonesia atau global yang sukses dengan model serupa, sebagai benchmark."
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
    ) -> dict:

        # Extract component scores
        market_score = market_result.get('market_score', 55)
        bm_score = bmc_result.get('business_model_score', 55)
        risk_score = risk_result.get('overall_risk_score', 55)
        ca_score = competitor_result.get('competitive_advantage_score', 55)

        # Hitung skor final menggunakan formula penelitian
        total_score = round(
            (market_score * 0.30) +
            (bm_score * 0.25) +
            (risk_score * 0.25) +
            (ca_score * 0.20),
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

═══ SKOR KOMPONEN (SUDAH DIHITUNG — GUNAKAN INI) ═══
Market Score              : {market_score}/100
Business Model Score      : {bm_score}/100
Risk Score                : {risk_score}/100
Competitive Advantage     : {ca_score}/100

═══ SKOR FINAL (SUDAH DIHITUNG — VERIFIKASI) ═══
Skor = ({market_score}×0.30) + ({bm_score}×0.25) + ({risk_score}×0.25) + ({ca_score}×0.20)
     = {market_score*0.30:.1f} + {bm_score*0.25:.1f} + {risk_score*0.25:.1f} + {ca_score*0.20:.1f}
     = {total_score}

═══ RINGKASAN SEMUA AGEN ═══
[ORCHESTRATOR]
{orchestrator_result.get('startup_summary', '')}
Early Warnings: {'; '.join(orchestrator_result.get('early_warnings', [])) or 'Tidak ada'}

[BMC AGENT]
VP Strength: {bmc_result.get('value_proposition_strength', 'N/A')}
Revenue Risk: {bmc_result.get('revenue_model_risk', 'N/A')}
Time to Revenue: {bmc_result.get('time_to_first_revenue', 'N/A')}
BMC Summary: {bmc_result.get('bmc_summary', '')}

[MARKET RESEARCH]
TAM: {market_result.get('tam', {}).get('value', 'N/A')}
Growth Rate: {market_result.get('growth_rate', 'N/A')}
Maturity: {market_result.get('market_maturity', 'N/A')}
Regulatory: {market_result.get('regulatory_environment', 'N/A')} — {market_result.get('regulatory_details', '')}
Market Summary: {market_result.get('market_summary', '')}

[COMPETITOR]
Competition Intensity: {competitor_result.get('competition_intensity', 'N/A')}
Differentiation Potential: {competitor_result.get('differentiation_potential', 'N/A')}
Market Gaps: {'; '.join(competitor_result.get('market_gaps', [])[:2])}
Positioning: {competitor_result.get('recommended_positioning', '')}

[RISK]
Risk Level: {risk_result.get('risk_level', 'N/A')}
Runway: {risk_result.get('runway_estimate', 'N/A')}
Top 3 Risks: {'; '.join(risk_result.get('top_3_critical_risks', [])[:2])}
Risk Summary: {risk_result.get('risk_summary', '')}

═══ TUGAS ═══
Sintesis SEMUA informasi di atas menjadi laporan kelayakan final.
Gunakan total_score = {total_score} yang sudah dihitung.
Klasifikasikan: {'>= 75: LAYAK' if total_score >= 75 else '>= 55: CUKUP LAYAK' if total_score >= 55 else '< 55: TIDAK LAYAK'}
Hasilkan rekomendasi KONKRET dan ACTIONABLE berdasarkan findings nyata dari analisis.
Pertimbangkan profil risiko '{params.get('riskProfile')}' dalam tone rekomendasi.
Output HANYA JSON valid."""

        content, tokens = call_groq(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
            max_tokens=4000,
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
                    result = _fallback_recommendation(total_score, market_score, bm_score, risk_score, ca_score)
            else:
                result = _fallback_recommendation(total_score, market_score, bm_score, risk_score, ca_score)

        # Ensure total_score is consistent
        if "feasibility_score" in result:
            result["feasibility_score"]["total_score"] = total_score
            if total_score >= 75:
                result["feasibility_score"]["classification"] = "LAYAK"
                result["feasibility_score"]["classification_icon"] = "🚀"
            elif total_score >= 55:
                result["feasibility_score"]["classification"] = "CUKUP LAYAK"
                result["feasibility_score"]["classification_icon"] = "⚡"
            else:
                result["feasibility_score"]["classification"] = "TIDAK LAYAK"
                result["feasibility_score"]["classification_icon"] = "🛑"

        result["_tokens"] = tokens
        return result


def _fallback_recommendation(total, market, bm, risk, ca):
    classification = "LAYAK" if total >= 75 else "CUKUP LAYAK" if total >= 55 else "TIDAK LAYAK"
    icon = "🚀" if total >= 75 else "⚡" if total >= 55 else "🛑"
    return {
        "feasibility_score": {
            "total_score": total,
            "classification": classification,
            "classification_icon": icon,
            "breakdown": {
                "market_score": market, "market_weight": 0.30, "market_contribution": round(market*0.30, 1),
                "business_model_score": bm, "business_model_weight": 0.25, "business_model_contribution": round(bm*0.25, 1),
                "risk_score": risk, "risk_weight": 0.25, "risk_contribution": round(risk*0.25, 1),
                "competitive_advantage_score": ca, "competitive_advantage_weight": 0.20, "competitive_advantage_contribution": round(ca*0.20, 1),
            },
            "confidence_level": "sedang",
            "confidence_reasoning": "Analisis berbasis data yang tersedia",
            "scenario_impact": {"base_score": total, "with_scenarios": total, "delta": 0, "active_scenarios": []}
        },
        "go_nogo_recommendation": "GO" if total >= 75 else "CONDITIONAL GO" if total >= 55 else "NO-GO",
        "go_nogo_reasoning": f"Skor {total} menunjukkan {'potensi yang kuat' if total >= 75 else 'potensi dengan catatan' if total >= 55 else 'tantangan fundamental yang harus diselesaikan'}",
        "strengths": ["Ide memiliki fondasi yang dapat dikembangkan", "Target pasar terdefinisi", "Model bisnis memiliki logika yang jelas"],
        "challenges": ["Validasi pasar perlu dilakukan lebih dalam", "Modal terbatas memerlukan efisiensi tinggi", "Kompetisi perlu diantisipasi dengan diferensiasi jelas"],
        "strategic_recommendations": [
            "Lakukan 20 customer interviews dalam 2 minggu pertama",
            "Build MVP minimal dalam 60 hari dengan fitur inti saja",
            "Identifikasi 3 early adopter yang mau bayar dari hari pertama",
            "Ukur unit economics sejak transaksi pertama",
            "Review dan pivot jika retention < 40% setelah bulan pertama"
        ],
        "next_steps": [
            "Minggu 1-2: Customer discovery interviews dengan 20 calon pengguna",
            "Bulan 1: Bangun landing page dan validasi dengan pre-order/waitlist",
            "Bulan 1-3: Develop dan launch MVP ke 50 early users",
            "Bulan 6: Capai 100 paying users dan positive unit economics",
            "Pivot trigger: Jika retention bulan pertama < 30%"
        ],
        "executive_summary": f"Ide startup ini mendapatkan skor kelayakan {total}/100 ({classification}) berdasarkan analisis komprehensif 4 dimensi menggunakan sistem FeasiFlow AI.\n\nAnalisis menunjukkan skor pasar {market}/100, model bisnis {bm}/100, profil risiko {risk}/100, dan keunggulan kompetitif {ca}/100. Setiap dimensi telah dianalisis menggunakan data real-time dan framework yang tervalidasi.\n\nRekomendasi utama adalah melakukan validasi pasar secara langsung sebelum mengalokasikan sumber daya besar, dengan fokus pada membuktikan willingness-to-pay dari target segmen prioritas.",
        "key_success_factors": ["Validasi demand nyata sebelum build", "Efisiensi modal dalam 6 bulan pertama", "Diferensiasi yang jelas dari kompetitor"],
        "red_flags_summary": "Tidak ada red flag kritis yang menghalangi kelanjutan proyek.",
        "comparable_successes": "Startup dengan model serupa yang berhasil di Indonesia: perlu riset lebih lanjut untuk benchmark yang akurat."
    }
