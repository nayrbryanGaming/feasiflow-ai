import type { IndustryCategory } from "./types";

// ── 7 Startup Categories (mapped to scraping matrix & regulatory DB) ─────────
export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  "Fintech",
  "Edutech",
  "Healthtech",
  "E-commerce & Marketplace",
  "Agritech",
  "F&B",
  "SaaS & Enterprise Software",
];

export const SUBTOPICS: Record<string, string[]> = {
  Fintech: ["P2P Lending", "Digital Payment", "Insurtech", "Wealth Management", "Neobank", "Crypto/Blockchain", "Open Banking"],
  Edutech: ["Bimbel Daring", "Platform MOOC", "Keterampilan Vokasi", "Bahasa Asing", "Coding Bootcamp", "EdTech B2B", "Micro-credentials"],
  Healthtech: ["Telemedicine", "Manajemen Klinik/RS", "Apotek Online", "Mental Health", "Fitness & Wellness", "Diagnostik AI", "Nutrisi & Diet"],
  "E-commerce & Marketplace": ["Marketplace Umum", "Fashion Lokal", "Produk Digital", "Social Commerce", "D2C Brand", "Grocery Online", "Niche Marketplace"],
  Agritech: ["IoT Pertanian", "Marketplace Hasil Tani", "Supply Chain Agri", "Asuransi Pertanian", "Precision Farming", "Agri-Finance", "Cold Chain"],
  "F&B": ["Restoran/Kafe", "Cloud Kitchen", "Katering", "Minuman Kekinian", "Agri-Food Processing", "FoodTech", "Healthy Food"],
  "SaaS & Enterprise Software": ["HR Management", "Akuntansi & Keuangan UMKM", "CRM", "ERP", "Logistik & Supply Chain SaaS", "Marketing Automation", "Legal Tech"],
};

export const PLATFORMS = [
  "Aplikasi Mobile (iOS/Android)",
  "Situs Web",
  "Marketplace (Tokopedia/Shopee)",
  "B2B SaaS / Dashboard",
  "WhatsApp/Telegram Bot",
  "Omnichannel (Online + Offline)",
];

export const CAPITAL_OPTIONS = [
  "< Rp 10 Juta",
  "Rp 10-50 Juta",
  "Rp 50-100 Juta",
  "Rp 100-500 Juta",
  "Rp 500 Juta - 1 Miliar",
  "> Rp 1 Miliar",
] as const;

export const READINESS_LEVELS = ["Ide", "Prototipe", "MVP", "Sudah Berjalan"] as const;

export const TEAM_EXPERTISE = [
  "Teknologi",
  "Pemasaran",
  "Keuangan",
  "Operasional",
  "Desain",
  "Domain Expert",
] as const;

export const RISK_PROFILES = ["Konservatif", "Moderat", "Agresif"] as const;

export const DYNAMIC_SCENARIOS = [
  "Penambahan Modal di Tengah Jalan",
  "Pembukaan Outlet Fisik Baru",
  "Ekspansi ke Wilayah Baru",
  "Pivot Model Bisnis",
] as const;

// ── 9 Agent Labels & Order ────────────────────────────────────────────────────
export const AGENT_LABELS: Record<string, string> = {
  orchestrator: "🧠 Orchestrator",
  bmc: "📊 Business Model Canvas",
  market_research: "📈 Market Research",
  competitor: "🔍 Competitor Analysis",
  sentiment: "💬 Sentiment & Social Intelligence",
  risk: "⚠️ Risk Analysis",
  regulatory: "⚖️ Regulatory Intelligence",
  financial: "💰 Financial Modeling",
  recommendation: "✅ Scoring & Recommendation",
};

export const AGENT_ORDER = [
  "orchestrator",
  "bmc",
  "market_research",
  "competitor",
  "sentiment",
  "risk",
  "regulatory",
  "financial",
  "recommendation",
];

// ── 7 Sifat Penilaian (Assessment Dimensions) ────────────────────────────────
export const ASSESSMENT_DIMENSIONS = [
  { key: "market", label: "Validasi Pasar", weight: 0.20, agent: "market_research", color: "blue" },
  { key: "business_model", label: "Kekuatan Model Bisnis", weight: 0.18, agent: "bmc", color: "purple" },
  { key: "risk", label: "Profil Risiko", weight: 0.17, agent: "risk", color: "orange" },
  { key: "competitive_advantage", label: "Posisi Kompetitif", weight: 0.15, agent: "competitor", color: "cyan" },
  { key: "financial_sustainability", label: "Keberlanjutan Finansial", weight: 0.12, agent: "financial", color: "green" },
  { key: "demand_validation", label: "Validasi Demand Publik", weight: 0.10, agent: "sentiment", color: "pink" },
  { key: "regulatory_feasibility", label: "Kelayakan Regulasi", weight: 0.08, agent: "regulatory", color: "yellow" },
];

// ── Scoring Interpretation ────────────────────────────────────────────────────
export const SCORE_BANDS = [
  { min: 75, max: 100, label: "LAYAK", icon: "🚀", color: "green", description: "Indikator kuat untuk melanjutkan ke eksekusi" },
  { min: 55, max: 74, label: "CUKUP LAYAK", icon: "⚡", color: "yellow", description: "Potensial ada, perbaiki area kritis terlebih dahulu" },
  { min: 0, max: 54, label: "TIDAK LAYAK", icon: "🛑", color: "red", description: "Tantangan fundamental harus diselesaikan sebelum lanjut" },
];
