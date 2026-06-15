import { callGroq, parseJson } from "./config";
import { search, formatResults } from "./search";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Competitive Intelligence Agent AI untuk startup Indonesia.
Identifikasi kompetitor langsung dan tidak langsung, analisis positioning, dan evaluasi keunggulan kompetitif.
Berikan competitive_advantage_score (0-100) sebagai bobot 15% dari skor final.
Sifat penilaian: keunikan diferensiasi, kekuatan moat, intensitas persaingan, barriers to entry, positioning gap.
Output JSON dengan keys: direct_competitors (array dari {name, description, strengths, weaknesses,
funding_status, estimated_market_share}), indirect_competitors (array),
competitive_advantage_score, our_differentiation, competitive_moat,
competition_intensity, market_gaps (array), recommended_positioning,
entry_barriers (array), competitive_risks (array).`;

export async function runCompetitor(
  params: StartupParams,
  orchestratorMission: string
): Promise<Record<string, unknown>> {
  const queries = [
    `${params.industry_category} competitor Indonesia startup ${params.startup_name}`,
    `${params.product_description} alternative competitor Indonesia app`,
  ];

  const searchResults = await Promise.all(queries.map((q) => search(q, 3)));
  const combinedSearch = searchResults
    .map((res, i) => `Query ${i + 1}: "${queries[i]}"\n${formatResults(res)}`)
    .join("\n\n---\n\n");

  const userMsg = `Analisis kompetitor untuk ${params.startup_name} (${params.industry_category}):

Mission: ${orchestratorMission}
UVP: ${params.unique_value_proposition}
Model Bisnis: ${params.business_model}
Target: ${params.target_market}

=== Data Pencarian Real-time ===
${combinedSearch}

Identifikasi kompetitor utama dan berikan competitive_advantage_score (0-100).
Tinggi = diferensiasi kuat, rendah = mudah ditiru / pasar jenuh.`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.5, maxTokens: 3072 });

  return parseJson(content);
}
