import json
import re
from agents.config import call_groq
from agents.tools import safe_search, format_search_results

# =============================================================================
# FINANCIAL MODELING AGENT — Custom Skill v1.0
# Agent ke-8 dalam pipeline 9-agen FeasiFlow AI
#
# Peran: Chief Financial Analyst
# Tugas: Proyeksi keuangan dan keberlanjutan finansial berdasarkan
#        kategori startup, modal, dan model bisnis
# Output: financial_sustainability_score (0-100)
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# BENCHMARK KEUANGAN PER KATEGORI STARTUP INDONESIA
# ─────────────────────────────────────────────────────────────────────────────
FINANCIAL_BENCHMARKS = {
    "Fintech": {
        "avg_burn_rate_per_month": {"seed": "Rp100-500 Juta", "early": "Rp500 Juta - Rp2 Miliar"},
        "typical_gross_margin": "40-70% (P2P lending: ~60%, payment: ~30-40%)",
        "time_to_profitability": "18-36 bulan untuk fintech lending; 24-48 bulan untuk neobank",
        "typical_cac": "Rp150K - Rp500K per pengguna aktif",
        "typical_ltv": "Rp2 Juta - Rp15 Juta per pengguna aktif fintech lending",
        "key_revenue_drivers": ["transaction fee", "interest spread", "premium subscription", "data analytics"],
        "unit_economics_benchmark": "LTV:CAC ratio minimum 3:1 untuk sustainable growth",
        "funding_requirement": "Rp5-50 Miliar untuk Series A fintech Indonesia (2023-2024)",
        "break_even_users": "50.000 - 200.000 MAU untuk cover operational cost",
        "indonesia_context": "Fintech Indonesia rata-rata butuh 3-4 tahun ke profitabilitas. GoTo Financials masih rugi setelah 10 tahun.",
        "scraping_queries": [
            "fintech Indonesia revenue model unit economics 2024",
            "startup fintech Indonesia burn rate modal 2024 benchmark"
        ]
    },
    "Edutech": {
        "avg_burn_rate_per_month": {"seed": "Rp50-200 Juta", "early": "Rp200 Juta - Rp1 Miliar"},
        "typical_gross_margin": "60-85% (konten digital: ~80%, tutoring live: ~50-60%)",
        "time_to_profitability": "12-24 bulan jika model B2C subscription; 6-18 bulan B2B",
        "typical_cac": "Rp100K - Rp400K per subscriber aktif",
        "typical_ltv": "Rp500K - Rp3 Juta per subscriber (lifetime)",
        "key_revenue_drivers": ["monthly/annual subscription", "per-course payment", "B2B school license", "corporate training"],
        "unit_economics_benchmark": "Churn rate < 10% monthly untuk maintain LTV positif",
        "funding_requirement": "Rp2-20 Miliar untuk Series A edutech Indonesia",
        "break_even_users": "5.000 - 30.000 paying subscribers",
        "indonesia_context": "Ruangguru capai profitabilitas setelah 7 tahun. Zenius tutup karena burn terlalu cepat. Key: product retention.",
        "scraping_queries": [
            "edutech Indonesia revenue model subscription 2024 benchmark",
            "startup bimbel online Indonesia finansial unit economics"
        ]
    },
    "Healthtech": {
        "avg_burn_rate_per_month": {"seed": "Rp100-400 Juta", "early": "Rp400 Juta - Rp2 Miliar"},
        "typical_gross_margin": "50-75% (platform marketplace: ~65%; perangkat fisik: ~30-45%)",
        "time_to_profitability": "24-48 bulan karena butuh dokter/tenaga medis di payroll",
        "typical_cac": "Rp200K - Rp600K per pengguna aktif",
        "typical_ltv": "Rp1 Juta - Rp10 Juta (healthcare cenderung loyal)",
        "key_revenue_drivers": ["konsultasi dokter fee", "subscription premium", "obat delivery margin", "B2B klinik/RS license"],
        "unit_economics_benchmark": "Minimum 50 konsultasi/hari untuk cover cost dokter on-platform",
        "funding_requirement": "Rp10-100 Miliar untuk Series A healthtech (complex operation)",
        "break_even_users": "20.000 - 100.000 MAU; 2.000 - 10.000 paying users",
        "indonesia_context": "Halodoc (SoftBank-backed) masih belum profit. Kuncinya: integrasi BPJS untuk volume besar.",
        "scraping_queries": [
            "healthtech Indonesia revenue model finansial 2024",
            "telemedicine Indonesia cost revenue break even 2024"
        ]
    },
    "E-commerce & Marketplace": {
        "avg_burn_rate_per_month": {"seed": "Rp50-300 Juta", "early": "Rp300 Juta - Rp2 Miliar"},
        "typical_gross_margin": "20-40% (GMV take rate 3-15% typical marketplace)",
        "time_to_profitability": "18-36 bulan untuk niche marketplace; horizontal marketplace butuh 5+ tahun",
        "typical_cac": "Rp50K - Rp200K per active buyer",
        "typical_ltv": "Rp300K - Rp3 Juta (tergantung repeat purchase rate)",
        "key_revenue_drivers": ["take rate/commission", "iklan sponsored", "fulfillment service fee", "SaaS seller tools"],
        "unit_economics_benchmark": "GMV per MAU minimum Rp500K/bulan untuk healthy marketplace",
        "funding_requirement": "Rp3-30 Miliar untuk Series A e-commerce niche Indonesia",
        "break_even_users": "10.000 - 100.000 active buyers + 1.000 - 10.000 active sellers",
        "indonesia_context": "E-commerce di Indonesia sangat competitive. Strategi: hiper-niche untuk survive vs Tokopedia/Shopee.",
        "scraping_queries": [
            "marketplace niche Indonesia revenue model take rate 2024",
            "e-commerce startup Indonesia finansial benchmark 2024"
        ]
    },
    "Agritech": {
        "avg_burn_rate_per_month": {"seed": "Rp100-400 Juta", "early": "Rp400 Juta - Rp3 Miliar"},
        "typical_gross_margin": "15-35% (trading margin rendah); 60-80% (SaaS petani: margin tinggi)",
        "time_to_profitability": "24-48 bulan; sangat tergantung apakah model asset-heavy atau asset-light",
        "typical_cac": "Rp200K - Rp1 Juta per petani aktif (edukasi butuh cost tinggi)",
        "typical_ltv": "Rp1 Juta - Rp5 Juta per petani (jika ada repeat transaction)",
        "key_revenue_drivers": ["trading margin (beli dari petani, jual ke buyer)", "SaaS tools untuk petani", "credit/pembiayaan", "logistik"],
        "unit_economics_benchmark": "Trading margin > 15% atau SaaS ARPU > Rp300K/bulan per petani",
        "funding_requirement": "Rp5-50 Miliar tergantung model; trading butuh working capital besar",
        "break_even_users": "5.000 - 50.000 petani aktif",
        "indonesia_context": "TaniHub dan TaniFund gagal karena over-expansion. Kunci: mulai satu komoditas, satu wilayah, profit dulu baru scale.",
        "scraping_queries": [
            "agritech Indonesia revenue model petani 2024 finansial",
            "startup pertanian digital Indonesia burn rate modal 2024"
        ]
    },
    "F&B": {
        "avg_burn_rate_per_month": {"seed": "Rp30-150 Juta", "early": "Rp150 Juta - Rp1 Miliar"},
        "typical_gross_margin": "30-55% (restoran: ~35%; cloud kitchen: ~40-55%; produk FMCG: ~40-60%)",
        "time_to_profitability": "6-18 bulan untuk F&B yang well-managed (lebih cepat dari tech)",
        "typical_cac": "Rp20K - Rp100K per pelanggan (lebih murah dari tech sector)",
        "typical_ltv": "Rp200K - Rp2 Juta (sangat tergantung pada frekuensi beli dan loyalitas)",
        "key_revenue_drivers": ["margin makanan/minuman", "delivery markup", "catering B2B", "franchise fee"],
        "unit_economics_benchmark": "Omset minimum Rp50 Juta/bulan per outlet untuk cover fixed cost",
        "funding_requirement": "Rp500 Juta - Rp5 Miliar untuk F&B dengan beberapa outlet",
        "break_even_users": "100 - 500 transaksi/hari per outlet untuk break even",
        "indonesia_context": "F&B punya path to profit paling cepat. Namun competition dari GoFood/GrabFood sangat intens. Cloud kitchen jadi tren karena capex rendah.",
        "scraping_queries": [
            "restoran cloud kitchen Indonesia finansial omset modal balik 2024",
            "F&B startup Indonesia unit economics margin 2024"
        ]
    },
    "SaaS & Enterprise Software": {
        "avg_burn_rate_per_month": {"seed": "Rp50-250 Juta", "early": "Rp250 Juta - Rp1,5 Miliar"},
        "typical_gross_margin": "70-90% (SaaS gross margin sangat tinggi)",
        "time_to_profitability": "12-30 bulan; lebih cepat jika B2B dan ada enterprise contract",
        "typical_cac": "Rp1 Juta - Rp10 Juta per enterprise client; Rp100K - Rp500K per SME client",
        "typical_ltv": "Rp5 Juta - Rp100 Juta per enterprise (multi-year contract); Rp1-5 Juta per SME",
        "key_revenue_drivers": ["monthly/annual SaaS subscription", "implementation fee", "support contract", "per-seat pricing"],
        "unit_economics_benchmark": "NRR (Net Revenue Retention) > 100% untuk healthy SaaS; ARR per FTE minimum Rp500 Juta",
        "funding_requirement": "Rp2-20 Miliar untuk Series A SaaS Indonesia",
        "break_even_users": "100 - 500 paying SME clients ATAU 20-50 enterprise clients",
        "indonesia_context": "SaaS Indonesia menghadapi WTP rendah. Strategi: land SME cheap, expand ke enterprise. Jurnal.id dan Majoo sukses dengan model ini.",
        "scraping_queries": [
            "SaaS Indonesia ARR MRR subscription 2024 benchmark",
            "software enterprise Indonesia pricing revenue model 2024"
        ]
    }
}

