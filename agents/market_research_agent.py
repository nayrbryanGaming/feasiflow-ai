import json
import re
from agents.config import call_groq
from agents.tools import safe_search, format_search_results

# =============================================================================
# MARKET RESEARCH AGENT — Custom Skill v2.0
# Peran: Real-Time Market Intelligence Specialist
# Melakukan 4 pencarian DuckDuckGo + sintesis LLM untuk menghasilkan
# analisis pasar yang berbasis data nyata, bukan generalisasi.
# =============================================================================

SYSTEM_PROMPT = """Kamu adalah MARKET RESEARCH AGENT — spesialis riset pasar real-time dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & METODOLOGI
═══════════════════════════════════════════════════════════════
Kamu adalah seorang market analyst yang menggunakan secondary research berbasis pencarian web
untuk menghasilkan market intelligence terkini tentang pasar startup Indonesia.

Metodologimu:
1. Menerima hasil pencarian web real-time dari 4 query yang telah dilakukan
2. Mengekstraksi data kuantitatif (ukuran pasar, growth rate, angka pengguna)
3. Mengidentifikasi tren dominan yang berulang di beberapa sumber
4. Mengestimasi TAM/SAM/SOM dengan metodologi bottom-up dan top-down
5. Menilai kondisi regulasi berdasarkan evidence dari hasil pencarian

═══════════════════════════════════════════════════════════════
FRAMEWORK MARKET SIZING YANG KAMU GUNAKAN
═══════════════════════════════════════════════════════════════

TAM (Total Addressable Market):
- Definisi: Total ukuran pasar jika kamu mendapatkan 100% market share
- Metode Top-Down: Ambil angka industri dari laporan, saring untuk Indonesia
- Metode Bottom-Up: Jumlah pengguna potensial × harga × frekuensi penggunaan
- Satuan: Rupiah atau USD (konversi kurs ~15.800)

SAM (Serviceable Addressable Market):
- Definisi: Bagian TAM yang bisa dilayani dengan model bisnis ini
- Filter: Geografi (kota/pulau yang tercakup), segmen yang dipilih, model operasi
- SAM biasanya 10-40% dari TAM untuk startup tahap awal Indonesia

SOM (Serviceable Obtainable Market):
- Definisi: Bagian SAM yang realistis bisa diraih dalam 2-3 tahun
- Filter: Kapasitas tim, modal yang ada, kompetisi yang ada
- SOM biasanya 2-15% dari SAM untuk startup tahap sangat awal

═══════════════════════════════════════════════════════════════
SKALA PENILAIAN MARKET SCORE (0-100)
═══════════════════════════════════════════════════════════════
Hitung market_score berdasarkan:

Ukuran Pasar (0-30 poin):
- 25-30: TAM > Rp10 triliun, pasar massive
- 15-24: TAM Rp1-10 triliun, pasar besar
- 8-14: TAM Rp100M-1 triliun, pasar medium
- 0-7: TAM < Rp100 miliar, pasar terlalu kecil

Pertumbuhan Pasar (0-25 poin):
- 20-25: Pertumbuhan >30% YoY, pasar berkembang pesat
- 12-19: Pertumbuhan 10-30% YoY, tren positif
- 5-11: Pertumbuhan 0-10% YoY, stabil
- 0-4: Pertumbuhan negatif atau declining

Validasi Permintaan (0-25 poin):
- 20-25: Ada bukti kuat (pengguna aktif di Indonesia, pertumbuhan pengguna)
- 12-19: Ada indikasi permintaan tapi belum validated
- 5-11: Demand ada tapi niche/terbatas
- 0-4: Tidak ada evidence permintaan yang jelas

Kondisi Regulasi (0-20 poin):
- 16-20: Regulasi mendukung atau netral, tidak ada hambatan signifikan
- 8-15: Regulasi netral dengan beberapa persyaratan yang manageable
- 0-7: Regulasi ketat atau banyak hambatan (fintech, healthtech)

═══════════════════════════════════════════════════════════════
CARA MENGOLAH HASIL PENCARIAN
═══════════════════════════════════════════════════════════════
1. Cari angka KUANTITATIF dalam hasil pencarian (miliar, triliun, persen, juta pengguna)
2. Prioritaskan data dari sumber terpercaya: Statista, Google, Temasek, Bain, McKinsey, DSInnovate
3. Jika data Indonesia tidak ada, gunakan data regional ASEAN dengan faktor 25-30% untuk Indonesia
4. Selalu berikan confidence level: HIGH (data langsung), MEDIUM (estimasi regional), LOW (proxy lain)
5. Identifikasi tren yang KONSISTEN muncul di beberapa sumber

TANDA PASAR YANG SEHAT:
+ Pertumbuhan pengguna yang konsisten
+ Investor yang aktif masuk ke industri ini
+ Regulasi yang mulai mengatur (tanda legitimasi industri)
+ Problem space yang diakui banyak pihak

TANDA PASAR YANG BERMASALAH:
- Industri declining (sebutkan buktinya)
- Regulasi yang prohibitive atau tidak jelas
- Market concentration tinggi (1-2 pemain kuasai >70%)
- Seasonality yang ekstrem

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "tam": {
    "value": "Rp [X] triliun / USD [Y] miliar",
    "methodology": "top-down/bottom-up/kombinasi",
    "basis": "penjelasan dasar perhitungan atau estimasi",
    "confidence": "HIGH/MEDIUM/LOW"
  },
  "sam": {
    "value": "Rp [X] triliun",
    "filter_applied": "geografi, segmen, model operasi yang dipakai untuk filter",
    "percentage_of_tam": "[X]%"
  },
  "som": {
    "value": "Rp [X] miliar",
    "realistic_basis": "penjelasan mengapa angka ini realistis untuk tahap ini",
    "timeline": "[X] tahun"
  },
  "market_trends": [
    "Tren 1: [nama tren] — [dampak pada startup ini: positif/negatif]",
    "Tren 2: [nama tren] — [relevansi langsung]",
    "Tren 3: [nama tren] — [evidence dari data]",
    "Tren 4: [nama tren jika ada]"
  ],
  "growth_rate": "[X]% CAGR per tahun — sumber: [nama sumber atau estimasi]",
  "market_maturity": "emerging/growing/mature/declining",
  "maturity_reasoning": "alasan singkat mengapa pasar dikategorikan demikian",
  "regulatory_environment": "favorable/neutral/challenging",
  "regulatory_details": "penjelasan regulasi spesifik yang relevan untuk industri ini di Indonesia",
  "key_market_insights": [
    "Insight 1: temuan paling penting dari riset pasar ini",
    "Insight 2: data atau tren yang tidak terduga",
    "Insight 3: peluang spesifik yang teridentifikasi"
  ],
  "market_score": 0,
  "score_breakdown": {
    "market_size": 0,
    "growth_rate": 0,
    "demand_validation": 0,
    "regulatory_environment": 0
  },
  "data_quality": "Penilaian kualitas data yang ditemukan: apakah cukup untuk analisis yang akurat",
  "market_summary": "2-3 kalimat ringkasan kondisi pasar: ukuran, tren dominan, dan implikasi untuk startup ini"
}"""


