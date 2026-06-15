import json
import re
from agents.config import call_groq
from agents.tools import safe_search, format_search_results

# =============================================================================
# REGULATORY INTELLIGENCE AGENT — Custom Skill v1.0
# Agent ke-7 dalam pipeline 9-agen FeasiFlow AI
#
# Peran: Regulatory Intelligence Officer
# Tugas: Analisis kelayakan regulasi SPESIFIK per kategori startup
# Setiap dari 7 kategori punya landscape regulasi dan compliance path berbeda
# Output: regulatory_feasibility_score (0-100)
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE REGULASI 7 KATEGORI STARTUP INDONESIA
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_REGULATORY_DB = {

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 1: FINTECH
    # ══════════════════════════════════════════════════════════════════════════
    "Fintech": {
        "primary_regulator": "OJK (Otoritas Jasa Keuangan) + BI (Bank Indonesia)",
        "key_licenses": [
            "Izin Penyelenggara Layanan Pinjam Meminjam Uang Berbasis Teknologi (P2P Lending) — POJK 10/2022",
            "Izin Payment System — BI PBI No.23/6/PBI/2021 (untuk payment gateway/e-wallet)",
            "Izin Securities Crowdfunding (SCF) — POJK 57/2020",
            "Izin PPMSE (Penyelenggara Perdagangan Melalui Sistem Elektronik) untuk marketplace fintech",
            "Sandbox OJK — jalur inovasi untuk produk belum masuk kategori existing"
        ],
        "compliance_requirements": [
            "Modal minimum disetor: Rp2,5 Miliar (P2P lending tahap awal)",
            "KYC/AML compliance wajib: verifikasi identitas pengguna sesuai PPATK",
            "Data residency: data nasabah wajib disimpan di server Indonesia",
            "Tim minimum: Komisaris independen, Direksi, Compliance Officer bersertifikat",
            "Audit laporan keuangan tahunan oleh KAP terdaftar OJK",
            "Pelaporan berkala ke OJK: monthly, quarterly, annual",
            "Perlindungan konsumen: escrow account, dana cadangan"
        ],
        "regulatory_risks": [
            "OJK moratorium izin P2P baru sejak 2023 — sangat sulit izin baru",
            "Peraturan bisa berubah cepat, terutama terkait pinjol ilegal",
            "PPATK bisa freeze akun jika ada suspicious transaction patterns",
            "Kewajiban modal minimum akan naik seiring revisi regulasi"
        ],
        "compliance_timeline": "12-24 bulan untuk izin penuh; 6-12 bulan untuk sandbox OJK",
        "compliance_cost_estimate": "Rp500 Juta - Rp3 Miliar (legal + modal minimum + infrastruktur keamanan)",
        "regulatory_trend": "Semakin ketat post-kasus pinjol ilegal 2021-2023; OJK fokus pada perlindungan konsumen",
        "quick_win_path": "Daftar sebagai PPMSE di Kemendag dulu, lalu ajukan sandbox OJK sambil membangun produk",
        "scraping_queries": [
            "OJK fintech regulasi izin terbaru 2024 POJK",
            "Bank Indonesia payment system regulation 2024 update",
            "fintech Indonesia legal compliance cost timeline 2024"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 2: EDUTECH
    # ══════════════════════════════════════════════════════════════════════════
    "Edutech": {
        "primary_regulator": "Kemendikbudristek + Badan Akreditasi Nasional (BAN)",
        "key_licenses": [
            "Izin Penyelenggaraan Kursus/Pelatihan — Permendikbud 81/2013 (jika ada komponen offline)",
            "Izin PKBM (Pusat Kegiatan Belajar Masyarakat) jika menerbitkan sertifikat formal",
            "Pendaftaran Platform Digital ke Kominfo — UU ITE",
            "Hak Cipta Konten — HAKI ke Kemenkumham",
            "Kemitraan Kemendikbud (opsional, tapi membuka akses ke ekosistem sekolah)"
        ],
        "compliance_requirements": [
            "Konten harus sesuai kurikulum Merdeka Belajar jika menyasar K-12",
            "Tidak boleh menjanjikan akreditasi resmi kecuali bermitra dengan institusi berakreditasi",
            "Perlindungan data anak di bawah 18 tahun — COPPA equivalent Indonesia",
            "Standar aksesibilitas konten (tidak harus tapi direkomendasikan)",
            "Jika ada transaksi: izin PPMSE dari Kemendag"
        ],
        "regulatory_risks": [
            "Tidak ada risiko regulasi besar — sektor ini relatif bebas",
            "Risiko klaim 'menyesatkan' jika menjanjikan outcome tidak terukur",
            "Hak cipta konten bisa jadi sengketa jika tidak dikelola"
        ],
        "compliance_timeline": "2-6 bulan untuk registrasi dasar; izin kursus bisa 1-3 bulan",
        "compliance_cost_estimate": "Rp10 Juta - Rp100 Juta (legal dasar, HAKI konten)",
        "regulatory_trend": "Sangat supportif — Kemendikbud aktif dorong digitalisasi pendidikan via Merdeka Belajar",
        "quick_win_path": "Mulai tanpa izin khusus (konten edukasi bebas), daftarkan PT, lalu ajukan kemitraan Kemendikbud untuk akses ke database sekolah",
        "scraping_queries": [
            "Kemendikbud edutech platform izin 2024 regulasi digital",
            "edutech Indonesia compliance requirement 2024 legal",
            "platform edukasi online Indonesia daftar kominfo 2024"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 3: HEALTHTECH
    # ══════════════════════════════════════════════════════════════════════════
    "Healthtech": {
        "primary_regulator": "Kemenkes (Kementerian Kesehatan) + BPOM + BPJS Kesehatan",
        "key_licenses": [
            "Izin Penyelenggara Sistem Elektronik Kesehatan — Permenkes 20/2019",
            "Izin Telemedicine — Permenkes 20/2019 Pasal 18-25",
            "Izin Apotek Online — BPOM jika menjual produk farmasi",
            "Izin Alat Kesehatan Digital (SaMD - Software as Medical Device) — BPOM jika ada diagnostic tools",
            "Registrasi Faskes ke BPJS jika ingin reimburse dari BPJS"
        ],
        "compliance_requirements": [
            "Dokter harus terdaftar di IDI (Ikatan Dokter Indonesia) dan STR aktif",
            "Rekam medis elektronik harus memenuhi standar keamanan data kesehatan",
            "Data pasien: tidak boleh dijual/dibagikan tanpa consent eksplisit",
            "Jika diagnosis otomatis: harus ada medical professional review mandatory",
            "Formulir informasi dan consent pasien secara digital",
            "Infrastruktur cloud wajib di Indonesia (data sovereignty)"
        ],
        "regulatory_risks": [
            "Regulasi SaMD masih berkembang — BPOM belum punya clear pathway untuk AI diagnostics",
            "Malpraktek digital — tanggung jawab hukum belum jelas antara platform dan dokter",
            "Permenkes bisa berubah — terutama pasca pandemi ada banyak revisi",
            "Integrasi BPJS sangat kompleks — butuh vendor sistem terdaftar BPJS"
        ],
        "compliance_timeline": "6-18 bulan tergantung jenis layanan; telemedicine murni lebih cepat",
        "compliance_cost_estimate": "Rp200 Juta - Rp2 Miliar (infrastruktur keamanan, legal, rekrutmen dokter)",
        "regulatory_trend": "Post-COVID: Kemenkes mendorong telemedicine, tapi regulasi SaMD masih grey area",
        "quick_win_path": "Mulai sebagai platform marketplace dokter (tanpa diagnosa AI), daftarkan ke Kemenkes, sambil build relasi dengan IDI",
        "scraping_queries": [
            "Kemenkes telemedicine regulasi izin 2024 terbaru",
            "BPOM alat kesehatan digital SaMD Indonesia 2024",
            "healthtech Indonesia compliance legal 2024 startup"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 4: E-COMMERCE & MARKETPLACE
    # ══════════════════════════════════════════════════════════════════════════
    "E-commerce & Marketplace": {
        "primary_regulator": "Kemendag + Kominfo + OJK (untuk payment)",
        "key_licenses": [
            "Izin PPMSE (Penyelenggara Perdagangan Melalui Sistem Elektronik) — Permendag 31/2023",
            "SIUP (Surat Izin Usaha Perdagangan) dari OSS/BKPM",
            "NIB (Nomor Induk Berusaha) via OSS — wajib untuk semua bisnis",
            "Izin PSE (Penyelenggara Sistem Elektronik) di Kominfo jika >5000 pengguna atau transaksi di atas threshold",
            "Jika ada payment: perlu izin payment dari BI atau partnership dengan licensed payment provider"
        ],
        "compliance_requirements": [
            "PPMSE wajib pastikan penjual memiliki NIB/SIUP yang valid",
            "Perlindungan konsumen: garansi retur, dispute resolution, escrow",
            "Produk terlarang tidak boleh dijual (BPOM, narkotika, senjata, dll)",
            "Review/rating sistem harus authentic — tidak boleh fake reviews",
            "Kewajiban pembayaran pajak marketplace: PPh 22 untuk transaksi di atas threshold"
        ],
        "regulatory_risks": [
            "Permendag 31/2023 (TikTok Shop ban) — regulasi social commerce berubah cepat",
            "Kewajiban afiliasi produk UMKM lokal — tekanan regulasi untuk local content",
            "Sengketa hak cipta produk digital — HAKI enforcement",
            "Sanksi berat jika ada produk berbahaya yang lolos filter"
        ],
        "compliance_timeline": "1-3 bulan untuk registrasi dasar (NIB + SIUP + PSE); PPMSE 2-6 bulan",
        "compliance_cost_estimate": "Rp20 Juta - Rp200 Juta (legal + infrastruktur keamanan + rekrutmen compliance)",
        "regulatory_trend": "Pemerintah aktif regulasi social commerce post-TikTok Shop; tekanan untuk lindungi UMKM lokal",
        "quick_win_path": "NIB via OSS (1 hari), daftar PSE Kominfo (2 minggu), luncurkan MVP, lalu urus PPMSE paralel",
        "scraping_queries": [
            "Kemendag PPMSE regulasi marketplace Indonesia 2024 terbaru",
            "e-commerce Indonesia legal requirement NIB OSS 2024",
            "marketplace Indonesia compliance Permendag 2024"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 5: AGRITECH
    # ══════════════════════════════════════════════════════════════════════════
    "Agritech": {
        "primary_regulator": "Kementan (Kementerian Pertanian) + BPOM (jika food) + BPN (jika land data)",
        "key_licenses": [
            "NIB + SIUP dari OSS — wajib untuk entitas bisnis",
            "Izin Usaha Perkebunan/Pertanian jika beroperasi langsung di lahan",
            "Izin SRG (Sistem Resi Gudang) dari Bappebti jika ada komponen pergudangan komoditas",
            "PIRT (Pangan Industri Rumah Tangga) dari BPOM jika memproses/menjual pangan",
            "Izin penggunaan data peta/geospatial dari BIG jika ada komponen GIS"
        ],
        "compliance_requirements": [
            "Jika jual benih: harus ada sertifikat benih dari Kementan",
            "Jika jual pupuk: izin edar dari Kementan wajib",
            "Data petani/lahan harus dijaga sesuai UU PDP (Perlindungan Data Pribadi)",
            "Kemitraan dengan Gapoktan (Gabungan Kelompok Tani) sangat direkomendasikan",
            "Jika fintech agri: butuh izin OJK atau BPOM untuk pupuk/pestisida on-credit"
        ],
        "regulatory_risks": [
            "Implikasi hukum tanah pertanian — sangat kompleks dan sensitif",
            "Regulasi ekspor komoditas bisa berubah (contoh: ban ekspor CPO 2022)",
            "Subsidi pemerintah bisa distorsi pasar dan mempersulit model bisnis berbayar",
            "TaniFund tutup 2024 — OJK memperketat fintech yang melibatkan kredit pertanian"
        ],
        "compliance_timeline": "3-6 bulan untuk izin dasar; SRG dan izin khusus bisa 6-12 bulan",
        "compliance_cost_estimate": "Rp50 Juta - Rp500 Juta tergantung scope operasi",
        "regulatory_trend": "Pemerintah dorong modernisasi pertanian (SIMOLAH, i-pubers, dll) — ada peluang kemitraan pemerintah",
        "quick_win_path": "Fokus pada platform informasi harga dan koneksi petani-pembeli (tidak butuh izin khusus), lalu scale ke layanan bernilai tambah",
        "scraping_queries": [
            "Kementan agritech platform regulasi izin 2024",
            "agritech Indonesia legal compliance startup 2024",
            "pertanian digital Indonesia regulasi pemerintah 2024"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 6: F&B
    # ══════════════════════════════════════════════════════════════════════════
    "F&B": {
        "primary_regulator": "BPOM + Dinkes + MUI + Kemendag + Dinas Pangan",
        "key_licenses": [
            "NIB dari OSS — wajib",
            "SIUP Mikro/Kecil/Menengah dari OSS",
            "PIRT (Pangan Industri Rumah Tangga) dari Dinkes — untuk produk olahan rumahan, gratis/murah",
            "MD (nomor edar BPOM) untuk produk pangan industri yang lebih besar",
            "Sertifikat Halal dari MUI/BPJPH — WAJIB per UU JPH untuk semua produk pangan mulai 2024",
            "Izin Usaha Jasa Pangan dari Dinkes Kota (untuk restoran/katering)",
            "SKU (Sertifikat Keamanan Usaha) jika di mal/pusat perbelanjaan"
        ],
        "compliance_requirements": [
            "HACCP (Hazard Analysis Critical Control Points) untuk dapur skala industri",
            "Sertifikasi SNI untuk produk tertentu (susu, minyak goreng, dll)",
            "Label produk harus memenuhi standar BPOM: bahan, tanggal kedaluwarsa, nilai gizi",
            "Halal certification WAJIB — deadline mandatory mulai Oktober 2024",
            "Jika delivery: driver harus ikuti standar food safety (suhu, packaging)",
            "Jika cloud kitchen: izin zonasi lokasi dari Pemda setempat"
        ],
        "regulatory_risks": [
            "Sertifikasi Halal BPJPH wajib mulai 2024 — biaya dan proses tidak trivial",
            "Razia BPOM reguler — produk tanpa MD atau PIRT bisa disita",
            "Regulasi zonasi bisnis makanan berbeda per kota — kompleks untuk expansion",
            "Kewajiban SNI untuk kategori produk tertentu bisa jadi barrier"
        ],
        "compliance_timeline": "PIRT: 1-3 bulan; MD BPOM: 3-12 bulan; Halal MUI/BPJPH: 3-6 bulan",
        "compliance_cost_estimate": "Rp5 Juta - Rp200 Juta (PIRT murah, MD mahal, Halal menengah)",
        "regulatory_trend": "Halal mandatory 2024 jadi game changer — semua F&B wajib sertifikasi. Cloud kitchen tren naik tapi regulasi zonasi masih abu-abu",
        "quick_win_path": "Mulai dengan PIRT (1-2 bulan, murah), luncurkan produk, sambil proses MD BPOM dan Halal secara paralel",
        "scraping_queries": [
            "BPOM PIRT MD izin pangan Indonesia 2024 cara daftar",
            "sertifikasi halal BPJPH MUI 2024 wajib F&B Indonesia",
            "izin usaha makanan minuman Indonesia 2024 startup"
        ]
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 7: SaaS & ENTERPRISE SOFTWARE
    # ══════════════════════════════════════════════════════════════════════════
    "SaaS & Enterprise Software": {
        "primary_regulator": "Kominfo + BSSN (Badan Siber dan Sandi Negara) + OJK (jika B2B ke fintech)",
        "key_licenses": [
            "NIB dari OSS",
            "PSE (Penyelenggara Sistem Elektronik) di Kominfo — wajib jika pelanggan > threshold atau layanan publik",
            "ISO 27001 Information Security Management — bukan wajib tapi jadi syarat enterprise clients",
            "SOC 2 Type II — dibutuhkan jika target klien perusahaan multinasional",
            "UU PDP Compliance Certificate — akan wajib setelah UU PDP 2022 efektif penuh 2024"
        ],
        "compliance_requirements": [
            "Daftar PSE Kominfo: wajib bagi platform digital dengan pengguna Indonesia",
            "UU PDP: privacy policy, DPO (Data Protection Officer), data retention policy",
            "Jika proses data karyawan: wajib comply dengan UU Ketenagakerjaan",
            "Jika terintegrasi pajak: butuh sertifikasi dari DJP (Ditjen Pajak) untuk akses Coretax",
            "Jika akses ke data BPJS: butuh MOU resmi dengan BPJS",
            "Kontrak SaaS Indonesia: harus memenuhi hukum kontrak Indonesia (KUHPerdata)"
        ],
        "regulatory_risks": [
            "UU PDP 2022 berlaku efektif — denda hingga 2% revenue global jika melanggar",
            "Kominfo bisa blokir platform yang tidak daftar PSE (kasus Twitter, PayPal 2022)",
            "Data lokalisasi: data WNI wajib disimpan di Indonesia sesuai PP PSTE",
            "Enterprise klien sering minta private deployment — compliance per klien kompleks"
        ],
        "compliance_timeline": "PSE Kominfo: 1-2 bulan; UU PDP compliance: 3-6 bulan; ISO 27001: 6-18 bulan",
        "compliance_cost_estimate": "Rp30 Juta - Rp500 Juta (basic compliance murah, ISO 27001 mahal)",
        "regulatory_trend": "UU PDP 2022 jadi game changer untuk semua SaaS. Pemerintah dorong digitalisasi UMKM — peluang partnership dengan program Kemenkop",
        "quick_win_path": "Daftar PSE Kominfo (gratis, 1-2 bulan), buat privacy policy UU PDP compliant, launch ke UMKM dulu (regulasi lebih ringan), scale ke enterprise setelah punya track record",
        "scraping_queries": [
            "PSE Kominfo daftar SaaS Indonesia 2024 requirement",
            "UU PDP Indonesia compliance SaaS startup 2024",
            "ISO 27001 Indonesia software enterprise requirement 2024"
        ]
    }
}

DEFAULT_CATEGORY = "E-commerce & Marketplace"

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — Regulatory Intelligence LLM
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah REGULATORY INTELLIGENCE AGENT dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
IDENTITAS & PERAN
═══════════════════════════════════════════════════════════════
Kamu adalah seorang pakar hukum bisnis dan regulatory compliance Indonesia
yang spesialisasi dalam ekosistem startup. Kamu mengetahui secara mendalam:
- Regulasi OJK, BI, BPOM, Kemenkes, Kemendikbud, Kementan, Kemendag, Kominfo
- Timeline dan biaya perizinan yang realistis di Indonesia
- Celah hukum yang bisa dimanfaatkan startup secara legal (sandbox, MVP phase)
- Risiko regulasi yang sering diabaikan founder

═══════════════════════════════════════════════════════════════
7 SIFAT PENILAIAN REGULASI (REGULATORY ASSESSMENT DIMENSIONS)
═══════════════════════════════════════════════════════════════
Setiap dari 7 dimensi ini dinilai 0-100:

1. REGULATORY_CLARITY: Seberapa jelas regulasi yang berlaku? (regulasi abu-abu = skor rendah)
2. LICENSING_ACCESSIBILITY: Seberapa mudah mendapatkan izin yang diperlukan?
3. COMPLIANCE_COST_FEASIBILITY: Apakah biaya compliance realistis untuk startup early stage?
4. REGULATORY_TIMELINE: Seberapa cepat startup bisa legal beroperasi?
5. REGULATORY_TREND: Apakah regulasi sedang membaik atau memburuk untuk kategori ini?
6. ENFORCEMENT_RISK: Seberapa besar risiko terkena tindakan regulator (razia, sanksi)?
7. GOVERNMENT_SUPPORT: Apakah ada program pemerintah yang mendukung kategori ini?

═══════════════════════════════════════════════════════════════
CARA MENGHITUNG REGULATORY_FEASIBILITY_SCORE
═══════════════════════════════════════════════════════════════
regulatory_feasibility_score = weighted average dari 7 dimensi:
- Regulatory Clarity: bobot 20%
- Licensing Accessibility: bobot 20%
- Compliance Cost Feasibility: bobot 18%
- Regulatory Timeline: bobot 17%
- Regulatory Trend: bobot 12%
- Enforcement Risk: bobot 8%
- Government Support: bobot 5%

Interpretasi:
- 75-100: Regulatory environment bersahabat — bisa launch cepat dengan risiko kecil
- 55-74: Regulasi ada tapi bisa dinavigasi — butuh legal counsel dari awal
- 35-54: Regulatory challenge signifikan — plan compliance budget besar
- 0-34: Regulatory barrier sangat tinggi — pertimbangkan ulang model bisnis

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "regulatory_dimensions": {
    "regulatory_clarity": {"score": 0, "reasoning": "penjelasan spesifik"},
    "licensing_accessibility": {"score": 0, "reasoning": "penjelasan"},
    "compliance_cost_feasibility": {"score": 0, "reasoning": "penjelasan dengan angka Rupiah"},
    "regulatory_timeline": {"score": 0, "reasoning": "timeline realistis dalam bulan"},
    "regulatory_trend": {"score": 0, "reasoning": "arah regulasi ke depan"},
    "enforcement_risk": {"score": 0, "reasoning": "tingkat risiko terkena sanksi"},
    "government_support": {"score": 0, "reasoning": "program pemerintah yang relevan"}
  },
  "regulatory_feasibility_score": 0,
  "primary_regulator": "nama regulator utama",
  "required_licenses": [
    "Izin wajib 1 — estimasi waktu X bulan — estimasi biaya Rp X",
    "Izin wajib 2 — estimasi waktu",
    "Izin wajib 3"
  ],
  "compliance_roadmap": [
    "Bulan 1-2: [langkah legal paling kritis dan cepat]",
    "Bulan 3-6: [izin utama yang harus diproses]",
    "Bulan 6-12: [izin lanjutan atau akreditasi]",
    "Ongoing: [kewajiban compliance rutin setelah dapat izin]"
  ],
  "compliance_cost_breakdown": {
    "minimum": "Rp X Juta",
    "realistic": "Rp X Juta",
    "maximum": "Rp X Miliar",
    "main_cost_drivers": ["driver biaya 1", "driver biaya 2"]
  },
  "critical_regulatory_risks": [
    "Risiko regulasi 1 yang paling kritis untuk startup ini spesifik",
    "Risiko 2"
  ],
  "quick_win_path": "Jalur tercepat untuk bisa beroperasi secara legal dalam 30-90 hari pertama",
  "regulatory_summary": "2-3 kalimat: landscape regulasi, tingkat kesulitan compliance, dan rekomendasi strategis."
}"""


class RegulatoryAgent:
    def run(self, params: dict, orchestrator_result: dict, risk_result: dict) -> dict:
        industry = params.get('industryCategory', DEFAULT_CATEGORY)

        # Match kategori ke database regulasi
        reg_key = None
        for key in CATEGORY_REGULATORY_DB:
            if key.lower() in industry.lower() or industry.lower() in key.lower():
                reg_key = key
                break
        if not reg_key:
            reg_key = DEFAULT_CATEGORY

        reg_data = CATEGORY_REGULATORY_DB[reg_key]

        # Scraping real-time untuk update regulasi terbaru
        live_reg_data = []
        for query in reg_data["scraping_queries"][:3]:
            results = safe_search(query, max_results=3)
            formatted = format_search_results(results)
            live_reg_data.append(f"Query: {query}\n{formatted}")

        live_context = "\n\n".join(live_reg_data)

        user_content = f"""═══ PARAMETER STARTUP ═══
• Kategori       : {industry}
• Sub-bidang     : {params.get('topicSubField')}
• Modal Awal     : {params.get('initialCapital')}
• Model Operasi  : {params.get('operatingModel')}
• Deskripsi      : {params.get('ideaDescription', '')}

═══ DATABASE REGULASI KATEGORI {reg_key.upper()} ═══
Regulator Utama: {reg_data['primary_regulator']}

Izin yang Diperlukan:
{chr(10).join(f'• {l}' for l in reg_data['key_licenses'])}

Persyaratan Compliance:
{chr(10).join(f'• {r}' for r in reg_data['compliance_requirements'])}

Risiko Regulasi Utama:
{chr(10).join(f'• {r}' for r in reg_data['regulatory_risks'])}

Timeline: {reg_data['compliance_timeline']}
Estimasi Biaya: {reg_data['compliance_cost_estimate']}
Tren Regulasi: {reg_data['regulatory_trend']}
Quick Win Path: {reg_data['quick_win_path']}

═══ KONTEKS RISIKO (dari Risk Agent) ═══
Risk Level: {risk_result.get('risk_level', 'N/A')}
Regulatory Risk Score: {risk_result.get('risk_breakdown', {}).get('regulatory', 50)}

═══ UPDATE REAL-TIME REGULASI ═══
{live_context}

═══ TUGAS ═══
Analisis landscape regulasi untuk startup ini berdasarkan kategori {reg_key}.
Nilai 7 dimensi regulatory dan hitung regulatory_feasibility_score.
Buat compliance roadmap yang REALISTIS untuk founder early stage.
Berikan estimasi biaya dalam Rupiah yang akurat.
Output HANYA JSON valid."""

        content, tokens = call_groq(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=3000,
        )

        try:
            clean = content
            if "<think>" in clean:
                clean = clean[clean.rfind("</think>") + 8:].strip()
            result = json.loads(clean)
        except Exception:
            match = re.search(r'\{[\s\S]*\}', content)
            result = json.loads(match.group()) if match else _fallback_regulatory(industry, reg_data)

        result["_tokens"] = tokens
        result["_category_used"] = reg_key
        return result


def _fallback_regulatory(industry, reg_data):
    return {
        "regulatory_dimensions": {
            "regulatory_clarity": {"score": 60, "reasoning": "Regulasi tersedia tapi butuh interpretasi"},
            "licensing_accessibility": {"score": 55, "reasoning": "Izin tersedia via OSS"},
            "compliance_cost_feasibility": {"score": 60, "reasoning": reg_data.get("compliance_cost_estimate", "Estimasi tersedia")},
            "regulatory_timeline": {"score": 55, "reasoning": reg_data.get("compliance_timeline", "3-12 bulan")},
            "regulatory_trend": {"score": 60, "reasoning": reg_data.get("regulatory_trend", "Berkembang")},
            "enforcement_risk": {"score": 60, "reasoning": "Perlu perhatian"},
            "government_support": {"score": 55, "reasoning": "Ada dukungan program pemerintah"}
        },
        "regulatory_feasibility_score": 58,
        "primary_regulator": reg_data.get("primary_regulator", "Kemendag + Kominfo"),
        "required_licenses": reg_data.get("key_licenses", ["NIB dari OSS — 1 hari"])[:3],
        "compliance_roadmap": [
            "Bulan 1: Daftarkan PT/CV, urus NIB via OSS",
            "Bulan 1-3: Proses izin utama sesuai kategori",
            "Bulan 3-6: Lengkapi compliance requirements",
            "Ongoing: Laporan berkala ke regulator"
        ],
        "compliance_cost_breakdown": {
            "minimum": "Rp20 Juta",
            "realistic": "Rp100 Juta",
            "maximum": "Rp500 Juta",
            "main_cost_drivers": ["Legal counsel", "Izin operasional", "Infrastruktur keamanan"]
        },
        "critical_regulatory_risks": reg_data.get("regulatory_risks", ["Regulasi bisa berubah"])[:2],
        "quick_win_path": reg_data.get("quick_win_path", "Mulai dengan NIB, scale compliance seiring pertumbuhan"),
        "regulatory_summary": f"Landscape regulasi untuk {industry} di Indonesia cukup termanage. Quick win path tersedia. Konsultasi legal counsel sejak awal sangat disarankan."
    }