DEFAULT_CATEGORY = "E-commerce & Marketplace"

# Map modal awal ke angka
CAPITAL_MAP = {
    "< Rp 10 Juta": 10_000_000,
    "Rp 10-50 Juta": 30_000_000,
    "Rp 50-100 Juta": 75_000_000,
    "Rp 100-500 Juta": 300_000_000,
    "Rp 500 Juta - 1 Miliar": 750_000_000,
    "> Rp 1 Miliar": 2_000_000_000,
}

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — Financial Modeling LLM
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah FINANCIAL MODELING AGENT dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & PERAN
═══════════════════════════════════════════════════════════════
Kamu adalah CFO virtual untuk startup early stage Indonesia. Kamu:
- Memahami realistis burn rate dan runway startup Indonesia
- Bisa memproyeksi P&L sederhana berdasarkan model bisnis
- Mengerti perbedaan finansial tiap kategori (fintech, F&B, SaaS, dll)
- Selalu menggunakan Rupiah Indonesia dalam estimasi
- Memberikan angka yang konservatif dan realistis, bukan angka optimistis

═══════════════════════════════════════════════════════════════
7 SIFAT PENILAIAN FINANSIAL
═══════════════════════════════════════════════════════════════
1. CAPITAL_SUFFICIENCY: Apakah modal cukup untuk 6-12 bulan runway?
2. REVENUE_MODEL_CLARITY: Seberapa jelas dan proven model monetisasinya?
3. GROSS_MARGIN_HEALTH: Apakah margin gross cukup untuk sustain operasi?
4. CASH_EFFICIENCY: Seberapa efisien penggunaan modal untuk growth?
5. BREAK_EVEN_ACHIEVABILITY: Seberapa realistis mencapai break even?
6. FUNDING_PATHWAY: Seberapa mudah akses ke funding berikutnya?
7. UNIT_ECONOMICS_VIABILITY: Apakah unit economics mendukung skala bisnis?

