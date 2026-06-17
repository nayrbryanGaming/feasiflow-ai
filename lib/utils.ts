import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-yellow-400";
  return "text-red-400";
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "from-green-500 to-emerald-400";
  if (score >= 55) return "from-yellow-500 to-orange-400";
  return "from-red-500 to-rose-400";
}

export function getScoreBorder(score: number): string {
  if (score >= 75) return "border-green-500/30";
  if (score >= 55) return "border-yellow-500/30";
  return "border-red-500/30";
}

export function getRiskColor(level: string): string {
  const map: Record<string, string> = {
    Low: "text-green-400",
    Medium: "text-yellow-400",
    High: "text-orange-400",
    Critical: "text-red-400",
  };
  return map[level] ?? "text-gray-400";
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return map[priority] ?? "bg-gray-500/20 text-gray-400";
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

// ── LLM output coercion ───────────────────────────────────────────────────────
// The 9 agents are told to return string arrays, but across the model pool
// (llama-3.3 / llama-4-scout / llama-3.1-8b / gpt-oss) they SOMETIMES return
// objects (e.g. {point, detail}) or numbers instead. Rendering a raw object as
// a React child throws "Objects are not valid as a React child" and blanks the
// whole page. These helpers coerce any value to safe display text so the UI
// never crashes regardless of the JSON shape the model emits.
const PREFERRED_KEYS = [
  "text", "point", "value", "description", "recommendation", "action",
  "title", "name", "label", "detail", "summary", "item", "risk",
  "challenge", "strength", "step", "factor", "reason", "insight",
];

export function toText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const k of PREFERRED_KEYS) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return o[k] as string;
    }
    const parts = Object.values(o)
      .filter((v) => typeof v === "string" || typeof v === "number")
      .map(String)
      .filter(Boolean);
    if (parts.length) return parts.join(" — ");
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

// Coerce a value that SHOULD be string[] into a clean string[] (drops empties).
export function toTextList(value: unknown): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map(toText).map((s) => s.trim()).filter(Boolean);
}

// Coerce a value that SHOULD be a number (LLM sometimes sends strings/objects).
export function toNum(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}
