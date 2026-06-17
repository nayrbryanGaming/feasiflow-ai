// Groq client for the 9-agent TypeScript pipeline.
//
// Goal: original PARALLEL setup, using BOTH API keys, reliable under ~5
// concurrent testers. Groq rate limits are per-ORG-per-MODEL, and the two
// keys share one org — so the lever for concurrency is spreading calls across
// MODELS (each model has its own token bucket) + retrying a 429 on a DIFFERENT
// model bucket. Happy path is still ONE call per agent (go-green); retries only
// fire under genuine rate contention so concurrent runs still finish.

// Reliable JSON-mode models (Llama family — no hidden "reasoning" that breaks
// response_format:json_object, unlike gpt-oss / qwen3). Each has its own
// per-org token bucket. TPM verified via x-ratelimit-limit-tokens:
//   llama-3.3-70b 12k · llama-4-scout 30k · llama-3.1-8b 6k  → 48k aggregate.
const MODELS = {
  best: "llama-3.3-70b-versatile",                       // 12k TPM, top quality
  big: "meta-llama/llama-4-scout-17b-16e-instruct",      // 30k TPM, big bucket
  fast: "llama-3.1-8b-instant",                          // 6k TPM
  ossBig: "openai/gpt-oss-120b",                         // 8k TPM, overflow only
  ossSmall: "openai/gpt-oss-20b",                        // 8k TPM, overflow only
} as const;

// Attempt 0 (normal path): reliable JSON-mode Llama models only, weighted so
// load tracks quality first then capacity. One call per agent lands here.
const MODEL_POOL = [MODELS.best, MODELS.big, MODELS.best, MODELS.big, MODELS.fast];
// Retry rotation after a 429: all 5 distinct buckets (~64k TPM aggregate) so a
// burst of concurrent calls can always find free capacity somewhere.
const DISTINCT_MODELS = [MODELS.best, MODELS.big, MODELS.ossBig, MODELS.ossSmall, MODELS.fast];

const MAX_RETRIES = 8;

// ── API keys ─────────────────────────────────────────────────────────────────
// GROQ_API_KEY may hold several keys (comma / whitespace separated); round-robin
// across them. NOTE: keys from the SAME Groq account share one org rate-limit
// pool, so extra keys only add headroom if from DIFFERENT accounts. Stray BOM /
// non-ASCII chars are stripped — a leading U+FEFF makes fetch throw
// "Cannot convert argument to a ByteString ... value 65279".
function getKeys(): string[] {
  const raw = process.env.GROQ_API_KEY ?? "";
  const keys = raw
    .split(/[,\s]+/)
    .map((k) => k.replace(/[^\x20-\x7E]/g, "").trim())
    .filter(Boolean);
  if (keys.length === 0) throw new Error("GROQ_API_KEY not set");
  return keys;
}

let modelCounter = 0;
let keyCounter = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fast first (rotation usually finds a free bucket), longer if all are saturated.
function backoffMs(attempt: number): number {
  const ladder = [400, 800, 1500, 3000, 5000, 8000, 12000, 15000];
  return ladder[attempt] ?? 15000;
}

// How long Groq says to wait, from the retry-after header or the 429 body
// ("Please try again in 17.46s"). Capped so a single agent never stalls a run.
function retryAfterMs(res: Response, bodyText: string): number {
  const h = res.headers.get("retry-after");
  if (h && !Number.isNaN(parseFloat(h))) return Math.min(15000, parseFloat(h) * 1000);
  const m = bodyText.match(/try again in ([\d.]+)s/i);
  if (m) return Math.min(15000, parseFloat(m[1]) * 1000);
  return 0;
}

export async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<{ content: string; tokens: number }> {
  const { temperature = 0.7, maxTokens = 4096, jsonMode = true } = opts;
  const keys = getKeys();
  const startModel = modelCounter++;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Attempt 0: weighted pool. Retries: rotate across distinct model buckets.
    const model =
      attempt === 0
        ? MODEL_POOL[startModel % MODEL_POOL.length]
        : DISTINCT_MODELS[(startModel + attempt) % DISTINCT_MODELS.length];
    const apiKey = keys[keyCounter++ % keys.length];

    const body: Record<string, unknown> = { model, messages, temperature, max_tokens: maxTokens };
    if (jsonMode) body.response_format = { type: "json_object" };

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastErr = e; // network hiccup → retry
      await sleep(backoffMs(attempt));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      // Retryable: rate limit / transient 5xx, or a gpt-oss overflow model that
      // couldn't emit valid JSON (json_validate_failed) — rotate to another bucket.
      const retryable =
        res.status === 429 ||
        res.status === 500 ||
        res.status === 502 ||
        res.status === 503 ||
        (res.status === 400 && text.includes("json_validate_failed"));
      if (retryable && attempt < MAX_RETRIES) {
        lastErr = new Error(`Groq ${res.status}: ${text.slice(0, 140)}`);
        await sleep(Math.max(backoffMs(attempt), retryAfterMs(res, text)));
        continue;
      }
      throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      lastErr = new Error("Groq: empty content");
      await sleep(backoffMs(attempt));
      continue;
    }
    return { content, tokens: data.usage?.total_tokens ?? 0 };
  }
  throw lastErr ?? new Error("Groq: exhausted retries");
}

// Shared rubric appended to every scoring agent so the panel of agents grades
// like a skeptical investor/examiner instead of defaulting to a generous 60-70.
// Direction-neutral so it works for both positive dimensions and the risk agent.
export const CRITICAL_SCORING_GUIDE = `

PRINSIP PENILAIAN KRITIS (WAJIB DIPATUHI):
Anda evaluator SKEPTIS, KRITIS, dan KETAT seperti investor due-diligence / penguji sidang — BUKAN motivator. Default Anda adalah ragu, bukan percaya.
- Sebar skor realistis di SELURUH rentang 0-100. DILARANG menggumpalkan skor di 55-75.
- Skala: 0-20 fatal/asal · 21-40 lemah & banyak celah · 41-60 rata-rata, risiko besar belum terjawab · 61-80 kuat & berbukti · 81-100 luar biasa (LANGKA, butuh bukti keras).
- Untuk dimensi POSITIF (pasar, model bisnis, kompetitif, finansial, demand, regulasi): jika deskripsi ide VAGUE, generik, terlalu pendek, tidak koheren, atau tanpa diferensiasi → skor WAJIB RENDAH (<40).
- Untuk RISIKO: ide lemah/vague/belum teruji → skor risiko WAJIB TINGGI (>65).
- DILARANG memberi skor bagus tanpa BUKTI konkret. Selalu sebutkan kelemahan/celah spesifik yang Anda temukan.
- Setiap skor WAJIB disertai alasan singkat berbasis bukti, bukan pujian umum.
Lebih baik terlalu kritis daripada optimis palsu.`;

export function stripThink(content: string): string {
  if (content.includes("</think>")) {
    return content.slice(content.lastIndexOf("</think>") + 8).trim();
  }
  return content;
}

export function parseJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(stripThink(content));
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* fall through */ }
    }
    return {};
  }
}
