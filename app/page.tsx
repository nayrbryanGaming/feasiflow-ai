import Link from "next/link";
import { ArrowRight, Brain, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-black gradient-text">FeasiFlow AI</span>
        <Link
          href="/analyze"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
        >
          Mulai Analisis
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm font-medium mb-8">
            <Zap size={14} />
            6 Autonomous AI Agents · Powered by Groq
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Validasi Ide Startup{" "}
            <span className="gradient-text">dalam Menit</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            FeasiFlow AI menganalisis kelayakan ide startup menggunakan Business Model Canvas +
            market research otomatis. Skor 0–100. Rekomendasi strategis. Gratis.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Mulai Analisis Gratis <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "6", label: "AI Agents Otonom" },
            { value: "< 3 menit", label: "Waktu Analisis" },
            { value: "0–100", label: "Skor Kelayakan" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-black gradient-text">{value}</div>
              <div className="text-gray-500 mt-1 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Cara Kerja FeasiFlow</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain size={28} className="text-blue-400" />,
              step: "01",
              title: "Input Parameter",
              desc: "11 parameter terstruktur: industri, modal, tim, model operasi, skenario dinamis.",
            },
            {
              icon: <Zap size={28} className="text-purple-400" />,
              step: "02",
              title: "6 Agent Bekerja",
              desc: "Orchestrator · BMC · Market Research · Kompetitor · Risiko · Rekomendasi.",
            },
            {
              icon: <BarChart3 size={28} className="text-green-400" />,
              step: "03",
              title: "Laporan Lengkap",
              desc: "Skor 0-100 + BMC + TAM/SAM/SOM + kompetitor + risiko + rekomendasi strategis.",
            },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                {icon}
                <span className="text-3xl font-black text-gray-700">{step}</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent List */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">6 Agen AI Otonom</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Orchestrator Agent", desc: "Menganalisis parameter & menentukan prioritas analisis" },
              { name: "BMC Agent", desc: "Menyusun 5 blok inti Business Model Canvas" },
              { name: "Market Research Agent", desc: "Riset TAM/SAM/SOM & tren pasar real-time" },
              { name: "Competitor Analysis Agent", desc: "Identifikasi & analisis min. 3 kompetitor" },
              { name: "Risk Analysis Agent", desc: "Analisis risiko 4 dimensi + dampak skenario" },
              { name: "Recommendation Agent", desc: "Hitung skor 0-100 & rekomendasi strategis" },
            ].map(({ name, desc }, i) => (
              <div key={name} className="flex gap-4 p-4 glass-card rounded-xl">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Siap Memvalidasi Ide Startup Kamu?</h2>
        <p className="text-gray-400 mb-8">Gratis. Tanpa registrasi. Hasilkan laporan kelayakan dalam &lt;3 menit.</p>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl font-bold text-lg transition-opacity"
        >
          Mulai Sekarang <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p className="font-semibold text-gray-400">FeasiFlow AI</p>
        <p className="mt-1 text-xs">
          Implementasi Sistem Agentic AI · Tugas Akhir TI, Universitas Atma Jaya Makassar, 2026
        </p>
        <p className="text-xs mt-0.5">Vincentius Bryan Kwandou / 2361021</p>
      </footer>
    </main>
  );
}
