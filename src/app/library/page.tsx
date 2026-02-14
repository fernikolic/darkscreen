"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  apps,
  CATEGORIES,
  type AppCategory,
  type FlowType,
  type PlatformType,
  type SectionType,
  type StyleType,
  FLOW_TYPES,
  PLATFORM_TYPES,
  SECTION_TYPES,
  STYLE_TYPES,
} from "@/data/apps";
import { AppCard } from "@/components/AppCard";
import { BookmarkButton } from "@/components/BookmarkButton";

type PlatformFilter = PlatformType | "All" | "Mobile";

type SortOption = "newest" | "most-screens" | "a-z" | "z-a";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Latest" },
  { value: "most-screens", label: "Most screens" },
  { value: "a-z", label: "A\u2013Z" },
];

const FLOW_LABELS: Record<string, string> = {
  Home: "Home & Dashboard",
  Onboarding: "Onboarding",
  Swap: "Swap & Trade",
  Send: "Send & Receive",
  Staking: "Staking",
  Settings: "Settings",
};

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
      const match = CATEGORIES.find(
        (cat) => cat.toLowerCase() === c.toLowerCase()
      );
      if (match) return match;
    }
    return "All" as const;
  })();

  const initialSection = (() => {
    const s = searchParams.get("section");
    if (s) {
      const match = SECTION_TYPES.find(
        (st) => st.toLowerCase() === s.toLowerCase()
      );
      if (match) return [match];
    }
    return [] as SectionType[];
  })();

  const initialStyle = (() => {
    const s = searchParams.get("style");
    if (s) {
      const match = STYLE_TYPES.find(
        (st) => st.toLowerCase() === s.toLowerCase()
      );
      if (match) return [match];
    }
    return [] as StyleType[];
  })();

  const initialPlatform = ((): PlatformFilter => {
    const p = searchParams.get("platform");
    if (p) {
      if (p.toLowerCase() === "mobile") return "Mobile";
      const match = PLATFORM_TYPES.find(
        (pt) => pt.toLowerCase() === p.toLowerCase()
      );
      if (match) return match;
    }
    return "All";
  })();

  const initialSearch = searchParams.get("q") || "";

  const [activePlatform, setActivePlatform] = useState<PlatformFilter>(
    initialPlatform
  );
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">(
    initialCategory
  );
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">(
    "All Flows"
  );
  const [activeSections, setActiveSections] =
    useState<SectionType[]>(initialSection);
  const [activeStyles, setActiveStyles] = useState<StyleType[]>(initialStyle);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sync URL params on client-side navigation
  useEffect(() => {
    const p = searchParams.get("platform");
    if (p) {
      if (p.toLowerCase() === "mobile") {
        setActivePlatform("Mobile");
      } else {
        const match = PLATFORM_TYPES.find(
          (pt) => pt.toLowerCase() === p.toLowerCase()
        );
        setActivePlatform(match || "All");
      }
    }
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const toggleSection = (section: SectionType) => {
    setActiveSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleStyle = (style: StyleType) => {
    setActiveStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  const hasActiveFilters =
    activeCategory !== "All" ||
    activeFlow !== "All Flows" ||
    activeSections.length > 0 ||
    activeStyles.length > 0 ||
    activePlatform !== "All";

  const clearFilters = () => {
    setActiveCategory("All");
    setActiveFlow("All Flows");
    setActiveSections([]);
    setActiveStyles([]);
    setActivePlatform("All");
    setSearch("");
  };

  const filtered = apps.filter((app) => {
    if (activePlatform === "Mobile") {
      if (!app.platforms.includes("iOS") && !app.platforms.includes("Android"))
        return false;
    } else if (activePlatform !== "All") {
      if (!app.platforms.includes(activePlatform)) return false;
      if (activePlatform !== "Web" && app.platforms.includes("Web"))
        return false;
    }
    if (activeCategory !== "All" && app.category !== activeCategory)
      return false;
    if (activeFlow !== "All Flows" && !app.flows.includes(activeFlow))
      return false;
    if (
      activeSections.length > 0 &&
      !activeSections.some((s) => app.sections.includes(s))
    )
      return false;
    if (
      activeStyles.length > 0 &&
      !activeStyles.some((s) => app.styles.includes(s))
    )
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
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      {/* Browse grid — Mobbin-style 4-column discovery */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-16">
        {/* Categories */}
        <div>
          <h3 className="mb-5 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
            Categories
          </h3>
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? "All" : cat)
                }
                className={`block font-heading text-lg font-bold transition-colors md:text-[22px] ${
                  activeCategory === cat
                    ? "text-white"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Screens (flows) */}
        <div>
          <h3 className="mb-5 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
            Screens
          </h3>
          <div className="space-y-1.5">
            {FLOW_TYPES.map((flow) => (
              <button
                key={flow}
                onClick={() =>
                  setActiveFlow(activeFlow === flow ? "All Flows" : flow)
                }
                className={`block font-heading text-lg font-bold transition-colors md:text-[22px] ${
                  activeFlow === flow
                    ? "text-white"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {FLOW_LABELS[flow] || flow}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div>
          <h3 className="mb-5 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
            Sections
          </h3>
          <div className="space-y-1.5">
            {SECTION_TYPES.slice(0, 6).map((section) => (
              <button
                key={section}
                onClick={() => toggleSection(section)}
                className={`block font-heading text-lg font-bold transition-colors md:text-[22px] ${
                  activeSections.includes(section)
                    ? "text-white"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div>
          <h3 className="mb-5 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
            Styles
          </h3>
          <div className="space-y-1.5">
            {STYLE_TYPES.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`block font-heading text-lg font-bold transition-colors md:text-[22px] ${
                  activeStyles.includes(style)
                    ? "text-white"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-dark-border/50 pt-5">
        {/* Platform pills */}
        <div className="flex items-center gap-0.5 rounded-lg bg-dark-card p-1">
          {(["Web", "Mobile"] as const).map((platform) => (
            <button
              key={platform}
              onClick={() =>
                setActivePlatform(
                  activePlatform === platform ? "All" : platform
                )
              }
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-all ${
                activePlatform === platform
                  ? "bg-dark-border/80 text-white"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="hidden h-5 w-px bg-dark-border/50 md:block" />

        {/* Sort tabs */}
        <div className="flex items-center gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
                sortBy === opt.value
                  ? "text-white underline decoration-2 underline-offset-[6px]"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right side: results + clear */}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11px] text-text-tertiary">
            {sorted.length} app{sorted.length !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* App grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((app) => (
          <AppCard
            key={app.slug}
            app={app}
            bookmarkButton={<BookmarkButton slug={app.slug} />}
          />
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
