import json
import re
from agents.config import call_groq
from agents.tools import safe_search, format_search_results

# =============================================================================
# COMPETITOR ANALYSIS AGENT — Custom Skill v2.0
# Peran: Competitive Intelligence Specialist
# =============================================================================

SYSTEM_PROMPT = """Kamu adalah COMPETITOR ANALYSIS AGENT — spesialis competitive intelligence dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & METODOLOGI
═══════════════════════════════════════════════════════════════
Kamu adalah competitive analyst yang menggunakan Porter's Five Forces,
Blue Ocean Strategy thinking, dan analisis positioning untuk mengevaluasi
lanskap kompetitif sebuah startup baru di pasar Indonesia.

Metodologimu:
1. Menganalisis hasil pencarian web untuk menemukan kompetitor nyata
2. Profiling setiap kompetitor: kekuatan, kelemahan, market share estimasi
3. Mengidentifikasi celah pasar (market gaps) yang belum terlayani
4. Menilai competitive advantage potensial dari startup yang dianalisis
5. Menghitung competitive_advantage_score berdasarkan intensitas kompetisi

═══════════════════════════════════════════════════════════════
FRAMEWORK ANALISIS KOMPETITOR
═══════════════════════════════════════════════════════════════

KOMPETITOR LANGSUNG (Direct Competitors):
- Definisi: produk/layanan yang menyelesaikan masalah SAMA untuk segmen SAMA
- Analisis: nama, deskripsi, kekuatan utama, kelemahan utama, estimasi ukuran
- Minimum 3 kompetitor langsung HARUS diidentifikasi

KOMPETITOR TIDAK LANGSUNG (Indirect Competitors):
- Definisi: solusi alternatif yang menyelesaikan masalah serupa dengan cara berbeda
- Contoh: untuk edtech, indirect competitor adalah les privat offline
- Minimum 2 kompetitor tidak langsung

ANALISIS CELAH PASAR (Market Gaps):
- Segmen yang UNDER-SERVED oleh kompetitor existing
- Fitur atau layanan yang HILANG dari semua kompetitor
- Geografis yang BELUM dijangkau kompetitor besar
- Price point yang TIDAK ADA di pasar saat ini

═══════════════════════════════════════════════════════════════
RUBRIK COMPETITIVE ADVANTAGE SCORE (0-100)
═══════════════════════════════════════════════════════════════
Mulai dari baseline 50, lalu adjust:

PENAMBAH SKOR:
+15: Tidak ada kompetitor langsung yang dominan (market share <30%)
+12: Ada celah pasar yang jelas dan material
+10: Tim memiliki keahlian unik yang tidak dimiliki kompetitor
+8: Model operasi berbeda yang sulit ditiru kompetitor besar
+5: First-mover advantage di sub-niche atau geografi tertentu

PENGURANG SKOR:
-20: Ada unicorn/pemain besar yang sudah established di space ini
-15: Kompetitor sudah punya >1 juta pengguna di Indonesia
-10: Tidak ada diferensiasi yang jelas dari kompetitor existing
-8: Pasar jenuh (>5 kompetitor kuat dengan backing VC)
-5: Kompetitor sedang ekspansi agresif ke target segmen ini

═══════════════════════════════════════════════════════════════
PENILAIAN INTENSITAS KOMPETISI
═══════════════════════════════════════════════════════════════
- RENDAH: <3 kompetitor langsung, tidak ada yang dominant (>40% share)
- SEDANG: 3-6 kompetitor, ada 1-2 yang established tapi ada celah
- TINGGI: >6 kompetitor atau ada 1-2 yang sangat dominant
- SANGAT TINGGI: Dikuasai incumbent besar (Gojek, Tokopedia, dll)

═══════════════════════════════════════════════════════════════
CARA MENGOLAH HASIL PENCARIAN
═══════════════════════════════════════════════════════════════
1. Ekstrak nama startup/perusahaan yang muncul sebagai kompetitor
2. Identifikasi funding stage mereka (seed, series A, dll) sebagai proxy kekuatan
3. Perhatikan user reviews/complaints sebagai indikator kelemahan
4. Cari press releases tentang ekspansi yang mungkin mengancam space ini
5. Identifikasi apa yang BELUM ada dari kompetitor-kompetitor ini

FORMAT OUTPUT JSON WAJIB:
{
  "direct_competitors": [
    {
      "name": "Nama Kompetitor",
      "description": "Deskripsi singkat: apa yang mereka lakukan",
      "strengths": ["Kekuatan 1 yang signifikan", "Kekuatan 2"],
      "weaknesses": ["Kelemahan 1 yang bisa dieksploitasi", "Kelemahan 2"],
      "estimated_size": "Early-stage/Growth-stage/Established — [indikator ukuran jika ada]",
      "threat_level": "rendah/sedang/tinggi"
    }
  ],
  "indirect_competitors": [
    {
      "name": "Nama/Kategori",
      "description": "Bagaimana mereka menyelesaikan masalah yang sama secara berbeda",
      "why_indirect": "Alasan dikategorikan indirect bukan direct"
    }
  ],
  "competitive_landscape": "Narasi 2-3 kalimat tentang intensitas kompetisi dan dinamika pasar secara keseluruhan.",
  "competition_intensity": "rendah/sedang/tinggi/sangat tinggi",
  "market_gaps": [
    "Gap 1: [segmen/fitur/geografi yang belum terlayani dengan baik] — ukuran estimasi gap",
    "Gap 2: [celah harga atau kualitas yang ada]",
    "Gap 3: [celah layanan jika ada]"
  ],
  "our_differentiation": "Penjelasan spesifik tentang bagaimana startup ini bisa berbeda dari semua kompetitor yang teridentifikasi.",
  "competitive_advantage_score": 0,
  "score_reasoning": "Penjelasan mengapa angka ini diberikan: faktor apa yang menaikkan dan menurunkan",
  "differentiation_potential": "rendah/sedang/tinggi",
  "key_competitive_risks": [
    "Risiko kompetitif 1 yang paling mengancam",
    "Risiko kompetitif 2"
  ],
  "recommended_positioning": "Rekomendasi positioning spesifik untuk startup ini agar tidak frontal bersaing dengan incumbent"
}"""


