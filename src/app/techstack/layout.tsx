import type { Metadata } from "next";
import { TOTAL_APPS } from "@/data/apps";

export const metadata: Metadata = {
  title: "Crypto App Tech Stacks — Frameworks, Analytics & Tools | Darkscreens",
  description: `Discover the technology stacks behind ${TOTAL_APPS} crypto products. Frameworks, CSS libraries, analytics tools, error tracking, and more.`,
  alternates: { canonical: "/techstack" },
  openGraph: {
    title: "Crypto App Tech Stacks | Darkscreens",
    description: `Discover the technology stacks behind ${TOTAL_APPS} crypto products.`,
    url: "https://darkscreens.xyz/techstack",
  },
};

export default function TechStackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