═══════════════════════════════════════════════════════════════
CARA MENGHITUNG FINANCIAL_SUSTAINABILITY_SCORE
═══════════════════════════════════════════════════════════════
financial_sustainability_score = weighted average:
- Capital Sufficiency: 22%
- Revenue Model Clarity: 20%
- Gross Margin Health: 18%
- Cash Efficiency: 15%
- Break Even Achievability: 12%
- Funding Pathway: 8%
- Unit Economics Viability: 5%

Interpretasi:
- 75-100: Kondisi finansial sangat kuat — modal cukup, model terbukti
- 55-74: Ada tekanan finansial tapi bisa dimanage dengan disiplin
- 35-54: Finansial lemah — butuh fundraising atau pivot model bisnis
- 0-34: Model bisnis tidak finansially sustainable dalam kondisi saat ini

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "financial_dimensions": {
    "capital_sufficiency": {"score": 0, "reasoning": "penjelasan dengan angka bulan runway"},
    "revenue_model_clarity": {"score": 0, "reasoning": "kejelasan dan proven-ness model revenue"},
    "gross_margin_health": {"score": 0, "reasoning": "estimasi gross margin %"},
    "cash_efficiency": {"score": 0, "reasoning": "CAC, payback period, efisiensi modal"},
    "break_even_achievability": {"score": 0, "reasoning": "berapa bulan dan kondisi untuk BEP"},
    "funding_pathway": {"score": 0, "reasoning": "akses ke investor dan ekosistem funding"},
    "unit_economics_viability": {"score": 0, "reasoning": "LTV:CAC ratio dan sustainability"}
  },
  "financial_sustainability_score": 0,
  "runway_projection": {
    "initial_capital_idr": 0,
    "estimated_monthly_burn": "Rp X Juta/bulan",
    "runway_months": 0,
    "runway_assessment": "Sangat pendek/Cukup/Ideal (>12 bulan)"
  },
  "revenue_projection": {
    "month_3": "Rp X Juta (asumsi: X pengguna × ARPU Rp X)",
    "month_6": "Rp X Juta",
    "month_12": "Rp X Juta",
    "break_even_month": "Estimasi bulan ke-X dengan asumsi growth rate Y%"
  },
  "cost_structure": {
    "fixed_costs": [
      "Gaji tim (X orang): Rp X Juta/bulan",
      "Cloud/infrastruktur: Rp X Juta/bulan",
      "Office/operasional: Rp X Juta/bulan"
    ],
    "variable_costs": [
      "CAC (biaya akuisisi per user): Rp X",
      "COGS per transaksi: X%",
      "Support cost per user: Rp X"
    ],
    "total_estimated_monthly_burn": "Rp X Juta/bulan"
  },
  "funding_recommendation": {
    "next_fundraise_timing": "kapan idealnya fundraise berikutnya",
    "recommended_amount": "Rp X Miliar",
    "investor_type": "Angel/Seed/Pre-Series A/Series A",
    "use_of_funds": ["Alokasi 1: X%", "Alokasi 2: X%", "Alokasi 3: X%"]
  },
  "financial_risks": [
    "Risiko finansial 1 yang paling kritis",
    "Risiko finansial 2"
  ],
  "financial_summary": "2-3 kalimat: kondisi finansial, runway estimate, dan rekomendasi prioritas keuangan."
}"""


class FinancialAgent:
    def run(
        self,
        params: dict,
        orchestrator_result: dict,
        bmc_result: dict,
        market_result: dict,
        risk_result: dict,
        regulatory_result: dict,
    ) -> dict:
        industry = params.get('industryCategory', DEFAULT_CATEGORY)
        capital_str = params.get('initialCapital', 'Rp 100-500 Juta')
        capital_idr = CAPITAL_MAP.get(capital_str, 300_000_000)

        # Match kategori ke benchmark keuangan
        bench_key = None
        for key in FINANCIAL_BENCHMARKS:
            if key.lower() in industry.lower() or industry.lower() in key.lower():
                bench_key = key
                break
        if not bench_key:
            bench_key = DEFAULT_CATEGORY

        bench = FINANCIAL_BENCHMARKS[bench_key]

        # Scraping financial intelligence real-time
        live_financial_data = []
        for query in bench["scraping_queries"]:
            results = safe_search(query, max_results=3)
            formatted = format_search_results(results)
            live_financial_data.append(f"Query: {query}\n{formatted}")

        live_context = "\n\n".join(live_financial_data)

        # Estimasi runway sederhana (pre-LLM calculation)
        burn_estimate_low = capital_idr * 0.08  # 8% capital/month = 12 bulan runway
        burn_estimate_high = capital_idr * 0.15  # 15% capital/month = 7 bulan runway
        runway_low = round(capital_idr / burn_estimate_high, 1)
        runway_high = round(capital_idr / burn_estimate_low, 1)

        user_content = f"""═══ PARAMETER STARTUP ═══
