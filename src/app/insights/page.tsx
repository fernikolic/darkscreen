import type { Metadata } from "next";
import { InsightsPage } from "@/components/InsightsPage";

export const metadata: Metadata = {
  title: "AI-Generated Crypto UX Insights — Darkscreens",
  description:
    "Weekly AI-generated analysis of crypto product changes — UX updates, feature launches, design trends, and competitive moves across 150+ products.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "AI-Generated Crypto UX Insights",
    description:
      "Weekly AI analysis of UX changes across crypto wallets, exchanges, and DeFi protocols.",
    url: "https://darkscreens.xyz/insights",
    siteName: "Darkscreens",
    type: "website",
  },
};

export default function InsightsRoute() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Insights
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          AI-generated UX insights
        </h1>
        <p className="mt-3 max-w-xl text-[14px] text-text-secondary">
          Automated analysis of product changes — what changed, why it matters, and what to learn from it.
        </p>
      </div>

      <InsightsPage />
    </div>
  );
}
