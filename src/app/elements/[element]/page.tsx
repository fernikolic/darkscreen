import type { Metadata } from "next";
import { GRANULAR_ELEMENT_TAGS } from "@/data/apps";
import { toSlug, fromSlug } from "@/data/seo";
import { ElementDetailContent } from "./ElementDetailContent";

export function generateStaticParams() {
  return GRANULAR_ELEMENT_TAGS.map((tag) => ({
    element: toSlug(tag),
  }));
}

interface PageProps {
  params: Promise<{ element: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { element } = await params;
  const tagName = fromSlug(element, GRANULAR_ELEMENT_TAGS as unknown as string[]);
  if (!tagName) return {};

  const title = `${tagName} UI Pattern in Crypto Apps`;
  const description = `See how crypto wallets, exchanges, and DeFi protocols design ${tagName.toLowerCase()} components. Real screenshots from shipped products.`;

  return {
    title: `${title} — Darkscreens`,
    description,
    alternates: { canonical: `/elements/${element}` },
    openGraph: {
      title,
      description,
      url: `https://darkscreens.xyz/elements/${element}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function ElementDetailPage({ params }: PageProps) {
  const { element } = await params;
  return <ElementDetailContent elementSlug={element} />;
}
