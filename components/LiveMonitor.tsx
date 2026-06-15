"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Clock, AlertCircle, Circle } from "lucide-react";
import { AGENT_LABELS, AGENT_ORDER } from "@/lib/constants";
import { formatElapsed } from "@/lib/utils";
import type { AgentEvent, AnalysisResult } from "@/lib/types";

type AgentStatus = "waiting" | "running" | "done" | "error";

interface AgentState {
  status: AgentStatus;
  elapsed?: number;
  tokens?: number;
}

interface Props {
  sessionId: string;
  onComplete: (data: AnalysisResult) => void;
}

export function LiveMonitor({ sessionId, onComplete }: Props) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(
    Object.fromEntries(AGENT_ORDER.map((a) => [a, { status: "waiting" }]))
  );
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const sse = new EventSource(`/api/stream/${sessionId}`);

    sse.onmessage = (e) => {
      try {
        const event: AgentEvent = JSON.parse(e.data);
        setOverallProgress(event.progress);

        setAgentStates((prev) => {
          const next = { ...prev };
          const agent = event.agent;
          if (event.event === "agent_start") {
            next[agent] = { ...next[agent], status: "running" };
          } else if (event.event === "agent_done") {
            next[agent] = {
              status: "done",
              elapsed: event.elapsed_seconds,
              tokens: event.tokens_used,
            };
          } else if (event.event === "agent_error") {
            next[agent] = { ...next[agent], status: "error" };
            setHasError(true);
          } else if (event.event === "complete") {
            next[agent] = { ...next[agent], status: "done" };
            setIsComplete(true);
            sse.close();
            if (event.data) onComplete(event.data as AnalysisResult);
          }
          return next;
        });
      } catch {
        // ignore parse errors
      }
    };

    sse.onerror = () => sse.close();
    return () => sse.close();
  }, [sessionId, onComplete]);

  return (
    <div className="glass-card rounded-2xl p-6 sticky top-6">
      <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
        <span>Progress Analisis</span>
        <span className="ml-auto text-blue-400 text-sm font-mono">{overallProgress}%</span>
      </h3>

      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Agents */}
      <div className="space-y-2">
        {AGENT_ORDER.map((agentKey) => {
          const state = agentStates[agentKey];
          const label = AGENT_LABELS[agentKey];
          const { status, elapsed, tokens } = state;

          return (
            <div
              key={agentKey}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                status === "running"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : status === "done"
                  ? "bg-green-500/5 border-green-500/20"
                  : status === "error"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-gray-800/40 border-gray-700/30"
              }`}
            >
              <div className="w-5 h-5 flex-shrink-0">
                {status === "waiting" && <Circle size={20} className="text-gray-600" />}
                {status === "running" && <Loader2 size={20} className="text-blue-400 animate-spin" />}
                {status === "done" && <CheckCircle size={20} className="text-green-400" />}
                {status === "error" && <AlertCircle size={20} className="text-red-400" />}
              </div>
              <span className={`flex-1 text-sm font-medium ${
                status === "running" ? "text-blue-300 agent-running" :
                status === "done" ? "text-green-300" :
                status === "error" ? "text-red-300" :
                "text-gray-500"
              }`}>{label}</span>
              {elapsed != null && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={11} />{formatElapsed(elapsed)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="mt-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
          <p className="text-green-400 font-semibold text-sm">✅ Analisis Selesai!</p>
          <p className="text-gray-400 text-xs mt-1">Scroll ke bawah untuk laporan lengkap</p>
        </div>
      )}

      {hasError && !isComplete && (
        <div className="mt-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
          <p className="text-yellow-400 font-semibold text-sm">⚠️ Beberapa agen mengalami error</p>
          <p className="text-gray-400 text-xs mt-1">Analisis dilanjutkan dengan data terbaik</p>
        </div>
      )}
    </div>
  );
}
