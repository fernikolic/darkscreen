import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Crypto UI Changelog — Track Design Changes | Darkscreens",
  description: `Track UI changes across ${TOTAL_APPS} crypto products. Visual changelog showing new features, redesigns, copy changes, and layout shifts in wallets, exchanges, and DeFi apps.`,
  alternates: { canonical: "/changes" },
  openGraph: {
    title: "Crypto UI Changelog — Track Design Changes | Darkscreens",
    description: `Track UI changes across ${TOTAL_APPS} crypto products. Visual changelog showing new features, redesigns, and layout shifts.`,
    url: "https://darkscreens.xyz/changes",
  },
};

export default function ChangesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
