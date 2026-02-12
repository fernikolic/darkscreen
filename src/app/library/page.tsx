"use client";

import { useState } from "react";
import { apps, type AppCategory, type FlowType, type ChainType } from "@/data/apps";
import { FilterBar } from "@/components/FilterBar";
import { AppCard } from "@/components/AppCard";

const CHAINS: Array<ChainType | "All Chains"> = [
  "All Chains",
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Multi-chain",
];

export default function Library() {
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">(
    "All"
  );
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">(
    "All Flows"
  );
  const [activeChain, setActiveChain] = useState<ChainType | "All Chains">(
    "All Chains"
  );
  const [search, setSearch] = useState("");

  const filtered = apps.filter((app) => {
    if (activeCategory !== "All" && app.category !== activeCategory)
      return false;
    if (activeFlow !== "All Flows" && !app.flows.includes(activeFlow))
      return false;
    if (activeChain !== "All Chains" && !app.chains.includes(activeChain))
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !app.name.toLowerCase().includes(q) &&
        !app.description.toLowerCase().includes(q) &&
        !app.slug.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Library
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
          Explore the collection
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Screens and flows from 35+ crypto products
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
        />
      </div>

      {/* Chain filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CHAINS.map((chain) => (
          <button
            key={chain}
            onClick={() => setActiveChain(chain)}
            className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
              activeChain === chain
                ? "border-accent-gold text-accent-gold"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Category + Flow filters */}
      <div className="mb-10">
        <FilterBar
          activeCategory={activeCategory}
          activeFlow={activeFlow}
          onCategoryChange={setActiveCategory}
          onFlowChange={setActiveFlow}
        />
      </div>

      {/* Results count */}
      <div className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* App grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No apps match the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}
