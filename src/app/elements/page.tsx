"use client";

import { useMemo } from "react";
import { getAllElements } from "@/data/helpers";
import { ElementGrid } from "@/components/ElementGrid";

export default function ElementsPage() {
  const elements = useMemo(() => getAllElements(), []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Elements
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          UI Elements
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Browse {elements.length} UI element types detected across crypto products.
          See how different apps implement the same components.
        </p>
      </div>

      {elements.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No elements detected yet. Run the detection script:
          </p>
          <code className="mt-2 inline-block rounded bg-dark-card px-3 py-1 font-mono text-[12px] text-text-secondary">
            node scripts/detect-elements.mjs
          </code>
        </div>
      ) : (
        <ElementGrid
          elements={elements.map((el) => ({
            tag: el.tag,
            count: el.count,
            thumbnail: el.thumbnail,
          }))}
        />
      )}
    </div>
  );
}
