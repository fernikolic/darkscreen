import type { Metadata } from "next";
import { PatternLibrary } from "@/components/PatternLibrary";

export const metadata: Metadata = {
  title: "Crypto UX Pattern Library — Darkscreens",
  description:
    "Searchable library of crypto-specific UX patterns — token selectors, gas fee breakdowns, wallet connection flows, swap forms, and more. Real examples from 150 products.",
  alternates: { canonical: "/patterns" },
  openGraph: {
    title: "Crypto UX Pattern Library",
    description:
      "Searchable library of crypto-specific UX patterns with real examples from 150 products.",
    url: "https://darkscreens.xyz/patterns",
    siteName: "Darkscreens",
    type: "website",
  },
};

export default function PatternsIndexPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Patterns
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Crypto UX Pattern Library
        </h1>
        <p className="mt-3 max-w-xl text-[14px] text-text-secondary">
          Browse crypto-specific UX patterns with real screenshots. Search by pattern type,
          UI element, or design concept.
        </p>
      </div>

      <PatternLibrary />
    </div>
  );
}
