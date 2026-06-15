import { callGroq, parseJson } from "./config";
import { search, formatResults } from "./search";
import type { StartupParams } from "./orchestrator";

const SYSTEM_PROMPT = `Anda adalah Market Research Intelligence Agent AI untuk startup Indonesia.
Analisis ukuran pasar, tren, dan potensi pertumbuhan berdasarkan data pencarian terkini.
Berikan market_score (0-100) sebagai bobot 20% dari skor final.
Sifat penilaian: ukuran TAM/SAM/SOM, tren pertumbuhan YoY, penetrasi digital, daya beli, timing pasar.
Output JSON dengan keys: total_addressable_market, serviceable_addressable_market,
serviceable_obtainable_market, market_growth_rate, market_trends (array), digital_penetration,
consumer_behavior_insights, market_timing_assessment, market_score, market_size_idr,
growth_drivers (array), market_risks (array), data_sources (array).`;

export async function runMarketResearch(
  params: StartupParams,
  orchestratorMission: string
): Promise<Record<string, unknown>> {
  const queries = [
    `${params.industry_category} market size Indonesia 2024 2025 IDR growth`,
    `${params.startup_name} ${params.target_market} Indonesia market trend`,
    `${params.industry_category} startup Indonesia funding investment`,
  ];

  const searchResults = await Promise.all(queries.map((q) => search(q, 3)));
  const combinedSearch = searchResults
    .map((res, i) => `Query ${i + 1}: "${queries[i]}"\n${formatResults(res)}`)
    .join("\n\n---\n\n");

  const userMsg = `Analisis pasar untuk ${params.startup_name} (${params.industry_category}) di Indonesia:

Mission: ${orchestratorMission}
Target Pasar: ${params.target_market}
Deskripsi: ${params.product_description}
Modal Awal: ${params.initial_capital}

=== Data Pencarian Real-time ===
${combinedSearch}

Berdasarkan data pencarian di atas dan pengetahuan Anda tentang pasar Indonesia,
berikan analisis pasar komprehensif dengan skor market_score (0-100).`;

  const { content } = await callGroq([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ], { temperature: 0.5, maxTokens: 3072 });

  return parseJson(content);
}
