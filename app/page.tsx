import Link from "next/link";
import { ArrowRight, Brain, BarChart3, Shield, Zap } from "lucide-react";

const AGENTS = [
  { name: "Orchestrator", desc: "Menganalisis parameter & menentukan prioritas analisis" },
  { name: "Business Model Canvas", desc: "Menyusun blok inti model bisnis" },
  { name: "Market Research", desc: "Riset TAM / SAM / SOM & tren pasar real-time" },
  { name: "Competitor Analysis", desc: "Identifikasi & analisis kompetitor langsung" },
  { name: "Risk Analysis", desc: "Analisis risiko 4 dimensi + dampak skenario" },
  { name: "Recommendation", desc: "Hitung skor 0–100 & rekomendasi strategis" },
];

const STEPS = [
  { icon: Brain, step: "01", title: "Input Parameter", desc: "Parameter terstruktur: industri, modal, tim, model operasi, skenario dinamis." },
  { icon: Zap, step: "02", title: "Agen Bekerja Paralel", desc: "Orchestrator, BMC, Market, Kompetitor, Sentimen, Risiko, Regulasi, Finansial, Rekomendasi." },
  { icon: BarChart3, step: "03", title: "Laporan Lengkap", desc: "Skor 0–100 + BMC + TAM/SAM/SOM + kompetitor + risiko + rekomendasi strategis." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/[0.07] bg-base/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight">
            FeasiFlow <span className="gradient-text">AI</span>
          </span>
          <Link
            href="/analyze"
            className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-4 py-2 text-sm font-medium text-fg transition-colors duration-150 focus-ring"
          >
            Mulai Analisis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-muted mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            9 Agen AI Otonom · Powered by Groq
          </div>
          <h1 className="text-[40px] leading-[1.05] md:text-6xl md:leading-[1.05] font-semibold tracking-tight">
            Validasi ide startup
            <br />
            <span className="gradient-text">dalam hitungan menit</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto leading-relaxed">
            Analisis kelayakan startup Indonesia dengan sistem multi-agen AI —
            Business Model Canvas, riset pasar, kompetitor, risiko, dan rekomendasi
            strategis dengan skor 0–100.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white shadow-glow transition-[transform,box-shadow] duration-150 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_10px_36px_-8px_rgba(99,102,241,0.5)] active:translate-y-px focus-ring"
            >
              Mulai Analisis Gratis
              <ArrowRight size={17} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-faint">Gratis · Tanpa registrasi · Hasil di bawah 3 menit</p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 divide-x divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-white/[0.015] py-7">
          {[
            { value: "9", label: "Agen Otonom" },
            { value: "<3", label: "Menit Analisis" },
            { value: "0–100", label: "Skor Kelayakan" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center px-2">
              <div className="text-3xl font-semibold tracking-tight tnum gradient-text">{value}</div>
              <div className="mt-1 text-[13px] text-faint">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">Cara kerja</h2>
        <p className="mt-2 text-center text-muted">Tiga langkah, dari ide ke laporan kelayakan.</p>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {STEPS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                  <Icon size={18} className="text-accent-fg" aria-hidden="true" />
                </span>
                <span className="text-sm font-mono text-faint tnum">{step}</span>
              </div>
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">Sembilan agen, satu laporan</h2>
        <div className="mt-10 grid sm:grid-cols-2 gap-3">
          {AGENTS.map(({ name, desc }, i) => (
            <div key={name} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <span className="flex-shrink-0 h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 text-accent-fg font-mono text-sm font-medium flex items-center justify-center tnum">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-medium text-fg">{name}</p>
                <p className="mt-0.5 text-[13px] text-muted leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 mb-5">
          <Shield className="h-5 w-5 text-accent-fg" aria-hidden="true" />
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Siap memvalidasi ide kamu?</h2>
        <p className="mt-3 text-muted">Gratis. Tanpa registrasi. Laporan kelayakan dalam &lt;3 menit.</p>
        <Link
          href="/analyze"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white shadow-glow transition-[transform] duration-150 active:translate-y-px focus-ring"
        >
          Mulai sekarang <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-10 text-center">
        <p className="text-sm font-medium text-muted">FeasiFlow AI</p>
        <p className="mt-1.5 text-[13px] text-faint">
          Implementasi Sistem Agentic AI · Tugas Akhir TI, Universitas Atma Jaya Makassar, 2026
        </p>
        <p className="mt-0.5 text-[13px] text-faint">Vincentius Bryan Kwandou · 2361021</p>
      </footer>
    </main>
  );
}