• Kategori       : {industry}
• Sub-bidang     : {params.get('topicSubField')}
• Model Operasi  : {params.get('operatingModel')}
• Modal Awal     : {capital_str} (≈ Rp {capital_idr:,.0f})
• Keahlian Tim   : {', '.join(params.get('teamExpertise', []))}
• Readiness      : {params.get('readinessLevel')}

═══ BENCHMARK KEUANGAN KATEGORI {bench_key.upper()} ═══
Burn Rate Rata-rata: Seed: {bench['avg_burn_rate_per_month']['seed']}, Early: {bench['avg_burn_rate_per_month']['early']}
Gross Margin Tipikal: {bench['typical_gross_margin']}
Time to Profitability: {bench['time_to_profitability']}
CAC Tipikal: {bench['typical_cac']}
LTV Tipikal: {bench['typical_ltv']}
Revenue Drivers: {', '.join(bench['key_revenue_drivers'])}
Unit Economics: {bench['unit_economics_benchmark']}
Break Even Users: {bench['break_even_users']}
Konteks Indonesia: {bench['indonesia_context']}

═══ PRE-CALCULATION RUNWAY ═══
Modal Awal: Rp {capital_idr:,.0f}
Estimasi runway: {runway_low} - {runway_high} bulan
(Asumsi burn rate {burn_estimate_low:,.0f} - {burn_estimate_high:,.0f}/bulan)

