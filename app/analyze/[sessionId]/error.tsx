"use client";

// Route-level error boundary for the result page. If anything in this route
// throws during render, the user sees a friendly retry screen instead of the
// black "Application error: a client-side exception has occurred" page.
export default function AnalyzeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-md text-center">
        <div className="text-5xl mb-4">🛠️</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Terjadi gangguan menampilkan hasil</h1>
        <p className="text-sm text-gray-400 mb-6">
          Analisis mungkin sudah selesai, tetapi ada kendala saat menampilkannya.
          Silakan coba lagi atau mulai analisis baru.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
          >
            Coba Lagi
          </button>
          <a
            href="/analyze"
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors"
          >
            Analisis Baru
          </a>
        </div>
        {error?.digest && (
          <p className="text-[10px] text-gray-600 mt-4 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
