"use client";

import { useState } from "react";
import { apps, type AppCategory, type FlowType } from "@/data/apps";
import { FilterBar } from "@/components/FilterBar";
import { AppCard } from "@/components/AppCard";

export default function Library() {
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">(
    "All"
  );
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">(
    "All Flows"
  );

  const filtered = apps.filter((app) => {
    if (activeCategory !== "All" && app.category !== activeCategory)
      return false;
    if (activeFlow !== "All Flows" && !app.flows.includes(activeFlow))
      return false;
    return true;
  });

  return (
    <div className="relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 dot-grid opacity-20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <span className="mb-3 block font-mono text-label uppercase text-text-tertiary">
            Browse
          </span>
          <h1 className="font-display text-display-md text-text-primary md:text-display-lg">
            The Library
          </h1>
          <p className="mt-4 max-w-lg text-body-md text-text-secondary">
            Browse screenshots from 50+ crypto products. Filter by app, category,
            and flow type.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-dark-border/30 bg-dark-card/30 p-5 backdrop-blur-sm">
          <FilterBar
            activeCategory={activeCategory}
            activeFlow={activeFlow}
            onCategoryChange={setActiveCategory}
            onFlowChange={setActiveFlow}
          />
        </div>

        {/* Results count */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-dark-border/30" />
          <span className="font-mono text-[11px] text-text-ghost">
            {filtered.length} app{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="h-px flex-1 bg-dark-border/30" />
        </div>

        {/* App grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-body-md text-text-tertiary">
              No apps match the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
