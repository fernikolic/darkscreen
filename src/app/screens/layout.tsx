import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Browse All Crypto App Screenshots | Darkscreens",
  description: `Search and filter thousands of UI screenshots from ${TOTAL_APPS} crypto products. Browse by app, flow, category, chain, and UI element.`,
  alternates: { canonical: "/screens" },
  openGraph: {
    title: "Browse All Crypto App Screenshots | Darkscreens",
    description: `Search and filter thousands of UI screenshots from ${TOTAL_APPS} crypto products.`,
    url: "https://darkscreens.xyz/screens",
  },
};

export default function ScreensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
