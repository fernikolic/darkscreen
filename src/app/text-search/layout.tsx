import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Search Crypto App Screenshots by Text & OCR | Darkscreens",
  description: `Search inside crypto app screenshots using OCR text extraction. Find specific UI copy, error messages, and labels across ${TOTAL_APPS}+ products.`,
  alternates: { canonical: "/text-search" },
  openGraph: {
    title: "Search Crypto App Screenshots by Text & OCR | Darkscreens",
    description: `Search inside crypto app screenshots using OCR text extraction across ${TOTAL_APPS}+ products.`,
    url: "https://darkscreens.xyz/text-search",
  },
};

export default function TextSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
