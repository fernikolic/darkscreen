import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Crypto User Flows — Onboarding, Swap, Send & More | Darkscreens",
  description: `Compare user flows across ${TOTAL_APPS} crypto products. See how wallets, exchanges, and DeFi protocols design onboarding, swap, send, staking, and settings flows.`,
  alternates: { canonical: "/flows" },
  openGraph: {
    title: "Crypto User Flows — Onboarding, Swap, Send & More | Darkscreens",
    description: `Compare user flows across ${TOTAL_APPS} crypto products — onboarding, swap, send, staking, and settings.`,
    url: "https://darkscreens.xyz/flows",
  },
};

export default function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
