"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  apps,
  CATEGORIES,
  FLOW_TYPES,
  SECTION_TYPES,
  STYLE_TYPES,
} from "@/data/apps";

const FLOW_LABELS: Record<string, string> = {
  Home: "Home & Dashboard",
  Onboarding: "Onboarding",
  Swap: "Swap & Trade",
  Send: "Send & Receive",
  Staking: "Staking",
  Settings: "Settings",
};

type Tab = "trending" | "categories" | "screens" | "sections" | "styles";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "trending",
    label: "Trending",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: "categories",
    label: "Categories",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: "screens",
    label: "Screens",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    id: "sections",
    label: "Sections",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    id: "styles",
    label: "Styles",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
];

// Top apps by screen count
const trendingApps = [...apps]
  .sort((a, b) => b.screenCount - a.screenCount)
  .slice(0, 8);

// Quick suggestions: mix of popular apps and filter keywords
const QUICK_SUGGESTIONS = [
  { type: "app" as const, label: "MetaMask", slug: "metamask", color: "#F6851B" },
  { type: "app" as const, label: "Uniswap", slug: "uniswap", color: "#FF007A" },
  { type: "query" as const, label: "dark mode" },
  { type: "query" as const, label: "onboarding" },
  { type: "app" as const, label: "Aave", slug: "aave", color: "#B6509E" },
];

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const searchResults = query.trim()
    ? apps
        .filter((app) => {
          const q = query.toLowerCase();
          return (
            app.name.toLowerCase().includes(q) ||
            app.description.toLowerCase().includes(q) ||
            app.slug.toLowerCase().includes(q) ||
            app.category.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : null;

  const navigateToApp = (slug: string) => {
    router.push(`/library/${slug}`);
    onClose();
  };

  const navigateToFilter = (param: string, value: string) => {
    router.push(`/library?${param}=${encodeURIComponent(value)}`);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/library?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const categoryAppCounts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = apps.filter((a) => a.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Overlay panel */}
      <div
        ref={overlayRef}
        className="search-overlay-enter relative mx-auto mt-[10vh] max-w-3xl px-4"
      >
        <div className="overflow-hidden rounded-2xl border border-dark-border/80 bg-[#1a1a1d] shadow-2xl shadow-black/50">
          {/* Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className="border-b border-dark-border/60 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 shrink-0 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Apps, Screens, Sections, Styles or Keywords..."
                className="w-full bg-transparent text-[17px] text-text-primary placeholder-text-tertiary outline-none"
              />
              <kbd className="hidden shrink-0 rounded-md border border-dark-border/60 bg-dark-card/50 px-2 py-0.5 font-mono text-[11px] text-text-tertiary sm:inline">
                ESC
              </kbd>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 border-b border-dark-border/60 px-5 py-3">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  if (s.type === "app" && s.slug) {
                    navigateToApp(s.slug);
                  } else {
                    setQuery(s.label);
                  }
                }}
                className="flex items-center gap-2 rounded-full border border-dark-border/60 bg-dark-card/50 px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
              >
                {s.type === "app" && s.slug ? (
                  <Image
                    src={`/logos/${s.slug}.png`}
                    alt={s.label}
                    width={20}
                    height={20}
                    className="rounded-md"
                  />
                ) : (
                  <svg
                    className="h-3.5 w-3.5 text-text-tertiary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
                {s.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          {searchResults ? (
            /* Search results */
            <div className="max-h-[55vh] overflow-y-auto p-3">
              {searchResults.length === 0 ? (
                <p className="py-12 text-center text-[14px] text-text-tertiary">
                  No results for &ldquo;{query}&rdquo;
                </p>
              ) : (
                <div className="space-y-0.5">
                  {searchResults.map((app) => (
                    <button
                      key={app.slug}
                      onClick={() => navigateToApp(app.slug)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
                    >
                      <Image
                        src={`/logos/${app.slug}.png`}
                        alt={app.name}
                        width={40}
                        height={40}
                        className="shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium text-text-primary">
                          {app.name}
                        </div>
                        <div className="text-[12px] text-text-tertiary">
                          {app.category} &middot; {app.screenCount} screens
                        </div>
                      </div>
                      <svg
                        className="h-4 w-4 shrink-0 text-text-tertiary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Browse tabs */
            <div className="flex max-h-[55vh]">
              {/* Left sidebar */}
              <div className="w-48 shrink-0 border-r border-dark-border/60 p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-white/[0.08] text-white"
                        : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Right content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Trending */}
                {activeTab === "trending" && (
                  <div>
                    <div className="mb-5 flex flex-wrap gap-3">
                      {trendingApps.map((app) => (
                        <button
                          key={app.slug}
                          onClick={() => navigateToApp(app.slug)}
                          className="group relative"
                          title={app.name}
                        >
                          <Image
                            src={`/logos/${app.slug}.png`}
                            alt={app.name}
                            width={52}
                            height={52}
                            className="rounded-2xl shadow-lg transition-transform duration-150 group-hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>

                    <h4 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                      Screens
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {FLOW_TYPES.map((flow) => (
                        <button
                          key={flow}
                          onClick={() =>
                            navigateToFilter("flow", flow.toLowerCase())
                          }
                          className="rounded-xl bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                        >
                          <span className="text-[14px] font-medium text-text-primary">
                            {FLOW_LABELS[flow] || flow}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {activeTab === "categories" && (
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() =>
                          navigateToFilter("category", cat.toLowerCase())
                        }
                        className="rounded-xl bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                      >
                        <span className="text-[14px] font-medium text-text-primary">
                          {cat}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-text-tertiary">
                          {categoryAppCounts[cat]} apps
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Screens */}
                {activeTab === "screens" && (
                  <div className="grid grid-cols-2 gap-2">
                    {FLOW_TYPES.map((flow) => {
                      const count = apps.filter((a) =>
                        a.flows.includes(flow)
                      ).length;
                      return (
                        <button
                          key={flow}
                          onClick={() =>
                            navigateToFilter("flow", flow.toLowerCase())
                          }
                          className="rounded-xl bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                        >
                          <span className="text-[14px] font-medium text-text-primary">
                            {FLOW_LABELS[flow] || flow}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-text-tertiary">
                            {count} apps
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sections */}
                {activeTab === "sections" && (
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_TYPES.map((section) => {
                      const count = apps.filter((a) =>
                        a.sections.includes(section)
                      ).length;
                      return (
                        <button
                          key={section}
                          onClick={() =>
                            navigateToFilter("section", section.toLowerCase())
                          }
                          className="rounded-xl bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                        >
                          <span className="text-[14px] font-medium text-text-primary">
                            {section}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-text-tertiary">
                            {count} apps
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Styles */}
                {activeTab === "styles" && (
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_TYPES.map((style) => {
                      const count = apps.filter((a) =>
                        a.styles.includes(style)
                      ).length;
                      return (
                        <button
                          key={style}
                          onClick={() =>
                            navigateToFilter("style", style.toLowerCase())
                          }
                          className="rounded-xl bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                        >
                          <span className="text-[14px] font-medium text-text-primary">
                            {style}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-text-tertiary">
                            {count} apps
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
