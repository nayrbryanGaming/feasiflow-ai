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
