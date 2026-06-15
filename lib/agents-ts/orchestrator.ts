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
}

const SYSTEM_PROMPT = `Anda adalah Orchestrator AI — arsitek analisis startup Indonesia.
Anda menerima profil startup dan membuat kerangka analisis strategis untuk 8 agen AI berikutnya.
Fokus pada konteks pasar Indonesia: regulasi OJK/BPOM, daya beli masyarakat Indonesia, ekosistem startup lokal.
Output HARUS dalam format JSON valid dengan keys: mission, startup_dna, strategic_priorities (array string),
key_questions (array string), analysis_framework, confidence_note.`;

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
  return {
    mission: (result.mission as string) || `Analisis kelayakan ${params.startup_name}`,
    startup_dna: (result.startup_dna as string) || params.product_description,
    strategic_priorities: (result.strategic_priorities as string[]) || [],
    key_questions: (result.key_questions as string[]) || [],
    analysis_framework: (result.analysis_framework as string) || "9-Agent Multi-Dimensional Analysis",
    confidence_note: (result.confidence_note as string) || "Analisis berbasis data pasar Indonesia",
  };
}
