// Groq client for the 9-agent TypeScript pipeline.
//
// Institutional "go green" policy → EXACTLY ONE Groq API call per agent:
//   • No fallback / retry double-calls.
//   • Calls are serialized and token-rate-gated using Groq's own
//     `x-ratelimit-*` response headers, so we never hit a 429 in the first
//     place — which is what makes a single call per agent reliable.

// Single model: supports JSON mode, highest free-tier budget (~12k TPM).
export const MODEL = "llama-3.3-70b-versatile";

// ── API keys ─────────────────────────────────────────────────────────────────
// GROQ_API_KEY may hold several keys (comma / whitespace separated); we
// round-robin across them. NOTE: keys from the SAME Groq account share one
// org-wide rate-limit pool, so extra keys only add headroom if they come from
// DIFFERENT accounts. Stray BOM / non-ASCII chars are stripped — a leading
// U+FEFF makes fetch throw "Cannot convert argument to a ByteString ... 65279".
function getKeys(): string[] {
  const raw = process.env.GROQ_API_KEY ?? "";
  const keys = raw
    .split(/[,\s]+/)
    .map((k) => k.replace(/[^\x20-\x7E]/g, "").trim())
    .filter(Boolean);
  if (keys.length === 0) throw new Error("GROQ_API_KEY not set");
  return keys;
}
let keyIndex = 0;

// ── Serialized, rate-gated execution ─────────────────────────────────────────
// All callGroq() invocations queue through `chain` so only one HTTP request is
// in flight at a time; the gate then keeps us under the per-minute token cap.
let chain: Promise<unknown> = Promise.resolve();
let remainingTokens = Number.POSITIVE_INFINITY; // from last response headers
let resetMs = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseDurationMs(s: string | null): number {
  if (!s) return 0;
  let ms = 0;
  const min = s.match(/([\d.]+)m(?!s)/);
  const sec = s.match(/([\d.]+)s/);
  const mil = s.match(/([\d.]+)ms/);
  if (min) ms += parseFloat(min[1]) * 60000;
  if (sec) ms += parseFloat(sec[1]) * 1000;
  if (mil) ms += parseFloat(mil[1]);
  return ms;
}

function estimateTokens(messages: { content: string }[], maxTokens: number): number {
  const chars = messages.reduce((n, m) => n + m.content.length, 0);
  return Math.ceil(chars / 3) + maxTokens; // generous upper bound: input + max output
}

async function rateGate(est: number): Promise<void> {
  // If the remaining per-minute token budget can't cover this call, wait for
  // the bucket to refill before sending it (no extra API call is made).
  if (remainingTokens < est) {
    await sleep(resetMs + 400);
    remainingTokens = Number.POSITIVE_INFINITY;
    resetMs = 0;
  }
}

export async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<{ content: string; tokens: number }> {
  const run = chain.then(() => doCall(messages, opts));
  // Keep the queue alive even if this call rejects.
  chain = run.then(() => undefined, () => undefined);
  return run;
}

async function doCall(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ content: string; tokens: number }> {
  const { temperature = 0.7, maxTokens = 4096, jsonMode = true } = opts;
  const keys = getKeys();
  const apiKey = keys[keyIndex++ % keys.length];

  await rateGate(estimateTokens(messages, maxTokens));

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Update the token budget from Groq's own accounting so the next call's gate
  // is accurate. This is what prevents the 429 instead of reacting to it.
  const rem = res.headers.get("x-ratelimit-remaining-tokens");
  const rst = res.headers.get("x-ratelimit-reset-tokens");
  if (rem !== null) remainingTokens = parseFloat(rem);
  if (rst !== null) resetMs = parseDurationMs(rst);

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as any;
  return {
    content: data.choices[0].message.content as string,
    tokens: data.usage?.total_tokens ?? 0,
  };
}

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