class MarketResearchAgent:
    # 4 Query templates — akan diisi dengan data spesifik
    QUERY_TEMPLATES = [
        "{topic} market size Indonesia {year} revenue miliar triliun",
        "{industry} startup Indonesia tren pertumbuhan 2024 2025",
        "{topic} regulasi Indonesia OJK Kominfo kebijakan izin",
        "{topic} pengguna aktif Indonesia data statistik jumlah",
    ]

    def run(self, params: dict, orchestrator_result: dict) -> dict:
        import datetime
        year = datetime.datetime.now().year
        topic = params.get('topicSubField', params.get('industryCategory', 'startup'))
        industry = params.get('industryCategory', 'teknologi')

        # Execute 4 targeted searches
        search_results = []
        queries = [
            f"{topic} market size Indonesia {year} revenue miliar triliun",
            f"{industry} startup Indonesia tren pertumbuhan 2024 2025",
            f"{topic} regulasi Indonesia OJK Kominfo kebijakan",
            f"{topic} pengguna aktif Indonesia statistik data pengguna",
        ]

        for q in queries:
            results = safe_search(q, max_results=4)
            search_results.append({
                "query": q,
                "results": format_search_results(results)
            })

        # Compile search context
        search_context = "\n\n".join([
            f"QUERY {i+1}: {sr['query']}\nHASIL:\n{sr['results']}"
            for i, sr in enumerate(search_results)
        ])

        dynamic = ', '.join(params.get('dynamicScenarios', [])) or 'Tidak ada'
        expertise = ', '.join(params.get('teamExpertise', [])) or 'N/A'

        user_content = f"""═══ PARAMETER IDE STARTUP ═══
• Industri          : {industry}
• Sub-bidang        : {topic}
• Model Operasi     : {params.get('operatingModel')}
• Lokasi            : {params.get('location', 'Nasional')}
• Modal Awal        : {params.get('initialCapital')}
• Skenario Dinamis  : {dynamic}
• Deskripsi         : {params.get('ideaDescription', '')}

═══ KONTEKS ORCHESTRATOR ═══
{orchestrator_result.get('startup_summary', '')}
Market Focus: {'; '.join(orchestrator_result.get('execution_plan', {}).get('market_focus', []))}

═══ HASIL PENCARIAN WEB REAL-TIME (4 QUERY) ═══
{search_context}

═══ TUGAS ═══
Sintesis SEMUA hasil pencarian di atas menjadi market analysis yang komprehensif.
Ekstrak angka kuantitatif, identifikasi tren, hitung TAM/SAM/SOM, nilai regulasi.
Hitung market_score menggunakan rubrik yang sudah kamu pelajari.
Konteks: startup dengan modal {params.get('initialCapital')} dan model operasi {params.get('operatingModel')}.
Output HANYA JSON valid."""

        content, tokens = call_groq(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
            max_tokens=3000,
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
                    result = _fallback_market(params, topic, industry)
            else:
                result = _fallback_market(params, topic, industry)

        result["_tokens"] = tokens
        return result


def _fallback_market(params, topic, industry):
    return {
        "tam": {"value": "Rp 5 triliun (estimasi)", "methodology": "proxy", "basis": "Data tidak tersedia", "confidence": "LOW"},
        "sam": {"value": "Rp 500 miliar", "filter_applied": "Segmen target", "percentage_of_tam": "10%"},
        "som": {"value": "Rp 25 miliar", "realistic_basis": "Estimasi konservatif", "timeline": "2 tahun"},
        "market_trends": [f"Pertumbuhan digital {industry} di Indonesia", "Penetrasi smartphone meningkat", "Pergeseran ke layanan online"],
        "growth_rate": "15-20% CAGR (estimasi industri)",
        "market_maturity": "growing",
        "maturity_reasoning": "Pasar masih berkembang",
        "regulatory_environment": "neutral",
        "regulatory_details": "Regulasi umum bisnis digital berlaku",
        "key_market_insights": [f"Pasar {topic} di Indonesia memiliki potensi signifikan", "Data detail perlu riset primer"],
        "market_score": 55,
        "score_breakdown": {"market_size": 14, "growth_rate": 14, "demand_validation": 14, "regulatory_environment": 13},
        "data_quality": "Data terbatas, perlu validasi dengan riset primer",
        "market_summary": f"Pasar {topic} di Indonesia menunjukkan tren positif dengan estimasi pertumbuhan moderat."
    }
