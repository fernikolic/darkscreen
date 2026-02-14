"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  apps,
  TOTAL_APPS,
  CATEGORIES,
  type AppCategory,
  type FlowType,
  type ChainType,
  type PlatformType,
  type SectionType,
  type StyleType,
  type IntelLayer,
  CHAIN_TYPES,
  PLATFORM_TYPES,
  SECTION_TYPES,
  STYLE_TYPES,
  INTEL_LAYERS,
} from "@/data/apps";
import { getScreenLayer } from "@/data/helpers";
import { FilterBar } from "@/components/FilterBar";
import { AppCard } from "@/components/AppCard";
import { SortControl, type SortOption } from "@/components/SortControl";
import { BookmarkButton } from "@/components/BookmarkButton";

const CHAINS: Array<ChainType | "All Chains"> = ["All Chains", ...CHAIN_TYPES];

function parseDate(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function LibraryContent() {
  const searchParams = useSearchParams();

  // Read initial state from URL params
  const initialCategory = (() => {
    const c = searchParams.get("category");
    if (c) {
      const match = CATEGORIES.find((cat) => cat.toLowerCase() === c.toLowerCase());
      if (match) return match;
    }
    return "All" as const;
  })();

  const initialSection = (() => {
    const s = searchParams.get("section");
    if (s) {
      const match = SECTION_TYPES.find((st) => st.toLowerCase() === s.toLowerCase());
      if (match) return [match];
    }
    return [] as SectionType[];
  })();

  const initialStyle = (() => {
    const s = searchParams.get("style");
    if (s) {
      const match = STYLE_TYPES.find((st) => st.toLowerCase() === s.toLowerCase());
      if (match) return [match];
    }
    return [] as StyleType[];
  })();

  const initialLayer = (() => {
    const l = searchParams.get("layer");
    if (l) {
      const match = INTEL_LAYERS.find((il) => il.toLowerCase() === l.toLowerCase());
      if (match) return match;
    }
    return "All" as const;
  })();

  const initialPlatform = (() => {
    const p = searchParams.get("platform");
    if (p) {
      const match = PLATFORM_TYPES.find((pt) => pt.toLowerCase() === p.toLowerCase());
      if (match) return match;
    }
    return "All" as const;
  })();

  const [activePlatform, setActivePlatform] = useState<PlatformType | "All">(initialPlatform);
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">(initialCategory);
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">("All Flows");
  const [activeChain, setActiveChain] = useState<ChainType | "All Chains">("All Chains");
  const [activeSections, setActiveSections] = useState<SectionType[]>(initialSection);
  const [activeStyles, setActiveStyles] = useState<StyleType[]>(initialStyle);
  const [activeLayer, setActiveLayer] = useState<IntelLayer | "All">(initialLayer);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sync URL params → state on client-side navigation (e.g. Header platform links)
  useEffect(() => {
    const p = searchParams.get("platform");
    if (p) {
      const match = PLATFORM_TYPES.find((pt) => pt.toLowerCase() === p.toLowerCase());
      setActivePlatform(match || "All");
    } else {
      setActivePlatform("All");
    }
  }, [searchParams]);

  const filtered = apps.filter((app) => {
    if (activePlatform !== "All" && !app.platforms.includes(activePlatform)) return false;
    if (activeLayer !== "All" && !app.screens.some((s) => getScreenLayer(s) === activeLayer)) return false;
    if (activeCategory !== "All" && app.category !== activeCategory) return false;
    if (activeFlow !== "All Flows" && !app.flows.includes(activeFlow)) return false;
    if (activeChain !== "All Chains" && !app.chains.includes(activeChain)) return false;
    if (activeSections.length > 0 && !activeSections.some((s) => app.sections.includes(s))) return false;
    if (activeStyles.length > 0 && !activeStyles.some((s) => app.styles.includes(s))) return false;
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

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return parseDate(b.lastUpdated) - parseDate(a.lastUpdated);
      case "most-screens":
        return b.screenCount - a.screenCount;
      case "a-z":
        return a.name.localeCompare(b.name);
      case "z-a":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Apps
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Explore the collection
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Screens and flows from {TOTAL_APPS}+ crypto products
        </p>
      </div>

      {/* Platform tabs */}
      <div className="mb-8 flex flex-wrap gap-1">
        {(["All", ...PLATFORM_TYPES] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`rounded-full px-4 py-2 text-[14px] font-medium transition-all ${
              activePlatform === platform
                ? "bg-white text-dark-bg"
                : "bg-dark-card text-text-tertiary hover:bg-dark-border/50 hover:text-text-secondary"
            }`}
          >
            {platform}
          </button>
        ))}
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
                ? "border-white/60 text-white"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Category + Flow + Platform + Section + Style filters */}
      <div className="mb-10">
        <FilterBar
          activeCategory={activeCategory}
          activeFlow={activeFlow}
          activeSections={activeSections}
          activeStyles={activeStyles}
          activeLayer={activeLayer}
          onCategoryChange={setActiveCategory}
          onFlowChange={setActiveFlow}
          onSectionsChange={setActiveSections}
          onStylesChange={setActiveStyles}
          onLayerChange={setActiveLayer}
        />
      </div>

      {/* Sort + Results count */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {sorted.length} result{sorted.length !== 1 ? "s" : ""}
        </span>
        <SortControl value={sortBy} onChange={setSortBy} />
      </div>

      {/* App grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((app) => (
          <AppCard key={app.slug} app={app} bookmarkButton={<BookmarkButton slug={app.slug} />} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No apps match the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Library() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="animate-pulse">
            <div className="mb-4 h-4 w-16 rounded bg-dark-border" />
            <div className="mb-3 h-10 w-64 rounded bg-dark-border" />
            <div className="h-5 w-80 rounded bg-dark-border" />
          </div>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
