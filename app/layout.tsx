import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-base text-fg antialiased">{children}</body>
    </html>
  );
}
