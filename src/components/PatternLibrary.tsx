"use client";

import { useState, useMemo } from "react";
import { searchPatterns, type PatternCategory } from "@/data/patterns";
import { PatternCard } from "./PatternCard";

const CATEGORIES: Array<PatternCategory | "All"> = [
  "All",
  "UX Pattern",
  "UI Element",
  "Flow Pattern",
  "Crypto-Specific",
];

export function PatternLibrary() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PatternCategory | "All">("All");

  const results = useMemo(() => {
    const matched = searchPatterns(query);
    if (activeCategory === "All") return matched;
    return matched.filter((p) => p.category === activeCategory);
  }, [query, activeCategory]);

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patterns... (e.g. swap, gas, wallet)"
          className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
        />
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
              activeCategory === cat
                ? "border-white/20 text-text-primary"
                : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {results.length} pattern{results.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No patterns match your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((pattern) => (
            <PatternCard key={pattern.slug} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
}