═══ INPUT DARI AGEN SEBELUMNYA ═══
BMC Score: {bmc_result.get('business_model_score', 'N/A')}
Revenue Risk BMC: {bmc_result.get('revenue_model_risk', 'N/A')}
Time to First Revenue: {bmc_result.get('time_to_first_revenue', 'N/A')}
Market Score: {market_result.get('market_score', 'N/A')}
Market Maturity: {market_result.get('market_maturity', 'N/A')}
Risk Score: {risk_result.get('overall_risk_score', 'N/A')}
Financial Risk: {risk_result.get('risk_breakdown', {}).get('financial', 50)}
Compliance Cost: {regulatory_result.get('compliance_cost_breakdown', {}).get('realistic', 'N/A')}

═══ REAL-TIME FINANCIAL INTELLIGENCE ═══
{live_context}

═══ TUGAS ═══
Buat proyeksi keuangan realistis untuk startup ini berdasarkan kategori {bench_key}.
Nilai 7 dimensi finansial dan hitung financial_sustainability_score.
Semua angka dalam Rupiah Indonesia. Gunakan benchmark kategori sebagai referensi.
Berikan cost structure yang realistis untuk tim 3-10 orang di Indonesia.
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
            result = json.loads(match.group()) if match else _fallback_financial(
                industry, capital_idr, capital_str, runway_low, runway_high, bench
            )

        result["_tokens"] = tokens
        result["_category_used"] = bench_key
        result["_capital_idr"] = capital_idr
        return result


