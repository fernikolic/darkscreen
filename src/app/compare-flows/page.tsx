import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowComparisonTool } from "@/components/FlowComparisonTool";

export const metadata: Metadata = {
  title: "Compare Flows Across Crypto Apps — Darkscreens",
  description:
    "Side-by-side flow comparison tool. Select 2-4 crypto apps and a flow type to compare how they handle swaps, onboarding, sends, and more.",
  alternates: { canonical: "/compare-flows" },
  openGraph: {
    title: "Compare Flows Across Crypto Apps",
    description:
      "Side-by-side flow comparison tool for crypto products. Compare swap, onboarding, send, and staking flows.",
    url: "https://darkscreens.xyz/compare-flows",
    siteName: "Darkscreens",
    type: "website",
  },
};

export default function CompareFlowsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Compare
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Compare flows across apps
        </h1>
        <p className="mt-3 max-w-xl text-[14px] text-text-secondary">
          Select 2-4 apps and a flow type to see how different products handle the same user journey.
        </p>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-text-tertiary">Loading...</div>}>
        <FlowComparisonTool />
      </Suspense>
    </div>
  );
}
