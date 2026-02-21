"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { type AppCategory, type FlowType, type ChainType, type ElementTag, type DeviceType, CATEGORIES, FLOW_TYPES, CHAIN_TYPES, ELEMENT_TAGS } from "@/data/apps";
import { getAllScreens, getAllFlows, type EnrichedScreen } from "@/data/helpers";
import { buildSearchIndex, searchScreens, getOcrSnippet } from "@/lib/search";
import { ScreenCard } from "@/components/ScreenCard";
import { ScreenModal } from "@/components/ScreenModal";
import { OcrSnippet } from "@/components/OcrSnippet";
import { BatchSelect } from "@/components/BatchSelect";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getScreenLimit } from "@/lib/access";

const CHAINS: Array<ChainType | "All Chains"> = ["All Chains", ...CHAIN_TYPES];
const CATEGORIES_ALL: Array<AppCategory | "All"> = ["All", ...CATEGORIES];
const FLOWS_ALL: Array<FlowType | "All Flows"> = ["All Flows", ...FLOW_TYPES];
const DEVICES: Array<DeviceType | "All Devices"> = ["All Devices", "desktop", "mobile", "tablet"];
const DEVICE_LABELS: Record<string, string> = {
  "All Devices": "All Devices",
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
};
const PAGE_SIZE = 48;

export default function ScreensPage() {
  return (
    <Suspense>
      <ScreensPageInner />
    </Suspense>
  );
}

function ScreensPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<ChainType | "All Chains">("All Chains");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");
  const [activeFlow, setActiveFlow] = useState<FlowType | "All Flows">("All Flows");
  const [activeTags, setActiveTags] = useState<Set<ElementTag>>(new Set());
  const [activeDevice, setActiveDevice] = useState<DeviceType | "All Devices">("All Devices");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);

  // Read ?tag= from URL on mount
  useEffect(() => {
    const tagParam = searchParams.get("tag");
    if (tagParam && ELEMENT_TAGS.includes(tagParam as ElementTag)) {
      setActiveTags(new Set([tagParam as ElementTag]));
    }
  }, [searchParams]);

  const allScreens = useMemo(() => getAllScreens(), []);
  const allFlows = useMemo(() => getAllFlows(), []);
  const { fuse } = useMemo(() => buildSearchIndex(allScreens), [allScreens]);

  const toggleTag = useCallback((tag: ElementTag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  }, []);

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
      if (activeTags.size > 0) {
        const screenTags = s.tags || [];
        // Screen must have at least one of the active tags
        if (!screenTags.some((t) => activeTags.has(t))) return false;
      }
      if (activeDevice !== "All Devices") {
        const screenDevice = s.device || "desktop";
        if (screenDevice !== activeDevice) return false;
      }
      return true;
    });
  }, [allScreens, fuse, activeChain, activeCategory, activeFlow, activeTags, activeDevice, search]);

  const { plan } = useSubscription();
  const screenLimit = getScreenLimit(plan);
  const maxVisible = screenLimit !== null ? Math.min(visibleCount, screenLimit) : visibleCount;
  const visible = filtered.slice(0, maxVisible);
  const isCapped = screenLimit !== null && filtered.length > screenLimit;
  const hasMore = !isCapped && visibleCount < filtered.length;

  const getFlowScreens = useCallback(
    (screen: EnrichedScreen): EnrichedScreen[] => {
      const flow = allFlows.find(
        (f) => f.appSlug === screen.appSlug && f.flowType === screen.flow
      );
      const screens = flow ? flow.screens : [screen];
      // Only allow navigation within the visible (capped) set
      if (screenLimit !== null) {
        const visibleSet = new Set(visible.map((s) => `${s.appSlug}-${s.flow}-${s.step}`));
        return screens.filter((s) => visibleSet.has(`${s.appSlug}-${s.flow}-${s.step}`));
      }
      return screens;
    },
    [allFlows, screenLimit, visible]
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
                ? "border-white/60 text-white"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Device filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {DEVICES.map((device) => (
          <button
            key={device}
            onClick={() => {
              setActiveDevice(device);
              setVisibleCount(PAGE_SIZE);
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
              activeDevice === device
                ? "border-white/40 bg-white/10 text-white"
                : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
            }`}
          >
            {DEVICE_LABELS[device]}
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
                  ? "border-white/60 text-white"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Flow filter */}
      <div className="mb-6">
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

      {/* Element tag filter */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Element tags
          </span>
          {activeTags.size > 0 && (
            <button
              onClick={() => {
                setActiveTags(new Set());
                setVisibleCount(PAGE_SIZE);
              }}
              className="text-[11px] text-text-tertiary transition-colors hover:text-white"
            >
              Clear tags
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ELEMENT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                activeTags.has(tag)
                  ? "border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]"
                  : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + batch select */}
      <BatchSelect screens={visible}>
        {({ isSelectMode, isSelected, toggleSelect }) => (
          <>
            <div className="mb-8">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
                {filtered.length} screen{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Screen grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visible.map((screen, idx) => {
                const ocrSnippet = search.trim() && screen.image
                  ? getOcrSnippet(screen.image, search)
                  : null;
                const checked = isSelectMode && isSelected(screen);
                return (
                  <div
                    key={`${screen.appSlug}-${screen.flow}-${screen.step}-${idx}`}
                    className="relative"
                  >
                    {isSelectMode && (
                      <div
                        className="absolute left-2 top-2 z-10 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSelect(screen);
                        }}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                            checked
                              ? "border-[#00d4ff] bg-[#00d4ff]"
                              : "border-white/40 bg-black/50"
                          }`}
                        >
                          {checked && (
                            <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    <ScreenCard
                      screen={screen}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleSelect(screen);
                        } else {
                          setModalScreen(screen);
                        }
                      }}
                      searchQuery={search.trim() ? search : undefined}
                    />
                    {ocrSnippet && (
                      <OcrSnippet
                        text={ocrSnippet}
                        query={search}
                        className="mt-1.5 px-1"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </BatchSelect>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No screens match the selected filters.
          </p>
        </div>
      )}

      {/* Paywall for free users */}
      {isCapped && (
        <div className="mt-10">
          <PaywallOverlay
            message={`You're seeing ${screenLimit} of ${filtered.length} screens. Upgrade to Pro to browse all screens.`}
          />
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
