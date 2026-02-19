import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "UI Elements in Crypto Apps — Buttons, Modals, Forms & More | Darkscreens",
  description: `Browse UI element types detected across ${TOTAL_APPS}+ crypto products. See how different wallets, exchanges, and DeFi apps implement the same components.`,
  alternates: { canonical: "/elements" },
  openGraph: {
    title: "UI Elements in Crypto Apps — Buttons, Modals, Forms & More | Darkscreens",
    description: `Browse UI element types detected across ${TOTAL_APPS}+ crypto products.`,
    url: "https://darkscreens.xyz/elements",
  },
};

export default function ElementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
