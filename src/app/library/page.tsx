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
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          The Library
        </h1>
        <p className="mt-3 text-zinc-400">
          Explore screens and flows from 35+ crypto products
        </p>
      </div>

      {/* Filters */}
      <div className="mb-10">
        <FilterBar
          activeCategory={activeCategory}
          activeFlow={activeFlow}
          onCategoryChange={setActiveCategory}
          onFlowChange={setActiveFlow}
        />
      </div>

      {/* Results count */}
      <div className="mb-6">
        <span className="font-mono text-sm text-zinc-500">
          {filtered.length} app{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* App grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-zinc-500">
            No apps match the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}
