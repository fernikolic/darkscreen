"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apps, FLOW_TYPES, type FlowType } from "@/data/apps";
import { getFlowsForApps, getMaxStepCount } from "@/data/helpers";
import { FlowComparisonColumn } from "./FlowComparisonColumn";
import { StepComparisonRow } from "./StepComparisonRow";

type ViewMode = "side-by-side" | "step-by-step";

export function FlowComparisonTool() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialApps = searchParams.get("apps")?.split(",").filter(Boolean) || [];
  const initialFlow = (searchParams.get("flow") || "Swap") as FlowType;

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    initialApps.length > 0 ? initialApps.slice(0, 4) : []
  );
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(
    FLOW_TYPES.includes(initialFlow) ? initialFlow : "Swap"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [appSearch, setAppSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update URL when selection changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSlugs.length > 0) params.set("apps", selectedSlugs.join(","));
    params.set("flow", selectedFlow);
    router.replace(`/compare-flows?${params.toString()}`, { scroll: false });
  }, [selectedSlugs, selectedFlow, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Available apps for the selected flow
  const availableApps = useMemo(
    () => apps.filter((app) => app.flows.includes(selectedFlow) && app.screens.length > 0),
    [selectedFlow]
  );

  const filteredApps = useMemo(() => {
    if (!appSearch.trim()) return availableApps.filter((a) => !selectedSlugs.includes(a.slug));
    const q = appSearch.toLowerCase();
    return availableApps.filter(
      (a) => !selectedSlugs.includes(a.slug) && a.name.toLowerCase().includes(q)
    );
  }, [availableApps, appSearch, selectedSlugs]);

  const flows = useMemo(
    () => getFlowsForApps(selectedSlugs, selectedFlow),
    [selectedSlugs, selectedFlow]
  );

  const maxSteps = useMemo(() => getMaxStepCount(flows), [flows]);

  const addApp = useCallback((slug: string) => {
    setSelectedSlugs((prev) => (prev.length < 4 ? [...prev, slug] : prev));
    setAppSearch("");
    setShowDropdown(false);
  }, []);

  const removeApp = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  // Sync-scroll for side-by-side
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 space-y-4">
        {/* Flow selector */}
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Flow type
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FLOW_TYPES.map((flow) => (
              <button
                key={flow}
                onClick={() => {
                  setSelectedFlow(flow);
                  // Keep only apps that have this flow
                  setSelectedSlugs((prev) =>
                    prev.filter((s) => {
                      const app = apps.find((a) => a.slug === s);
                      return app?.flows.includes(flow);
                    })
                  );
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                  selectedFlow === flow
                    ? "border-white/20 text-text-primary"
                    : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
                }`}
              >
                {flow}
              </button>
            ))}
          </div>
        </div>

        {/* App selector */}
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Apps to compare (max 4)
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSlugs.map((slug) => {
              const app = apps.find((a) => a.slug === slug);
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 border border-dark-border bg-dark-card px-3 py-1.5 text-[12px] text-text-primary"
                >
                  {app?.name || slug}
                  <button
                    onClick={() => removeApp(slug)}
                    className="text-text-tertiary transition-colors hover:text-white"
                  >
                    &times;
                  </button>
                </span>
              );
            })}

            {selectedSlugs.length < 4 && (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Add app..."
                  className="w-40 border-b border-dark-border bg-transparent py-1.5 text-[12px] text-text-primary placeholder-text-tertiary outline-none focus:border-text-secondary"
                />
                {showDropdown && filteredApps.length > 0 && (
                  <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto border border-dark-border bg-dark-card shadow-lg">
                    {filteredApps.slice(0, 10).map((app) => (
                      <button
                        key={app.slug}
                        onClick={() => addApp(app.slug)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
                      >
                        {app.name}
                        <span className="ml-auto font-mono text-[9px] text-text-tertiary">
                          {app.screens.filter((s) => s.flow === selectedFlow).length} screens
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View mode toggle */}
        {flows.length >= 2 && (
          <div className="flex items-center gap-1 border border-dark-border w-fit">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-2 text-[12px] font-medium transition-all ${
                viewMode === "side-by-side"
                  ? "bg-white/10 text-white"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("step-by-step")}
              className={`px-3 py-2 text-[12px] font-medium transition-all ${
                viewMode === "step-by-step"
                  ? "bg-white/10 text-white"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Step by Step
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {selectedSlugs.length < 2 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            Select at least 2 apps to compare their {selectedFlow.toLowerCase()} flows.
          </p>
          <p className="mt-2 font-mono text-[11px] text-text-tertiary">
            {availableApps.length} apps have a {selectedFlow.toLowerCase()} flow
          </p>
        </div>
      )}

      {/* Comparison view */}
      {flows.length >= 2 && (
        <>
          {viewMode === "side-by-side" ? (
            <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-6">
              {flows.map((flow) => (
                <FlowComparisonColumn key={flow.appSlug} flow={flow} />
              ))}
            </div>
          ) : (
            <div>
              {Array.from({ length: maxSteps }, (_, i) => i + 1).map((step) => (
                <StepComparisonRow key={step} stepNumber={step} flows={flows} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
