"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type CryptoApp, type AppCategory, type IntelLayer } from "@/data/apps";
import { screenshotUrl } from "@/lib/screenshot-url";

interface IntelBrowseContentProps {
  layer: IntelLayer;
  apps: CryptoApp[];
  categories: readonly AppCategory[];
}

export function IntelBrowseContent({
  layer,
  apps,
  categories,
}: IntelBrowseContentProps) {
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");

  const filtered =
    activeCategory === "All"
      ? apps
      : apps.filter((a) => a.category === activeCategory);

  const presentCategories = categories.filter((cat) =>
    apps.some((a) => a.category === cat)
  );

  return (
    <>
      {/* Category filter */}
      {presentCategories.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory("All")}
            className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
              activeCategory === "All"
                ? "border-white/60 text-white"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            All
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
                activeCategory === cat
                  ? "border-white/60 text-white"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* App grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((app) => (
            <Link
              key={app.slug}
              href={`/library/${app.slug}?layer=${layer.toLowerCase()}`}
              className="group block"
            >
              <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
                  {app.thumbnail ? (
                    <Image
                      src={screenshotUrl(app.thumbnail)!}
                      alt={`${app.name} screenshot`}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                        {app.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="border-b border-white/25 pb-0.5 text-[13px] font-medium text-white">
                      View {layer} Screens
                    </span>
                  </div>
                </div>
                <div className="border-t border-dark-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-medium text-text-primary">
                      {app.name}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                      {app.category}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {app.chains[0]}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="mb-2 text-[14px] text-text-tertiary">
            No products with {layer.toLowerCase()} intelligence yet.
          </p>
          <p className="text-[13px] text-text-tertiary/60">
            We&apos;re actively capturing {layer.toLowerCase()} pages. Check back soon.
          </p>
        </div>
      )}
    </>
  );
}
