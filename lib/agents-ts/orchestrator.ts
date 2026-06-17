import { callGroq, parseJson } from "./config";

export interface StartupParams {
  startup_name: string;
  industry_category: string;
  product_description: string;
  target_market: string;
  unique_value_proposition: string;
  business_model: string;
  initial_capital: string;
  founder_background: string;
}

export interface OrchestratorResult {
  mission: string;
  startup_dna: string;
  strategic_priorities: string[];
  key_questions: string[];
  analysis_framework: string;
  confidence_note: string;
  input_quality_score: number;       // 0-100: seberapa spesifik/koheren/viable input
  input_quality_reasoning: string;
}

const SYSTEM_PROMPT = `Anda adalah Orchestrator AI — arsitek analisis startup Indonesia, sekaligus GATEKEEPER kualitas input.
Anda menerima profil startup dan membuat kerangka analisis strategis untuk 8 agen AI berikutnya.
Fokus pada konteks pasar Indonesia: regulasi OJK/BPOM, daya beli masyarakat Indonesia, ekosistem startup lokal.

TUGAS KRITIS TAMBAHAN — nilai KUALITAS INPUT secara skeptis lewat "input_quality_score" (0-100):
- Seberapa SPESIFIK, KOHEREN, dan KONKRET deskripsi ide? Apakah ada masalah jelas, target jelas, solusi jelas, dan diferensiasi?
- Input random/asal, gibberish, 1-2 kalimat generik, atau placeholder → input_quality_score WAJIB <25.
- Ide generik tanpa diferensiasi ("aplikasi marketplace biasa") → 25-45.
- Cukup detail tapi ada celah → 46-70. Sangat detail, spesifik, koheren → 71-100 (langka).
Sertakan "input_quality_reasoning" (1-2 kalimat) menjelaskan kelemahan/kekuatan konkret input.

Output HARUS dalam format JSON valid dengan keys: mission, startup_dna, strategic_priorities (array string),
key_questions (array string), analysis_framework, confidence_note, input_quality_score (number 0-100),
input_quality_reasoning (string).`;

// Deterministic floor so the LLM can't be generous about obviously thin input.
function inputSpecificityFloor(desc: string): number {
  const t = (desc || "").trim();
  const words = t.split(/\s+/).filter(Boolean);
  const uniqRatio = words.length ? new Set(words.map((w) => w.toLowerCase())).size / words.length : 0;
  if (words.length < 8) return 12;                       // basically empty / placeholder
  if (words.length < 18) return 30;                      // one vague sentence
  if (uniqRatio < 0.4) return 28;                        // repetitive / gibberish
  if (words.length < 40) return 55;
  return 80;                                             // substantial description
}

export async function runOrchestrator(params: StartupParams): Promise<OrchestratorResult> {
  const userMsg = `Profil Startup untuk Dianalisis:
- Nama: ${params.startup_name}
- Kategori: ${params.industry_category}
- Deskripsi Produk: ${params.product_description}
- Target Pasar: ${params.target_market}
- Nilai Unik (UVP): ${params.unique_value_proposition}
- Model Bisnis: ${params.business_model}
- Modal Awal: ${params.initial_capital}
- Latar Belakang Founder: ${params.founder_background}

Buat kerangka analisis strategis yang komprehensif untuk startup ini di pasar Indonesia.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.6, maxTokens: 2048 });

  const result = parseJson(content);

  // Combine the LLM's quality judgment with a deterministic floor and cap by it,
  // so thin/random input cannot be inflated. Take the lower of the two.
  const floor = inputSpecificityFloor(params.product_description);
  const llmQuality = Number(result.input_quality_score);
  const quality = Number.isFinite(llmQuality)
    ? Math.round(Math.min(Math.max(llmQuality, 0), floor < 35 ? floor : 100))
    : floor;

  return {
    mission: (result.mission as string) || `Analisis kelayakan ${params.startup_name}`,
    startup_dna: (result.startup_dna as string) || params.product_description,
    strategic_priorities: (result.strategic_priorities as string[]) || [],
    key_questions: (result.key_questions as string[]) || [],
    analysis_framework: (result.analysis_framework as string) || "9-Agent Multi-Dimensional Analysis",
    confidence_note: (result.confidence_note as string) || "Analisis berbasis data pasar Indonesia",
    input_quality_score: quality,
    input_quality_reasoning: (result.input_quality_reasoning as string)
      || (floor < 35 ? "Deskripsi ide terlalu tipis/umum untuk dinilai andal." : "Input memadai untuk dianalisis."),
  };
}
