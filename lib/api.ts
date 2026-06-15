import type { StartupParameters } from "./types";

export async function startAnalysis(params: StartupParameters): Promise<{ sessionId: string }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Failed to start analysis");
  }
  return res.json();
}

export async function getResult(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/result/${sessionId}`);
  return res.json();
}
