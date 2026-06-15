import json
import re
from agents.config import call_groq
from agents.tools import safe_search, format_search_results

# =============================================================================
# SENTIMENT & SOCIAL INTELLIGENCE AGENT — Custom Skill v1.0
# Agent ke-5 dalam pipeline 9-agen FeasiFlow AI
#
# ARSITEKTUR KHUSUS:
# - 7 startup kategori × 7 metode scraping berbeda
# - Setiap kategori punya target scraping, query template, dan
#   dimensi sentimen yang spesifik
# - Output: validated_demand_score, public_sentiment_score, pain_point_evidence
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# 7 KATEGORI × 7 METODE SCRAPING
# Setiap entry: [query_template, sumber_data, dimensi_sentimen]
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_SCRAPING_MATRIX = {

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 1: FINTECH
    # Fokus: kepercayaan pengguna, keluhan fraud, adopsi digital payment
    # ══════════════════════════════════════════════════════════════════════════
    "Fintech": {
        "methods": [
            {
                "id": "fintech_app_reviews",
                "name": "Scraping Review Aplikasi Fintech",
                "query": "{topic} aplikasi Indonesia review pengguna bintang rating ulasan",
                "sentiment_dimension": "user_trust",
                "weight": 0.20,
                "description": "Analisis rating dan ulasan pengguna pada aplikasi fintech kompetitor di Indonesia"
            },
            {
                "id": "fintech_complaint_analysis",
                "name": "Analisis Keluhan & Penipuan",
                "query": "{topic} Indonesia penipuan scam masalah keluhan pengguna 2024",
                "sentiment_dimension": "trust_deficit",
                "weight": 0.18,
                "description": "Mengidentifikasi pain points dan keluhan nyata pengguna fintech Indonesia"
            },
            {
                "id": "fintech_news_sentiment",
                "name": "Sentimen Berita Fintech Indonesia",
                "query": "{topic} Indonesia berita terbaru 2024 pertumbuhan regulasi OJK",
                "sentiment_dimension": "industry_sentiment",
                "weight": 0.15,
                "description": "Sentimen media terhadap industri fintech dari Bisnis.com, Kontan, CNBC Indonesia"
            },
            {
                "id": "fintech_social_discussion",
                "name": "Diskusi Komunitas Keuangan",
                "query": "{topic} Indonesia forum diskusi Reddit Twitter pinjaman investasi 2024",
                "sentiment_dimension": "community_adoption",
                "weight": 0.15,
                "description": "Sentimen diskusi komunitas online tentang layanan keuangan digital"
            },
            {
                "id": "fintech_funding_signal",
                "name": "Sinyal Pendanaan & Investor",
                "query": "{topic} startup Indonesia funding investment 2023 2024 series",
                "sentiment_dimension": "investor_confidence",
                "weight": 0.17,
                "description": "Kepercayaan investor terhadap segmen ini dari data pendanaan terkini"
            },
            {
                "id": "fintech_unbanked_demand",
                "name": "Validasi Demand Populasi Unbanked",
                "query": "unbanked Indonesia UMKM akses keuangan digital kebutuhan 2024",
                "sentiment_dimension": "demand_validation",
                "weight": 0.15,
                "description": "Validasi demand dari populasi yang belum terlayani perbankan konvensional"
            },
            {
                "id": "fintech_regulatory_pulse",
                "name": "Pulse Regulasi OJK",
                "query": "OJK fintech regulasi izin 2024 kebijakan terbaru sandbox",
                "sentiment_dimension": "regulatory_environment",
                "weight": 0.15,
                "description": "Arah regulasi OJK dan dampaknya pada startup fintech baru"
            }
        ],
        "assessment_profile": "Kepercayaan (trust) adalah faktor sentimen dominan di fintech. Pain point utama: biaya tinggi, proses lambat, fraud. Peluang: underserved UMKM dan unbanked."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 2: EDUTECH
    # Fokus: outcome belajar, keterjangkauan, keterlibatan orang tua-siswa
    # ══════════════════════════════════════════════════════════════════════════
    "Edutech": {
        "methods": [
            {
                "id": "edutech_app_ratings",
                "name": "Rating Aplikasi Belajar",
                "query": "{topic} aplikasi belajar Indonesia Play Store rating ulasan orang tua siswa",
                "sentiment_dimension": "learning_effectiveness",
                "weight": 0.20,
                "description": "Rating dan ulasan aplikasi edukasi yang sudah ada — mengidentifikasi gap kualitas"
            },
            {
                "id": "edutech_parent_sentiment",
                "name": "Sentimen Orang Tua & Guru",
                "query": "{topic} Indonesia orang tua guru pendapat pengalaman bimbel online 2024",
                "sentiment_dimension": "stakeholder_trust",
                "weight": 0.18,
                "description": "Sentimen dari decision maker utama (orang tua) tentang edukasi online"
            },
            {
                "id": "edutech_outcome_discussion",
                "name": "Diskusi Hasil Belajar",
                "query": "bimbel online Indonesia efektif hasil nilai ujian SNBT UTBK 2024",
                "sentiment_dimension": "outcome_validation",
                "weight": 0.16,
                "description": "Validasi bahwa edukasi online menghasilkan outcome yang nyata dan terukur"
            },
            {
                "id": "edutech_affordability",
                "name": "Persepsi Keterjangkauan Harga",
                "query": "{topic} Indonesia harga mahal murah terjangkau biaya langganan review",
                "sentiment_dimension": "price_sensitivity",
                "weight": 0.15,
                "description": "Sensitivitas harga dan persepsi value-for-money dari segmen target"
            },
            {
                "id": "edutech_gov_support",
                "name": "Sinyal Dukungan Pemerintah",
                "query": "Kemendikbud edutech digital learning Indonesia program 2024",
                "sentiment_dimension": "policy_support",
                "weight": 0.15,
                "description": "Arah kebijakan Kemendikbud dan program digitalisasi pendidikan"
            },
            {
                "id": "edutech_competition_saturation",
                "name": "Saturasi Kompetisi Ruangguru Zenius",
                "query": "Ruangguru Zenius Quipper Indonesia pengguna 2024 berhenti tutup bangkrut",
                "sentiment_dimension": "market_saturation",
                "weight": 0.16,
                "description": "Sinyal saturasi pasar dari perkembangan pemain incumbent"
            },
            {
                "id": "edutech_student_voice",
                "name": "Suara Siswa di Media Sosial",
                "query": "{topic} Indonesia TikTok Instagram siswa belajar online 2024 viral",
                "sentiment_dimension": "student_engagement",
                "weight": 0.16,
                "description": "Engagement organik siswa terhadap konten edukasi digital di media sosial"
            }
        ],
        "assessment_profile": "Outcome belajar yang terbuktikan adalah driver sentimen utama edutech. Pain point: harga mahal incumbent (Ruangguru), konten tidak relevan UN/SNBT. Peluang: daerah non-Jawa, vocational training."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 3: HEALTHTECH
    # Fokus: kepercayaan medis, aksesibilitas, validasi klinis
    # ══════════════════════════════════════════════════════════════════════════
    "Healthtech": {
        "methods": [
            {
                "id": "healthtech_telemedicine_review",
                "name": "Review Telemedicine Existing",
                "query": "{topic} Indonesia review dokter pasien Halodoc Alodokter Good Doctor 2024",
                "sentiment_dimension": "clinical_trust",
                "weight": 0.22,
                "description": "Kepercayaan pasien terhadap layanan kesehatan digital yang sudah ada"
            },
            {
                "id": "healthtech_accessibility",
                "name": "Pain Point Akses Kesehatan",
                "query": "akses layanan kesehatan Indonesia susah mahal antri puskesmas 2024",
                "sentiment_dimension": "access_gap",
                "weight": 0.18,
                "description": "Validasi masalah akses kesehatan yang nyata dirasakan masyarakat Indonesia"
            },
            {
                "id": "healthtech_bpom_sentiment",
                "name": "Sentiment BPOM & Regulasi Kesehatan",
                "query": "BPOM Kemenkes izin alat kesehatan digital aplikasi 2024 regulasi",
                "sentiment_dimension": "regulatory_clarity",
                "weight": 0.18,
                "description": "Kejelasan regulasi BPOM/Kemenkes untuk produk healthtech digital"
            },
            {
                "id": "healthtech_professional_opinion",
                "name": "Opini Tenaga Medis",
                "query": "dokter IDI telemedicine Indonesia pendapat profesional medis digital 2024",
                "sentiment_dimension": "professional_acceptance",
                "weight": 0.15,
                "description": "Penerimaan dan kepercayaan tenaga medis terhadap digitalisasi layanan kesehatan"
            },
            {
                "id": "healthtech_patient_forum",
                "name": "Forum Pasien & Keluarga",
                "query": "{topic} Indonesia forum pasien pengalaman biaya obat dokter online",
                "sentiment_dimension": "patient_experience",
                "weight": 0.13,
                "description": "Pengalaman pasien nyata dari forum diskusi penyakit dan layanan kesehatan"
            },
            {
                "id": "healthtech_bpjs_integration",
                "name": "Integrasi BPJS & Asuransi",
                "query": "BPJS kesehatan digital Indonesia integrasi aplikasi healthtech 2024",
                "sentiment_dimension": "insurance_integration",
                "weight": 0.14,
                "description": "Peluang dan tantangan integrasi dengan sistem BPJS sebagai payment gateway kesehatan"
            },
            {
                "id": "healthtech_investor_thesis",
                "name": "Thesis Investor Healthtech Indonesia",
                "query": "healthtech Indonesia investment funding 2024 seri A B VC startup",
                "sentiment_dimension": "investment_signal",
                "weight": 0.14,
                "description": "Sinyal kepercayaan investor terhadap sektor healthtech Indonesia terkini"
            }
        ],
        "assessment_profile": "Trust medis adalah barrier terbesar healthtech. Regulasi BPOM/Kemenkes bisa jadi enabler atau barrier. Pain point: biaya tinggi, jarak ke fasilitas, waktu tunggu panjang."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 4: E-COMMERCE & MARKETPLACE
    # Fokus: seller-buyer ecosystem, trust transaksi, kepuasan logistik
    # ══════════════════════════════════════════════════════════════════════════
    "E-commerce & Marketplace": {
        "methods": [
            {
                "id": "ecommerce_category_demand",
                "name": "Demand Kategori Produk Spesifik",
                "query": "{topic} Indonesia Tokopedia Shopee kategori terlaris trending 2024",
                "sentiment_dimension": "category_demand",
                "weight": 0.20,
                "description": "Analisis kategori produk yang paling banyak dicari dan dibeli di marketplace Indonesia"
            },
            {
                "id": "ecommerce_seller_pain",
                "name": "Keluhan Penjual (Seller Pain Point)",
                "query": "seller penjual Indonesia Tokopedia Shopee masalah keluhan komisi susah 2024",
                "sentiment_dimension": "seller_friction",
                "weight": 0.18,
                "description": "Pain points penjual di marketplace existing — peluang diferensiasi untuk pemain baru"
            },
            {
                "id": "ecommerce_buyer_trust",
                "name": "Kepercayaan Pembeli & Fraud",
                "query": "penipuan jual beli online Indonesia scam marketplace tips aman 2024",
                "sentiment_dimension": "buyer_trust",
                "weight": 0.15,
                "description": "Tingkat kepercayaan dan ketakutan pembeli terhadap transaksi e-commerce Indonesia"
            },
            {
                "id": "ecommerce_logistic_sentiment",
                "name": "Sentimen Pengiriman & Logistik",
                "query": "pengiriman ekspedisi Indonesia masalah lama rusak JNT JNE keluhan 2024",
                "sentiment_dimension": "logistics_satisfaction",
                "weight": 0.15,
                "description": "Kepuasan terhadap ekosistem logistik yang mendukung e-commerce Indonesia"
            },
            {
                "id": "ecommerce_social_commerce",
                "name": "Tren Social Commerce TikTok Shop",
                "query": "TikTok Shop Instagram live selling Indonesia tren 2024 penjualan",
                "sentiment_dimension": "social_commerce_trend",
                "weight": 0.17,
                "description": "Tren social commerce yang mengubah lanskap e-commerce tradisional Indonesia"
            },
            {
                "id": "ecommerce_niche_opportunity",
                "name": "Peluang Niche Marketplace",
                "query": "{topic} Indonesia niche marketplace khusus produk lokal artisan UMKM peluang",
                "sentiment_dimension": "niche_demand",
                "weight": 0.15,
                "description": "Identifikasi permintaan untuk marketplace niche yang belum terlayani incumbent"
            },
            {
                "id": "ecommerce_payment_adoption",
                "name": "Adopsi Metode Pembayaran",
                "query": "QRIS transfer bank COD Indonesia preferensi pembayaran online 2024",
                "sentiment_dimension": "payment_readiness",
                "weight": 0.15,
                "description": "Kesiapan ekosistem pembayaran digital yang mendukung pertumbuhan e-commerce"
            }
        ],
        "assessment_profile": "E-commerce sangat kompetitif di Indonesia. Peluang ada di niche marketplace, social commerce, dan segmen yang kurang dilayani Tokopedia/Shopee. Pain point: biaya komisi tinggi, logistik last-mile."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 5: AGRITECH
    # Fokus: adopsi petani, rantai pasok, akses pasar
    # ══════════════════════════════════════════════════════════════════════════
    "Agritech": {
        "methods": [
            {
                "id": "agritech_farmer_adoption",
                "name": "Sentimen Adopsi Petani",
                "query": "petani Indonesia aplikasi teknologi pertanian susah adopsi hambatan 2024",
                "sentiment_dimension": "farmer_adoption",
                "weight": 0.22,
                "description": "Hambatan nyata yang dialami petani Indonesia dalam mengadopsi teknologi agritech"
            },
            {
                "id": "agritech_supply_chain",
                "name": "Masalah Rantai Pasok Pertanian",
                "query": "rantai pasok pertanian Indonesia masalah tengkulak harga murah petani 2024",
                "sentiment_dimension": "supply_chain_pain",
                "weight": 0.20,
                "description": "Pain point rantai pasok: petani jual murah, konsumen beli mahal — validasi problem space"
            },
            {
                "id": "agritech_kementan_policy",
                "name": "Kebijakan Kementan & Subsidi",
                "query": "Kementan subsidi pertanian digital agritech Indonesia program 2024",
                "sentiment_dimension": "government_support",
                "weight": 0.16,
                "description": "Program pemerintah yang bisa menjadi enabler atau dukungan untuk agritech"
            },
            {
                "id": "agritech_market_price",
                "name": "Volatilitas Harga Komoditas",
                "query": "harga komoditas pertanian Indonesia padi cabai bawang fluktuasi 2024",
                "sentiment_dimension": "price_volatility_risk",
                "weight": 0.14,
                "description": "Risiko volatilitas harga komoditas yang mempengaruhi model bisnis agritech"
            },
            {
                "id": "agritech_existing_solution",
                "name": "Review Solusi Agritech Existing",
                "query": "TaniHub Sayurbox agritech Indonesia review masalah tutup bangkrut 2024",
                "sentiment_dimension": "solution_gap",
                "weight": 0.16,
                "description": "Pelajaran dari kegagalan/kesuksesan agritech yang sudah ada (TaniHub, TaniFund)"
            },
            {
                "id": "agritech_digital_literacy",
                "name": "Literasi Digital Petani",
                "query": "petani Indonesia smartphone internet literasi digital kemampuan teknologi",
                "sentiment_dimension": "digital_readiness",
                "weight": 0.12,
                "description": "Kesiapan digital target pengguna (petani) — kriteria adopsi yang realistis"
            },
            {
                "id": "agritech_investor_cautious",
                "name": "Sinyal Investor Pasca TaniHub",
                "query": "agritech Indonesia investment 2024 investor startup pertanian funding",
                "sentiment_dimension": "investor_sentiment",
                "weight": 0.12,
                "description": "Kepercayaan investor setelah kegagalan agritech major — apakah space masih menarik"
            }
        ],
        "assessment_profile": "Agritech punya problem space nyata tapi eksekusi sangat sulit. TaniFund dan TaniHub gagal karena over-expansion dan fraud. Kunci: fokus satu komoditas, satu geografi, satu masalah spesifik."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 6: F&B (FOOD & BEVERAGE)
    # Fokus: pengalaman konsumen, lokasi, tren kuliner, unit economics
    # ══════════════════════════════════════════════════════════════════════════
    "F&B": {
        "methods": [
            {
                "id": "fnb_gofood_grabfood_sentiment",
                "name": "Sentimen GoFood & GrabFood",
                "query": "{topic} makanan Indonesia GoFood GrabFood rating ulasan review 2024",
                "sentiment_dimension": "food_delivery_demand",
                "weight": 0.22,
                "description": "Demand dan kepuasan konsumen via platform food delivery terbesar Indonesia"
            },
            {
                "id": "fnb_google_maps_review",
                "name": "Review Google Maps & Lokasi",
                "query": "{topic} kuliner Indonesia Google Maps rating bintang lokasi terbaik 2024",
                "sentiment_dimension": "location_viability",
                "weight": 0.18,
                "description": "Sentimen berbasis lokasi: popularitas, traffic, dan keterjangkauan area target"
            },
            {
                "id": "fnb_instagram_food_trend",
                "name": "Tren Kuliner Instagram & TikTok",
                "query": "{topic} makanan Indonesia viral Instagram TikTok food trend 2024",
                "sentiment_dimension": "viral_potential",
                "weight": 0.16,
                "description": "Potensi viral dan tren kuliner yang sedang naik daun di media sosial Indonesia"
            },
            {
                "id": "fnb_food_blogger_sentiment",
                "name": "Sentimen Food Blogger & Influencer",
                "query": "{topic} kuliner Indonesia food blogger review rekomendasi influencer",
                "sentiment_dimension": "influencer_endorsement",
                "weight": 0.13,
                "description": "Liputan dan rekomendasi food blogger yang memengaruhi keputusan pembelian"
            },
            {
                "id": "fnb_unit_economics_benchmark",
                "name": "Benchmark Unit Economics F&B",
                "query": "food business Indonesia omset keuntungan modal modal balik franchise 2024",
                "sentiment_dimension": "financial_benchmark",
                "weight": 0.15,
                "description": "Benchmark profitabilitas dan unit economics bisnis F&B Indonesia yang realistis"
            },
            {
                "id": "fnb_halal_certification",
                "name": "Sentimen Sertifikasi Halal",
                "query": "halal sertifikasi MUI makanan Indonesia konsumen preferensi 2024",
                "sentiment_dimension": "halal_compliance",
                "weight": 0.08,
                "description": "Pentingnya sertifikasi halal bagi segmen pasar mayoritas Muslim Indonesia"
            },
            {
                "id": "fnb_delivery_behavior",
                "name": "Perilaku Pesan Antar Konsumen",
                "query": "pesan antar makanan Indonesia perilaku konsumen frekuensi belanja online 2024",
                "sentiment_dimension": "delivery_demand",
                "weight": 0.08,
                "description": "Frekuensi dan preferensi pesan antar yang mendorong demand delivery F&B"
            }
        ],
        "assessment_profile": "F&B sangat hyperlocal. Validasi harus berbasis lokasi spesifik, bukan nasional. Tren viral penting untuk akuisisi awal. Unit economics ketat — margin 10-25% untuk restoran fisik."
    },

    # ══════════════════════════════════════════════════════════════════════════
    # KATEGORI 7: SaaS & ENTERPRISE SOFTWARE
    # Fokus: adopsi enterprise, ROI, integrasi dengan sistem existing
    # ══════════════════════════════════════════════════════════════════════════
    "SaaS & Enterprise Software": {
        "methods": [
            {
                "id": "saas_b2b_pain_point",
                "name": "Pain Point Bisnis Indonesia",
                "query": "{topic} software Indonesia bisnis masalah efisiensi HR payroll ERP 2024",
                "sentiment_dimension": "enterprise_pain",
                "weight": 0.22,
                "description": "Pain point nyata bisnis Indonesia yang dicari solusinya: HR, finance, operasional"
            },
            {
                "id": "saas_sme_adoption",
                "name": "Adopsi Software UMKM Indonesia",
                "query": "software UMKM Indonesia adopsi digital akuntansi kasir POS 2024",
                "sentiment_dimension": "sme_readiness",
                "weight": 0.18,
                "description": "Kesiapan dan hambatan UMKM Indonesia dalam mengadopsi software bisnis"
            },
            {
                "id": "saas_competitor_gaps",
                "name": "Gap Solusi SaaS Existing",
                "query": "{topic} software Indonesia kekurangan fitur review G2 Capterra lokal 2024",
                "sentiment_dimension": "feature_gap",
                "weight": 0.16,
                "description": "Fitur atau aspek yang kurang dari solusi SaaS existing di pasar Indonesia"
            },
            {
                "id": "saas_localization_need",
                "name": "Kebutuhan Lokalisasi",
                "query": "software Indonesia bahasa lokal perpajakan regulasi BPJS Coretax integrasi 2024",
                "sentiment_dimension": "localization_demand",
                "weight": 0.15,
                "description": "Kebutuhan lokalisasi: bahasa, integrasi pajak Indonesia, BPJS, DJP Online"
            },
            {
                "id": "saas_pricing_willingness",
                "name": "Willingness to Pay Enterprise",
                "query": "software bisnis Indonesia harga berapa bayar SaaS subscription enterprise UMKM",
                "sentiment_dimension": "price_acceptance",
                "weight": 0.14,
                "description": "Kesanggupan dan kebiasaan bayar software di Indonesia — monthly vs annual vs selamanya"
            },
            {
                "id": "saas_digital_transformation",
                "name": "Sinyal Transformasi Digital",
                "query": "transformasi digital Indonesia perusahaan 2024 adopsi cloud SaaS",
                "sentiment_dimension": "digital_transformation_pace",
                "weight": 0.08,
                "description": "Kecepatan transformasi digital perusahaan Indonesia sebagai proxy adopsi SaaS"
            },
            {
                "id": "saas_sales_cycle_signal",
                "name": "Sinyal Panjang Sales Cycle B2B",
                "query": "B2B software Indonesia sales cycle keputusan pembelian enterprise panjang",
                "sentiment_dimension": "sales_complexity",
                "weight": 0.07,
                "description": "Estimasi kompleksitas sales cycle B2B Indonesia — berdampak langsung ke runway"
            }
        ],
        "assessment_profile": "SaaS Indonesia butuh lokalisasi kuat. WTP rendah untuk SME (~Rp200-500K/bln), lebih tinggi untuk enterprise. Sales cycle B2B panjang (3-12 bulan) — perlu modal lebih."
    }
}

# Kategori default jika tidak match
DEFAULT_CATEGORY = "E-commerce & Marketplace"

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — Sentiment Analysis LLM
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah SENTIMENT & SOCIAL INTELLIGENCE AGENT dalam sistem FeasiFlow AI.

═══════════════════════════════════════════════════════════════
PERAN & METODOLOGI
═══════════════════════════════════════════════════════════════
Kamu menganalisis data sentimen publik dari 7 sumber scraping berbeda untuk
memvalidasi apakah pain point yang dipecahkan startup ini NYATA dan dirasakan
oleh target pasar Indonesia.

Pendekatan analisismu:
1. Baca hasil scraping dari 7 query berbeda (masing-masing dengan fokus berbeda)
2. Identifikasi bukti KUANTITATIF (angka, persentase, rating)
3. Identifikasi bukti KUALITATIF (pola keluhan, tren diskusi, tipe pengguna)
4. Hitung validated_demand_score berdasarkan konvergensi bukti
5. Identifikasi pain points yang paling konsisten muncul

═══════════════════════════════════════════════════════════════
7 SIFAT PENILAIAN SENTIMEN
═══════════════════════════════════════════════════════════════
1. URGENCY: Seberapa mendesak masalah ini dirasakan pengguna? (0-100)
2. FREQUENCY: Seberapa sering masalah ini dibicarakan? (0-100)
3. WILLINGNESS_TO_PAY: Apakah ada sinyal orang mau bayar untuk solusi? (0-100)
4. TRUST_DEFICIT: Seberapa besar distrust terhadap solusi existing? (0-100)
5. VIRAL_POTENTIAL: Seberapa besar potensi word-of-mouth & viral? (0-100)
6. COMMUNITY_STRENGTH: Seberapa kuat komunitas pengguna yang ada? (0-100)
7. REGULATORY_ACCEPTANCE: Seberapa diterima secara sosial-regulasi? (0-100)

═══════════════════════════════════════════════════════════════
CARA MENGHITUNG VALIDATED_DEMAND_SCORE
═══════════════════════════════════════════════════════════════
validated_demand_score = weighted average dari 7 dimensi sentimen
Gunakan bobot setiap metode scraping dari kategori yang diberikan.

Interpretasi:
- 75-100: Demand terbukti kuat, pain point nyata dan luas dirasakan
- 55-74: Demand ada tapi perlu lebih banyak validasi primer
- 35-54: Sinyal lemah, pain point mungkin tidak se-universal yang diasumsikan
- 0-34: Tidak ada evidence demand yang kuat

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT JSON WAJIB
═══════════════════════════════════════════════════════════════
{
  "sentiment_dimensions": {
    "urgency": {"score": 0, "evidence": "bukti spesifik dari scraping"},
    "frequency": {"score": 0, "evidence": "bukti"},
    "willingness_to_pay": {"score": 0, "evidence": "bukti"},
    "trust_deficit": {"score": 0, "evidence": "sinyal ketidakpuasan terhadap solusi existing"},
    "viral_potential": {"score": 0, "evidence": "bukti tren viral atau word-of-mouth"},
    "community_strength": {"score": 0, "evidence": "ukuran dan keaktifan komunitas"},
    "regulatory_acceptance": {"score": 0, "evidence": "bukti penerimaan sosial-regulasi"}
  },
  "validated_demand_score": 0,
  "pain_point_evidence": [
    "Bukti pain point 1 yang paling kuat dan konsisten dari scraping",
    "Bukti pain point 2",
    "Bukti pain point 3"
  ],
  "positive_signals": [
    "Sinyal positif 1 tentang demand atau opportunity",
    "Sinyal positif 2"
  ],
  "negative_signals": [
    "Sinyal negatif 1 yang perlu diperhatikan",
    "Sinyal negatif 2 jika ada"
  ],
  "key_insight": "Insight paling penting yang membedakan analisis sentimen ini dari analisis pasar biasa",
  "target_community": "Deskripsi komunitas pengguna yang paling vokal dan berpotensi jadi early adopter",
  "sentiment_summary": "2-3 kalimat: kondisi sentimen publik, bukti demand nyata, dan implikasi untuk startup ini"
}"""


class SentimentAgent:
    def run(self, params: dict, orchestrator_result: dict) -> dict:
        industry = params.get('industryCategory', DEFAULT_CATEGORY)
        topic = params.get('topicSubField', industry)

        # Pilih matrix scraping berdasarkan kategori
        category_key = None
        for key in CATEGORY_SCRAPING_MATRIX:
            if key.lower() in industry.lower() or industry.lower() in key.lower():
                category_key = key
                break
        if not category_key:
            category_key = DEFAULT_CATEGORY

        scraping_config = CATEGORY_SCRAPING_MATRIX[category_key]
        assessment_profile = scraping_config["assessment_profile"]
        methods = scraping_config["methods"]

        # Jalankan 7 scraping queries sesuai kategori
        search_results = []
        for method in methods:
            query = method["query"].format(topic=topic, industry=industry)
            results = safe_search(query, max_results=3)
            search_results.append({
                "method_id": method["id"],
                "method_name": method["name"],
                "sentiment_dimension": method["sentiment_dimension"],
                "weight": method["weight"],
                "query": query,
                "results": format_search_results(results)
            })

        # Compile scraping context
        scraping_context = "\n\n".join([
            f"[{sr['method_name']}] (Dimensi: {sr['sentiment_dimension']}, Bobot: {sr['weight']})\n"
            f"Query: {sr['query']}\n"
            f"Data:\n{sr['results']}"
            for sr in search_results
        ])

        user_content = f"""═══ PARAMETER STARTUP ═══
• Kategori           : {industry}
• Sub-bidang         : {topic}
• Model Operasi      : {params.get('operatingModel')}
• Target Lokasi      : {params.get('location', 'Nasional')}
• Deskripsi          : {params.get('ideaDescription', '')}

═══ PROFIL ASSESSMENT KATEGORI {industry.upper()} ═══
{assessment_profile}

═══ KONTEKS ORCHESTRATOR ═══
{orchestrator_result.get('startup_summary', '')}

═══ HASIL 7 SCRAPING REAL-TIME ═══
{scraping_context}

═══ TUGAS ═══
Analisis SEMUA hasil scraping di atas untuk memvalidasi demand nyata.
Nilai 7 dimensi sentimen berdasarkan evidence dari data.
Hitung validated_demand_score sebagai weighted average dimensi tersebut.
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
            result = json.loads(match.group()) if match else _fallback_sentiment(topic)

        result["_tokens"] = tokens
        result["_category_used"] = category_key
        result["_methods_count"] = len(methods)
        return result


def _fallback_sentiment(topic):
    return {
        "sentiment_dimensions": {
            "urgency": {"score": 55, "evidence": "Data tidak tersedia — estimasi sedang"},
            "frequency": {"score": 50, "evidence": "Perlu validasi primer"},
            "willingness_to_pay": {"score": 45, "evidence": "Belum ada signal yang jelas"},
            "trust_deficit": {"score": 60, "evidence": "Ada ketidakpuasan terhadap solusi existing"},
            "viral_potential": {"score": 40, "evidence": "Potensi sedang"},
            "community_strength": {"score": 45, "evidence": "Komunitas ada tapi belum terukur"},
            "regulatory_acceptance": {"score": 65, "evidence": "Tidak ada hambatan sosial yang signifikan"}
        },
        "validated_demand_score": 52,
        "pain_point_evidence": [f"Problem space {topic} relevan tapi perlu validasi lebih dalam"],
        "positive_signals": ["Ada potensi demand berdasarkan tren industri"],
        "negative_signals": ["Data tidak cukup untuk kesimpulan kuat"],
        "key_insight": "Validasi primer dengan customer interviews sangat disarankan",
        "target_community": "Pengguna aktif di segmen ini",
        "sentiment_summary": f"Sentimen terhadap {topic} menunjukkan potensi sedang. Validasi primer diperlukan untuk konfirmasi."
    }
