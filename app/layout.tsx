import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeasiFlow AI — Analisis Kelayakan Startup",
  description:
    "Validasi ide startup kamu dalam menit menggunakan Agentic AI. Business Model Canvas + Market Research otomatis. Skor 0-100.",
  openGraph: {
    title: "FeasiFlow AI",
    description: "Agentic AI untuk analisis kelayakan ide startup",
    url: "https://feasiflow-ai.vercel.app",
    siteName: "FeasiFlow AI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
