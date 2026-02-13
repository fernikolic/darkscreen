"use client";

import { useState, useMemo, useCallback } from "react";
import { type AppCategory, type FlowType, type ChainType, CATEGORIES, FLOW_TYPES, CHAIN_TYPES } from "@/data/apps";
import { getAllFlows, type AppFlow, type EnrichedScreen } from "@/data/helpers";
import { FlowCard } from "@/components/FlowCard";
import { FlowExpandedView } from "@/components/FlowExpandedView";
import { ScreenModal } from "@/components/ScreenModal";

const CHAINS: Array<ChainType | "All Chains"> = ["All Chains", ...CHAIN_TYPES];
const CATEGORIES_ALL: Array<AppCategory | "All"> = ["All", ...CATEGORIES];
const FLOWS_ALL: Array<FlowType | "All Flows"> = ["All Flows", ...FLOW_TYPES];

export default function FlowsPage() {
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<ChainType | "All Chains">("All Chains");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">("All Flows");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);

  const allFlows = useMemo(() => getAllFlows(), []);

  const filtered = useMemo(() => {
    return allFlows.filter((f) => {
      if (activeChain !== "All Chains" && !f.appChains.includes(activeChain)) return false;
      if (activeCategory !== "All" && f.appCategory !== activeCategory) return false;
      if (activeFlow !== "All Flows" && f.flowType !== activeFlow) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !f.appName.toLowerCase().includes(q) &&
          !f.flowType.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allFlows, activeChain, activeCategory, activeFlow, search]);

  const flowKey = (f: AppFlow) => `${f.appSlug}-${f.flowType}`;

  const toggleExpand = (f: AppFlow) => {
    const key = flowKey(f);
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const getFlowScreensForModal = useCallback(
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
          Flows
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Browse user flows
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {allFlows.length} flows across {new Set(allFlows.map((f) => f.appSlug)).size} crypto products
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flows..."
          className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
        />
      </div>

      {/* Chain tabs */}
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

      {/* Category filter */}
      <div className="mb-6">
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Category
        </span>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES_ALL.map((cat) => (
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
      </div>

      {/* Flow type filter */}
      <div className="mb-10">
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Flow type
        </span>
        <div className="flex flex-wrap gap-1">
          {FLOWS_ALL.map((flow) => (
            <button
              key={flow}
              onClick={() => setActiveFlow(flow)}
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
          {filtered.length} flow{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Flow grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((flow) => {
          const key = flowKey(flow);
          const isExpanded = expandedKey === key;
          return (
            <div
              key={key}
              className={isExpanded ? "col-span-full" : ""}
            >
              <FlowCard
                flow={flow}
                isExpanded={isExpanded}
                onClick={() => toggleExpand(flow)}
              />
              {isExpanded && (
                <FlowExpandedView
                  flow={flow}
                  onScreenClick={(screen) => setModalScreen(screen)}
                />
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No flows match the selected filters.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalScreen && (
        <ScreenModal
          screen={modalScreen}
          flowScreens={getFlowScreensForModal(modalScreen)}
          onClose={() => setModalScreen(null)}
          onNavigate={setModalScreen}
        />
      )}
    </div>
  );
}
