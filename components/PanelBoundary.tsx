"use client";

import { Component, type ReactNode } from "react";

interface Props {
  /** Short panel name shown in the fallback, e.g. "Rekomendasi Strategis". */
  name?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Isolates a single result panel: if its render throws (e.g. the LLM returned
// an unexpected JSON shape), only THIS card shows a small fallback instead of
// the whole page going blank with Next.js' global-error screen.
export class PanelBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface to the console for debugging; never re-throw.
    console.error(`[PanelBoundary${this.props.name ? ` ${this.props.name}` : ""}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-2xl p-5 border border-yellow-500/20">
          <p className="text-sm font-semibold text-yellow-300">
            {this.props.name ?? "Bagian ini"} tidak dapat ditampilkan
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Data dari AI untuk bagian ini berformat tak terduga, jadi dilewati. Bagian lain tetap tampil normal.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
