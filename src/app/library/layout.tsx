import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: `Crypto App Design Library — Browse ${TOTAL_APPS} Products | Darkscreens`,
  description: `Browse UI screenshots and design patterns from ${TOTAL_APPS} crypto wallets, exchanges, and DeFi protocols. Filter by category, flow, style, and platform.`,
  alternates: { canonical: "/library" },
  openGraph: {
    title: `Crypto App Design Library — Browse ${TOTAL_APPS} Products | Darkscreens`,
    description: `Browse UI screenshots and design patterns from ${TOTAL_APPS} crypto wallets, exchanges, and DeFi protocols.`,
    url: "https://darkscreens.xyz/library",
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
