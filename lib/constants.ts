import type { IndustryCategory } from "./types";

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  "Fintech", "Edutech", "E-commerce", "Agritech",
  "Healthtech", "F&B", "Logistik", "SaaS",
  "Properti", "Hiburan", "Manufaktur", "Jasa Profesional",
];

export const SUBTOPICS: Record<string, string[]> = {
  Fintech: ["P2P Lending", "Digital Payment", "Insurtech", "Wealth Management", "Neobank", "Crypto/Blockchain"],
  Edutech: ["Bimbel Daring", "Platform MOOC", "Keterampilan Vokasi", "Bahasa Asing", "Coding Bootcamp", "EdTech B2B"],
  "E-commerce": ["Marketplace Umum", "Fashion Lokal", "Produk Digital", "Social Commerce", "D2C Brand", "Grocery Online"],
  Agritech: ["IoT Pertanian", "Marketplace Hasil Tani", "Supply Chain Agri", "Asuransi Pertanian", "Precision Farming"],
  Healthtech: ["Telemedicine", "Manajemen RS", "Apotik Online", "Mental Health", "Fitness & Wellness", "Diagnostik AI"],
  "F&B": ["Restoran/Kafe", "Cloud Kitchen", "Katering", "Minuman Kekinian", "Agri-Food Processing", "FoodTech"],
  Logistik: ["Last-mile Delivery", "Freight Marketplace", "Warehouse Management", "Cold Chain", "Fleet Management"],
  SaaS: ["HR Management", "Akuntansi UMKM", "CRM", "Project Management", "Marketing Automation", "ERP"],
  Properti: ["PropTech Marketplace", "Co-working Space", "Manajemen Kost", "Smart Building", "Real Estate Investment"],
  Hiburan: ["Game Mobile", "Streaming Konten", "Event Platform", "Creator Economy", "Podcast/Audio"],
  Manufaktur: ["Manufaktur Ringan", "Tekstil", "Elektronik", "Kemasan", "3D Printing"],
  "Jasa Profesional": ["Platform Freelancer", "Legal Tech", "Konsultan Bisnis", "HR Outsourcing", "Design Agency"],
};

export const PLATFORMS = ["Marketplace", "Aplikasi Mobile", "Situs Web", "Media Sosial", "B2B SaaS", "WhatsApp/Telegram Bot"];

export const CAPITAL_OPTIONS = [
  "< Rp50 juta",
  "Rp50–500 juta",
  "Rp500 juta–2 miliar",
  "> Rp2 miliar",
] as const;

export const READINESS_LEVELS = ["Ide", "Prototipe", "MVP", "Sudah Berjalan"] as const;

export const TEAM_EXPERTISE = ["Teknologi", "Pemasaran", "Keuangan", "Operasional", "Desain"] as const;

export const RISK_PROFILES = ["Konservatif", "Moderat", "Agresif"] as const;

export const DYNAMIC_SCENARIOS = [
  "Penambahan Modal di Tengah Jalan",
  "Pembukaan Outlet/Cabang",
  "Ekspansi Wilayah",
  "Pivot Model Bisnis",
] as const;

export const AGENT_LABELS: Record<string, string> = {
  orchestrator: "🧠 Orchestrator",
  bmc: "📊 Business Model Canvas",
  market_research: "📈 Market Research",
  competitor: "🔍 Competitor Analysis",
  risk: "⚠️ Risk Analysis",
  recommendation: "✅ Scoring & Recommendation",
};

export const AGENT_ORDER = ["orchestrator", "bmc", "market_research", "competitor", "risk", "recommendation"];
