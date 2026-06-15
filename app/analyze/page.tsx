"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import {
  INDUSTRY_CATEGORIES, SUBTOPICS, PLATFORMS,
  CAPITAL_OPTIONS, READINESS_LEVELS, TEAM_EXPERTISE,
  RISK_PROFILES, DYNAMIC_SCENARIOS,
} from "@/lib/constants";
import { startAnalysis } from "@/lib/api";
import type { StartupParameters } from "@/lib/types";

const schema = z.object({
  industryCategory: z.string().min(1, "Pilih kategori industri"),
  topicSubField: z.string().min(1, "Pilih sub-bidang"),
  operatingModel: z.enum(["Daring", "Luring", "Hibrida"]),
  location: z.string().optional(),
  platform: z.string().optional(),
  initialCapital: z.string().min(1, "Pilih modal awal"),
  readinessLevel: z.string().min(1, "Pilih tingkat kesiapan"),
  teamExpertise: z.array(z.string()).min(1, "Pilih minimal 1 keahlian tim"),
  riskProfile: z.string().min(1, "Pilih profil risiko"),
  dynamicScenarios: z.array(z.string()).optional(),
  ideaDescription: z.string().min(50, "Deskripsi minimal 50 karakter").max(2000),
});

type FormData = z.infer<typeof schema>;

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      operatingModel: "Daring",
      teamExpertise: [],
      dynamicScenarios: [],
    },
  });

  const selectedIndustry = watch("industryCategory");
  const selectedModel = watch("operatingModel");
  const selectedExpertise = watch("teamExpertise") || [];
  const selectedScenarios = watch("dynamicScenarios") || [];
  const descText = watch("ideaDescription") || "";

  const subtopics = selectedIndustry ? SUBTOPICS[selectedIndustry] || [] : [];

  const toggleArray = (field: "teamExpertise" | "dynamicScenarios", value: string) => {
    const current = field === "teamExpertise" ? selectedExpertise : selectedScenarios;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, next);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const { sessionId } = await startAnalysis(data as StartupParameters);
      router.push(`/analyze/${sessionId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-300 mb-2";
  const errCls = "text-red-400 text-xs mt-1";

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="text-blue-400 text-sm hover:text-blue-300 mb-4 inline-block">← Kembali ke Beranda</a>
          <h1 className="text-3xl font-black">Analisis Kelayakan Startup</h1>
          <p className="text-gray-400 mt-2">Isi 11 parameter untuk memulai analisis 6-agen</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-500" : "bg-gray-700"}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Step 1: Industry ── */}
          {step === 1 && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-blue-400">Step 1: Informasi Industri</h2>

              <div>
                <label className={labelCls}>Kategori Industri *</label>
                <select {...register("industryCategory")} className={inputCls}>
                  <option value="">Pilih kategori...</option>
                  {INDUSTRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.industryCategory && <p className={errCls}>{errors.industryCategory.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Sub-bidang / Topik *</label>
                <select {...register("topicSubField")} className={inputCls} disabled={!selectedIndustry}>
                  <option value="">Pilih sub-bidang...</option>
                  {subtopics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.topicSubField && <p className={errCls}>{errors.topicSubField.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Model Operasi *</label>
                <div className="flex gap-3">
                  {(["Daring", "Luring", "Hibrida"] as const).map((m) => (
                    <label key={m} className="flex-1 cursor-pointer">
                      <input type="radio" value={m} {...register("operatingModel")} className="sr-only" />
                      <div className={`text-center py-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedModel === m ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}>{m}</div>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedModel === "Luring" || selectedModel === "Hibrida") && (
                <div>
                  <label className={labelCls}>Lokasi Usaha</label>
                  <input {...register("location")} placeholder="e.g. Makassar, Sulawesi Selatan" className={inputCls} />
                </div>
              )}

              {(selectedModel === "Daring" || selectedModel === "Hibrida") && (
                <div>
                  <label className={labelCls}>Platform / Ekosistem</label>
                  <select {...register("platform")} className={inputCls}>
                    <option value="">Pilih platform...</option>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Lanjut Step 2 <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 2: Team & Capital ── */}
          {step === 2 && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-blue-400">Step 2: Tim & Modal</h2>

              <div>
                <label className={labelCls}>Modal Awal *</label>
                <select {...register("initialCapital")} className={inputCls}>
                  <option value="">Pilih rentang modal...</option>
                  {CAPITAL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.initialCapital && <p className={errCls}>{errors.initialCapital.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Tingkat Kesiapan *</label>
                <div className="grid grid-cols-2 gap-2">
                  {READINESS_LEVELS.map((r) => (
                    <label key={r} className="cursor-pointer">
                      <input type="radio" value={r} {...register("readinessLevel")} className="sr-only" />
                      <div className={`text-center py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        watch("readinessLevel") === r ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}>{r}</div>
                    </label>
                  ))}
                </div>
                {errors.readinessLevel && <p className={errCls}>{errors.readinessLevel.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Keahlian Tim * (multi-pilih)</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_EXPERTISE.map((e) => (
                    <button
                      key={e} type="button"
                      onClick={() => toggleArray("teamExpertise", e)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        selectedExpertise.includes(e)
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >{e}</button>
                  ))}
                </div>
                {errors.teamExpertise && <p className={errCls}>{errors.teamExpertise.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Profil Risiko *</label>
                <div className="flex gap-3">
                  {RISK_PROFILES.map((r) => (
                    <label key={r} className="flex-1 cursor-pointer">
                      <input type="radio" value={r} {...register("riskProfile")} className="sr-only" />
                      <div className={`text-center py-3 rounded-lg border text-sm font-medium transition-colors ${
                        watch("riskProfile") === r ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}>{r}</div>
                    </label>
                  ))}
                </div>
                {errors.riskProfile && <p className={errCls}>{errors.riskProfile.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Skenario Dinamis (opsional)</label>
                <div className="flex flex-wrap gap-2">
                  {DYNAMIC_SCENARIOS.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => toggleArray("dynamicScenarios", s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedScenarios.includes(s)
                          ? "bg-green-600 border-green-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                  Lanjut Step 3 <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Description & Submit ── */}
          {step === 3 && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-blue-400">Step 3: Deskripsi Ide</h2>

              <div>
                <div className="flex justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Deskripsi Ide Startup *</label>
                  <span className={`text-xs ${descText.length < 50 ? "text-red-400" : "text-gray-500"}`}>
                    {descText.length}/2000
                  </span>
                </div>
                <textarea
                  {...register("ideaDescription")}
                  rows={8}
                  placeholder="Ceritakan ide startup kamu secara detail: masalah yang diselesaikan, target pengguna, solusi yang ditawarkan, keunggulan kompetitif, rencana awal monetisasi, dan konteks lainnya yang relevan. Minimal 50 karakter."
                  className={inputCls + " resize-none"}
                />
                {errors.ideaDescription && <p className={errCls}>{errors.ideaDescription.message}</p>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Memulai Analisis...</>
                  ) : (
                    <>Analisis Sekarang <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
