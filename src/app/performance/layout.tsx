import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Crypto App Performance Benchmarks — Load Times & Web Vitals | Darkscreens",
  description: `Compare web performance metrics across ${TOTAL_APPS}+ crypto products. Load times, LCP, CLS, transfer sizes, and resource counts for wallets, exchanges, and DeFi apps.`,
  alternates: { canonical: "/performance" },
  openGraph: {
    title: "Crypto App Performance Benchmarks | Darkscreens",
    description: `Compare web performance metrics across ${TOTAL_APPS}+ crypto products — load times, LCP, CLS, and more.`,
    url: "https://darkscreens.xyz/performance",
  },
};

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