def _fallback_financial(industry, capital_idr, capital_str, runway_low, runway_high, bench):
    return {
        "financial_dimensions": {
            "capital_sufficiency": {"score": 55, "reasoning": f"Modal {capital_str} memberikan runway {runway_low:.0f}-{runway_high:.0f} bulan"},
            "revenue_model_clarity": {"score": 60, "reasoning": "Revenue driver tersedia tapi perlu validasi"},
            "gross_margin_health": {"score": 60, "reasoning": f"Benchmark gross margin: {bench['typical_gross_margin']}"},
            "cash_efficiency": {"score": 55, "reasoning": f"CAC benchmark: {bench['typical_cac']}"},
            "break_even_achievability": {"score": 55, "reasoning": f"Break even target: {bench['break_even_users']}"},
            "funding_pathway": {"score": 55, "reasoning": "Ekosistem funding Indonesia aktif untuk kategori ini"},
            "unit_economics_viability": {"score": 55, "reasoning": bench["unit_economics_benchmark"]}
        },
        "financial_sustainability_score": 57,
        "runway_projection": {
            "initial_capital_idr": capital_idr,
            "estimated_monthly_burn": f"Rp {capital_idr * 0.10 / 1_000_000:.0f} Juta/bulan",
            "runway_months": round((runway_low + runway_high) / 2),
            "runway_assessment": "Cukup" if runway_low >= 8 else "Pendek — perlu fundraise segera"
        },
        "revenue_projection": {
            "month_3": "Rp 5-20 Juta (early traction)",
            "month_6": "Rp 20-100 Juta",
            "month_12": "Rp 100-500 Juta",
            "break_even_month": f"Estimasi bulan ke-{bench['time_to_profitability'].split('-')[0].strip()}"
        },
        "cost_structure": {
            "fixed_costs": [
                "Gaji tim (3-5 orang): Rp 50-150 Juta/bulan",
                "Cloud/infrastruktur: Rp 5-20 Juta/bulan",
                "Operasional kantor: Rp 10-30 Juta/bulan"
            ],
            "variable_costs": [
                f"CAC: {bench['typical_cac']}",
                "COGS: tergantung model bisnis",
                "Marketing: 20-30% dari budget"
            ],
            "total_estimated_monthly_burn": f"Rp {capital_idr * 0.10 / 1_000_000:.0f} - {capital_idr * 0.15 / 1_000_000:.0f} Juta/bulan"
        },
        "funding_recommendation": {
            "next_fundraise_timing": f"Bulan ke-{max(3, round(runway_low * 0.6))} (saat runway tinggal 4-6 bulan)",
            "recommended_amount": f"Rp {capital_idr * 3 / 1_000_000_000:.1f} Miliar",
            "investor_type": "Angel/Seed" if capital_idr < 500_000_000 else "Pre-Series A",
            "use_of_funds": ["Product development: 40%", "Marketing & sales: 35%", "Operasional: 25%"]
        },
        "financial_risks": [
            f"Runway {runway_low:.0f}-{runway_high:.0f} bulan sangat ketat — validasi revenue sebelum bulan ke-{round(runway_low * 0.5)}",
            "Biaya compliance regulasi bisa memakan 15-30% modal awal"
        ],
        "financial_summary": f"Dengan modal {capital_str}, startup ini memiliki runway estimasi {runway_low:.0f}-{runway_high:.0f} bulan. Model bisnis {industry} memiliki benchmark gross margin {bench['typical_gross_margin']}. Prioritas: validasi unit economics dalam 90 hari pertama."
    }
