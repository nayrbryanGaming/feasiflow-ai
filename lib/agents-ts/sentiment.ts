import { callGroq, parseJson } from "./config";
import { search, formatResults } from "./search";
import type { StartupParams } from "./orchestrator";

// 7 kategori × 7 metode scraping (49 konfigurasi unik)
const CATEGORY_SCRAPING_MATRIX: Record<string, Array<{
  id: string; name: string; query_template: string;
  sentiment_dimension: string; weight: number;
}>> = {
  "Fintech": [
    { id: "tw_pain", name: "Twitter Pain Point", query_template: "keluhan transfer bank Indonesia fintech app lambat", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "reddit_wtb", name: "Reddit WTB Signal", query_template: "fintech payment app Indonesia review 2024 user experience", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "gplay_rating", name: "Google Play Review", query_template: "aplikasi dompet digital Indonesia rating ulasan negatif", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "news_adoption", name: "News Adoption", query_template: "fintech Indonesia adopsi pengguna pertumbuhan 2024", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "forum_viral", name: "Forum Viral Signal", query_template: "gopay ovo dana viral promo cashback Indonesia", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "community_fb", name: "FB Community", query_template: "komunitas fintech investor Indonesia grup Facebook", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "ojk_sentiment", name: "OJK Regulatory Sentiment", query_template: "OJK regulasi fintech izin 2024 startup", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "Edutech": [
    { id: "parent_pain", name: "Parent Pain Point", query_template: "keluhan orang tua biaya les privat mahal Indonesia", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "student_wtb", name: "Student WTB", query_template: "platform belajar online Indonesia bayar premium mahasiswa", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "teacher_review", name: "Teacher App Review", query_template: "aplikasi mengajar online guru Indonesia ulasan", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "usage_freq", name: "Usage Frequency", query_template: "ruangguru zenius bimbel online Indonesia aktif pengguna 2024", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "viral_study", name: "Viral Study Content", query_template: "belajar online viral TikTok YouTube Indonesia pelajar", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "school_community", name: "School Community", query_template: "komunitas guru belajar digital Indonesia forum diskusi", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "kemdikbud", name: "Kemendikbud Policy", query_template: "Kemendikbud digitalisasi sekolah edtech regulasi 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "Healthtech": [
    { id: "patient_pain", name: "Patient Pain Point", query_template: "keluhan antri rumah sakit dokter lama Indonesia", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "health_wtb", name: "Health WTB", query_template: "telemedicine Indonesia bayar konsultasi dokter online", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "app_trust", name: "Healthcare App Trust", query_template: "alodokter halodoc kepercayaan privasi data medis Indonesia", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "usage_health", name: "Health App Usage", query_template: "aplikasi kesehatan Indonesia pengguna aktif frekuensi 2024", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "health_viral", name: "Health Viral Content", query_template: "konten kesehatan viral media sosial Indonesia awareness", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "nakes_community", name: "Nakes Community", query_template: "komunitas dokter tenaga kesehatan Indonesia forum digital", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "bpom_kemenkes", name: "BPOM/Kemenkes", query_template: "BPOM Kemenkes regulasi healthtech telemedicine izin 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "E-commerce & Marketplace": [
    { id: "buyer_pain", name: "Buyer Pain Point", query_template: "keluhan pembeli marketplace Indonesia penipuan lambat pengiriman", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "seller_wtb", name: "Seller WTB", query_template: "biaya lapak seller fee marketplace Indonesia murah", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "trust_marketplace", name: "Marketplace Trust", query_template: "kepercayaan marketplace Indonesia tokopedia shopee review scam", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "shopping_freq", name: "Shopping Frequency", query_template: "frekuensi belanja online Indonesia 2024 statistik", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "viral_promo", name: "Promo Viral", query_template: "promo 11.11 marketplace Indonesia viral deals TikTok shop", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "umkm_community", name: "UMKM Community", query_template: "komunitas UMKM jualan online Indonesia grup seller", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "kominfo_ecom", name: "Kominfo E-com Policy", query_template: "Kominfo regulasi marketplace digital Indonesia PMSE 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "Agritech": [
    { id: "farmer_pain", name: "Farmer Pain Point", query_template: "keluhan petani Indonesia harga turun distribusi masalah", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "agri_wtb", name: "Agri WTB", query_template: "petani Indonesia beli aplikasi teknologi pertanian bayar", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "agri_trust", name: "Agri App Trust", query_template: "aplikasi pertanian Indonesia kepercayaan petani review teknologi", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "agri_freq", name: "Agri Usage Frequency", query_template: "penggunaan aplikasi agritech Indonesia aktif petani 2024", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "agri_viral", name: "Agri Viral Content", query_template: "pertanian teknologi viral TikTok petani muda Indonesia sukses", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "tani_community", name: "Tani Community", query_template: "komunitas petani Indonesia online Kementan digital", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "kementan_policy", name: "Kementan Policy", query_template: "Kementan regulasi agritech teknologi pertanian izin program 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "F&B": [
    { id: "consumer_pain", name: "Consumer Food Pain", query_template: "keluhan makanan delivery mahal Indonesia gofood grabfood kualitas", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "fnb_wtb", name: "F&B WTB Signal", query_template: "konsumen Indonesia bayar makanan premium sehat langganan", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "food_trust", name: "Food Safety Trust", query_template: "kepercayaan keamanan pangan halal Indonesia BPOM review", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "food_freq", name: "Food Order Frequency", query_template: "frekuensi pesan makanan online delivery Indonesia 2024 statistik", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "food_viral", name: "Food Viral Trend", query_template: "makanan viral Indonesia TikTok food trend kuliner 2024", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "culinary_community", name: "Culinary Community", query_template: "komunitas kuliner foodie Indonesia forum resep restoran review", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "bpom_halal", name: "BPOM/MUI Halal", query_template: "BPOM sertifikasi halal MUI F&B startup makanan regulasi 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
  "SaaS & Enterprise Software": [
    { id: "it_pain", name: "IT Manager Pain", query_template: "keluhan IT manager ERP CRM software Indonesia masalah implementasi", sentiment_dimension: "urgency", weight: 0.20 },
    { id: "enterprise_wtb", name: "Enterprise WTB", query_template: "perusahaan Indonesia bayar software SaaS subscription enterprise", sentiment_dimension: "willingness_to_pay", weight: 0.18 },
    { id: "saas_trust", name: "SaaS Data Trust", query_template: "kepercayaan keamanan data cloud SaaS Indonesia enterprise review", sentiment_dimension: "trust_deficit", weight: 0.17 },
    { id: "saas_adoption", name: "SaaS Adoption Rate", query_template: "adopsi SaaS cloud Indonesia perusahaan 2024 statistik pengguna", sentiment_dimension: "frequency", weight: 0.16 },
    { id: "saas_viral", name: "SaaS Viral B2B", query_template: "software bisnis viral LinkedIn Indonesia startup B2B growth", sentiment_dimension: "viral_potential", weight: 0.13 },
    { id: "dev_community", name: "Developer Community", query_template: "komunitas developer programmer Indonesia software GitHub LinkedIn", sentiment_dimension: "community_strength", weight: 0.10 },
    { id: "kominfo_cloud", name: "Kominfo Cloud Policy", query_template: "Kominfo regulasi cloud SaaS Indonesia PDN data center 2024", sentiment_dimension: "regulatory_acceptance", weight: 0.06 },
  ],
};

const SYSTEM_PROMPT = `Anda adalah Sentiment & Social Intelligence Agent AI untuk startup Indonesia.
Analisis sentimen publik berdasarkan 7 dimensi: urgency, frequency, willingness_to_pay, trust_deficit,
viral_potential, community_strength, regulatory_acceptance.
Berikan validated_demand_score (0-100) sebagai bobot 10% dari skor final.
Output JSON dengan keys: validated_demand_score, sentiment_breakdown (object dengan 7 dimensi),
overall_sentiment, social_proof_indicators (array), demand_signals (array),
negative_signals (array), sentiment_trend, scraping_methods_used (array).`;

export async function runSentiment(
  params: StartupParams,
  orchestratorMission: string
): Promise<Record<string, unknown>> {
  // Cari methods untuk kategori ini, fallback ke Fintech
  const normalizedCat = params.industry_category.trim();
  const methods = CATEGORY_SCRAPING_MATRIX[normalizedCat]
    ?? CATEGORY_SCRAPING_MATRIX["Fintech"];

  // Ambil 3 queries teratas berdasarkan weight
  const topMethods = methods.sort((a, b) => b.weight - a.weight).slice(0, 3);
  const queries = topMethods.map(m =>
    m.query_template.replace("{startup_name}", params.startup_name)
  );

  const searchResults = await Promise.all(queries.map((q) => search(q, 3)));
  const combinedSearch = searchResults
    .map((res, i) => `[${topMethods[i].name}/${topMethods[i].sentiment_dimension}]\n${formatResults(res)}`)
    .join("\n\n---\n\n");

  const methodsList = methods.map(m =>
    `- ${m.name} (${m.sentiment_dimension}, w=${m.weight}): "${m.query_template}"`
  ).join("\n");

  const userMsg = `Analisis sentimen publik untuk ${params.startup_name} (${params.industry_category}):

Mission: ${orchestratorMission}
Produk: ${params.product_description}
Target: ${params.target_market}

=== 7 Metode Scraping untuk Kategori ${params.industry_category} ===
${methodsList}

=== Data Pencarian Real-time (Top 3 Methods) ===
${combinedSearch}

Analisis 7 dimensi sentimen dan berikan validated_demand_score (0-100).
Tinggi = permintaan publik kuat, rendah = belum ada kebutuhan nyata.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.5, maxTokens: 3072 });

  return parseJson(content);
}
