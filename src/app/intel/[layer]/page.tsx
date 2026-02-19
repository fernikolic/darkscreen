import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type IntelLayer,
  INTEL_LAYERS,
  INTEL_LAYER_META,
  CATEGORIES,
  type AppCategory,
} from "@/data/apps";
import { getAppsByLayer } from "@/data/helpers";
import { IntelBrowseContent } from "./IntelBrowseContent";

const LAYER_SLUGS: Record<string, IntelLayer> = {
  pricing: "Pricing",
  marketing: "Marketing",
  careers: "Careers",
  company: "Company",
};

const NON_PRODUCT_LAYERS = INTEL_LAYERS.filter((l) => l !== "Product");

export function generateStaticParams() {
  return NON_PRODUCT_LAYERS.map((layer) => ({
    layer: layer.toLowerCase(),
  }));
}

interface PageProps {
  params: Promise<{ layer: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { layer: slug } = await params;
  const layer = LAYER_SLUGS[slug];
  if (!layer) return {};

  const meta = INTEL_LAYER_META[layer];
  return {
    title: `${meta.label} Intelligence — Darkscreens`,
    description: `${meta.description}. Track ${meta.label.toLowerCase()} across crypto products.`,
    alternates: { canonical: `/intel/${slug}` },
    openGraph: {
      title: `${meta.label} Intelligence — Darkscreens`,
      description: `${meta.description}. Track ${meta.label.toLowerCase()} across crypto products.`,
      url: `https://darkscreens.xyz/intel/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function IntelLayerPage({ params }: PageProps) {
  const { layer: slug } = await params;
  const layer = LAYER_SLUGS[slug];

  if (!layer) {
    notFound();
  }

  const meta = INTEL_LAYER_META[layer];
  const appsWithLayer = getAppsByLayer(layer);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Back link */}
      <Link
        href="/library"
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">
          &larr;
        </span>
        Back to Library
      </Link>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px]"
            style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
          >
            {meta.icon === "dollar" && "$"}
            {meta.icon === "megaphone" && "M"}
            {meta.icon === "users" && "U"}
            {meta.icon === "building" && "B"}
          </span>
          <p
            className="font-mono text-[11px] uppercase tracking-[0.2em]"
            style={{ color: meta.color }}
          >
            Intelligence
          </p>
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {meta.label} Intelligence
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {meta.description}. Tracked across {appsWithLayer.length > 0 ? appsWithLayer.length : "crypto"} products.
        </p>
      </div>

      {/* Layer cross-links */}
      <div className="mb-10 flex flex-wrap gap-2">
        {NON_PRODUCT_LAYERS.map((l) => {
          const lMeta = INTEL_LAYER_META[l];
          const isActive = l === layer;
          return (
            <Link
              key={l}
              href={`/intel/${l.toLowerCase()}`}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "border-dark-border text-text-tertiary hover:text-text-secondary"
              }`}
              style={{
                borderColor: isActive ? lMeta.color : undefined,
                backgroundColor: isActive ? `${lMeta.color}10` : undefined,
              }}
            >
              {lMeta.label}
            </Link>
          );
        })}
      </div>

      <IntelBrowseContent
        layer={layer}
        apps={appsWithLayer}
        categories={CATEGORIES}
      />
    </div>
  );
}
