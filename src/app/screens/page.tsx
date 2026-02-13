"use client";

import { useState, useMemo, useCallback } from "react";
import { type AppCategory, type FlowType, type ChainType, CATEGORIES, FLOW_TYPES, CHAIN_TYPES } from "@/data/apps";
import { getAllScreens, getAllFlows, type EnrichedScreen } from "@/data/helpers";
import { buildSearchIndex, searchScreens } from "@/lib/search";
import { ScreenCard } from "@/components/ScreenCard";
import { ScreenModal } from "@/components/ScreenModal";

const CHAINS: Array<ChainType | "All Chains"> = ["All Chains", ...CHAIN_TYPES];
const CATEGORIES_ALL: Array<AppCategory | "All"> = ["All", ...CATEGORIES];
const FLOWS_ALL: Array<FlowType | "All Flows"> = ["All Flows", ...FLOW_TYPES];
const PAGE_SIZE = 48;

export default function ScreensPage() {
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<ChainType | "All Chains">("All Chains");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">("All Flows");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);

  const allScreens = useMemo(() => getAllScreens(), []);
  const allFlows = useMemo(() => getAllFlows(), []);
  const { fuse } = useMemo(() => buildSearchIndex(allScreens), [allScreens]);

  const filtered = useMemo(() => {
    // If there's a search query, use Fuse.js for fuzzy + OCR search
    let results: EnrichedScreen[];
    if (search.trim()) {
      results = searchScreens(fuse, search);
    } else {
      results = allScreens;
    }

    // Apply filters on top of search results
    return results.filter((s) => {
      if (activeChain !== "All Chains" && !s.appChains.includes(activeChain)) return false;
      if (activeCategory !== "All" && s.appCategory !== activeCategory) return false;
      if (activeFlow !== "All Flows" && s.flow !== activeFlow) return false;
      return true;
    });
  }, [allScreens, fuse, activeChain, activeCategory, activeFlow, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const getFlowScreens = useCallback(
    (screen: EnrichedScreen): EnrichedScreen[] => {
      const flow = allFlows.find(
        (f) => f.appSlug === screen.appSlug && f.flowType === screen.flow
      );
      return flow ? flow.screens : [screen];
    },
    [allFlows]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Screens
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Browse every screen
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {allScreens.length} screens across {new Set(allScreens.map((s) => s.appSlug)).size} crypto products
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search screens, text on screen, flows..."
          className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
        />
        {search.trim() && (
          <p className="mt-2 font-mono text-[11px] text-text-tertiary">
            Searching labels, app names, and on-screen text (OCR)
          </p>
        )}
      </div>

      {/* Chain tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CHAINS.map((chain) => (
          <button
            key={chain}
            onClick={() => {
              setActiveChain(chain);
              setVisibleCount(PAGE_SIZE);
            }}
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

      {/* Category filter */}
      <div className="mb-6">
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Category
        </span>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES_ALL.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
                activeCategory === cat
                  ? "border-accent-gold text-accent-gold"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Flow filter */}
      <div className="mb-10">
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Flow type
        </span>
        <div className="flex flex-wrap gap-1">
          {FLOWS_ALL.map((flow) => (
            <button
              key={flow}
              onClick={() => {
                setActiveFlow(flow);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-none border-b-2 px-3 py-2 text-[12px] font-medium transition-all ${
                activeFlow === flow
                  ? "border-text-secondary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {flow}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {filtered.length} screen{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Screen grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((screen, idx) => (
          <ScreenCard
            key={`${screen.appSlug}-${screen.flow}-${screen.step}-${idx}`}
            screen={screen}
            onClick={() => setModalScreen(screen)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No screens match the selected filters.
          </p>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="border border-dark-border px-6 py-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Modal */}
      {modalScreen && (
        <ScreenModal
          screen={modalScreen}
          flowScreens={getFlowScreens(modalScreen)}
          onClose={() => setModalScreen(null)}
          onNavigate={setModalScreen}
        />
      )}
    </div>
  );
}
