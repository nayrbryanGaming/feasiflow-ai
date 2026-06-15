// Groq TypeScript client for Edge Runtime
// Used by all 9 agents in the TypeScript pipeline

export const PRIMARY_MODEL = "deepseek-r1-distill-llama-70b";
export const FALLBACK_MODEL = "llama-3.3-70b-versatile";

export async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<{ content: string; tokens: number }> {
  const { temperature = 0.7, maxTokens = 4096, jsonMode = true } = opts;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const body: Record<string, unknown> = {
    model: PRIMARY_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const tryCall = async (model: string) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, model }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return {
      content: data.choices[0].message.content as string,
      tokens: data.usage?.total_tokens ?? 0,
    };
  };

  try {
    return await tryCall(PRIMARY_MODEL);
  } catch {
    return await tryCall(FALLBACK_MODEL);
  }
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