class CompetitorAgent:
    def run(self, params: dict, orchestrator_result: dict) -> dict:
        topic = params.get('topicSubField', params.get('industryCategory', 'startup'))
        industry = params.get('industryCategory', 'teknologi')
        op_model = params.get('operatingModel', '')

        queries = [
            f"{topic} startup Indonesia terbaik 2024 kompetitor aplikasi",
            f"{industry} Indonesia pemain utama market share unicorn 2024",
            f"{topic} Indonesia kelemahan kekurangan ulasan pengguna",
            f"startup {topic} Indonesia celah pasar peluang gap 2024",
        ]

        search_results = []
        for q in queries:
            results = safe_search(q, max_results=4)
            search_results.append({
                "query": q,
                "results": format_search_results(results)
            })

        search_context = "\n\n".join([
            f"QUERY {i+1}: {sr['query']}\nHASIL:\n{sr['results']}"
            for i, sr in enumerate(search_results)
        ])

        competitor_hints = orchestrator_result.get('execution_plan', {}).get('competitor_focus', [])

        user_content = f"""═══ PARAMETER IDE STARTUP ═══
• Industri          : {industry}
• Sub-bidang        : {topic}
• Model Operasi     : {op_model}
• Lokasi            : {params.get('location', 'Nasional')}
• Modal Awal        : {params.get('initialCapital')}
• Keahlian Tim      : {', '.join(params.get('teamExpertise', []))}
• Deskripsi         : {params.get('ideaDescription', '')}

═══ HINT KOMPETITOR DARI ORCHESTRATOR ═══
{'; '.join(competitor_hints) or 'Cari kompetitor berdasarkan konteks'}

═══ HASIL PENCARIAN KOMPETITOR (4 QUERY REAL-TIME) ═══
{search_context}

═══ TUGAS ═══
Analisis SEMUA hasil pencarian untuk mengidentifikasi lanskap kompetitif.
Temukan MINIMUM 3 kompetitor langsung yang nyata (bukan hipotetis).
Hitung competitive_advantage_score dengan rubrik yang kamu pelajari.
Identifikasi celah pasar SPESIFIK yang bisa dieksploitasi startup ini.
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
                    result = _fallback_competitor(topic)
            else:
                result = _fallback_competitor(topic)

        result["_tokens"] = tokens
        return result


def _fallback_competitor(topic):
    return {
        "direct_competitors": [
            {"name": "Pemain Existing 1", "description": f"Platform {topic} yang sudah ada", "strengths": ["Brand awareness", "User base"], "weaknesses": ["UX kompleks", "Harga tinggi"], "estimated_size": "Growth-stage", "threat_level": "sedang"},
            {"name": "Pemain Existing 2", "description": f"Solusi {topic} alternatif", "strengths": ["Harga terjangkau"], "weaknesses": ["Fitur terbatas"], "estimated_size": "Early-stage", "threat_level": "rendah"},
            {"name": "Pemain Existing 3", "description": "Kompetitor generalis", "strengths": ["Skala besar"], "weaknesses": ["Tidak fokus di niche ini"], "estimated_size": "Established", "threat_level": "sedang"},
        ],
        "indirect_competitors": [
            {"name": "Solusi Manual/Tradisional", "description": "Cara konvensional yang digantikan", "why_indirect": "Solusi berbeda tapi menyelesaikan masalah serupa"}
        ],
        "competitive_landscape": f"Pasar {topic} di Indonesia memiliki beberapa pemain dengan intensitas kompetisi sedang.",
        "competition_intensity": "sedang",
        "market_gaps": ["Segmen yang belum terlayani optimal", "Fitur yang kurang dari kompetitor existing"],
        "our_differentiation": "Diferensiasi berdasarkan value proposition unik dan target segmen spesifik",
        "competitive_advantage_score": 55,
        "score_reasoning": "Kompetisi ada tapi celah pasar tersedia",
        "differentiation_potential": "sedang",
        "key_competitive_risks": ["Kompetitor bisa menyalin fitur", "Incumbent bisa ekspansi ke segmen ini"],
        "recommended_positioning": "Fokus pada segmen underserved dan build community moat"
    }
