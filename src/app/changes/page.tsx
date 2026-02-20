"use client";

import { useState, useMemo } from "react";
import { type AppCategory, type ChangeType, CATEGORIES } from "@/data/apps";
import {
  getAllChangesWithAuto,
  getChangesByWeek,
  type EnrichedAutoChange,
  type WeeklyChangeGroup,
} from "@/data/helpers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canViewChangeHistory } from "@/lib/access";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { ChangeCard } from "@/components/ChangeCard";
import { WeeklyDigest } from "@/components/WeeklyDigest";

const CHANGE_TYPES: ChangeType[] = ["New Feature", "Redesign", "Copy Change", "Layout Shift", "Removed"];
const CATEGORIES_ALL: Array<AppCategory | "All"> = ["All", ...CATEGORIES];

type ViewMode = "weekly" | "timeline";

export default function ChangesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");
  const [activeTypes, setActiveTypes] = useState<Set<ChangeType>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "auto">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  const { plan } = useSubscription();
  const canViewChanges = canViewChangeHistory(plan);

  const allChanges = useMemo(() => getAllChangesWithAuto(), []);
  const weeklyGroups = useMemo(() => getChangesByWeek(), []);

  const toggleType = (type: ChangeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const applyFilters = useMemo(() => {
    return (changes: typeof allChanges) =>
      changes.filter((c) => {
        if (activeCategory !== "All" && c.appCategory !== activeCategory) return false;
        if (activeTypes.size > 0 && !activeTypes.has(c.type)) return false;
        if (sourceFilter !== "all") {
          const isAuto = "source" in c && (c as EnrichedAutoChange).source === "auto";
          if (sourceFilter === "auto" && !isAuto) return false;
          if (sourceFilter === "manual" && isAuto) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!c.description.toLowerCase().includes(q) && !c.appName.toLowerCase().includes(q))
            return false;
        }
        return true;
      });
  }, [activeCategory, activeTypes, sourceFilter, search]);

  const filteredTimeline = useMemo(() => applyFilters(allChanges), [allChanges, applyFilters]);

  const filteredWeekly = useMemo((): WeeklyChangeGroup[] => {
    return weeklyGroups
      .map((g) => ({
        ...g,
        changes: applyFilters(g.changes),
      }))
      .filter((g) => g.changes.length > 0);
  }, [weeklyGroups, applyFilters]);

  const totalFiltered = viewMode === "weekly"
    ? filteredWeekly.reduce((n, g) => n + g.changes.length, 0)
    : filteredTimeline.length;

  const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
    "New Feature": "#22c55e",
    Redesign: "#3b82f6",
    "Copy Change": "#f59e0b",
    "Layout Shift": "#a855f7",
    Removed: "#ef4444",
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Changes
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Change feed
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {allChanges.length} changes tracked across{" "}
          {new Set(allChanges.map((c) => c.appSlug)).size} products
        </p>
      </div>

      {/* View toggle + Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-1 border border-dark-border">
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-2 text-[12px] font-medium transition-all ${
              viewMode === "weekly"
                ? "bg-white/10 text-white"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-2 text-[12px] font-medium transition-all ${
              viewMode === "timeline"
                ? "bg-white/10 text-white"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Timeline
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search changes..."
          className="flex-1 border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
        />
      </div>

      {/* Category tabs */}
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

      {/* Change type pills */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Change type
          </span>
          {activeTypes.size > 0 && (
            <button
              onClick={() => setActiveTypes(new Set())}
              className="text-[11px] text-text-tertiary transition-colors hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHANGE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                activeTypes.has(type)
                  ? "border-current text-text-primary"
                  : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
              }`}
              style={activeTypes.has(type) ? { color: CHANGE_TYPE_COLORS[type] } : undefined}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Source
          </span>
          {(["all", "manual", "auto"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                sourceFilter === src
                  ? src === "auto"
                    ? "border-cyan-500/30 text-cyan-400"
                    : "border-white/20 text-text-primary"
                  : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
              }`}
            >
              {src === "all" ? "All" : src === "manual" ? "Manual" : "Auto-detected"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {totalFiltered} change{totalFiltered !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty state */}
      {totalFiltered === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No changes match the selected filters.
          </p>
        </div>
      )}

      {/* Paywall for free users */}
      {!canViewChanges && totalFiltered > 0 && (
        <div className="relative">
          <div className="opacity-60">
            {viewMode === "weekly" && filteredWeekly.length > 0 && (
              <WeeklyDigest group={filteredWeekly[0]} defaultExpanded />
            )}
            {viewMode === "timeline" && filteredTimeline.length > 0 && (
              <div>
                {filteredTimeline.slice(0, 3).map((change, idx) => (
                  <ChangeCard
                    key={`${change.appSlug}-${change.date}-${idx}`}
                    change={change}
                    isLast={idx === 2}
                  />
                ))}
              </div>
            )}
          </div>
          <PaywallOverlay
            message={`You're seeing a preview. Upgrade to Pro to access the full change feed (${totalFiltered} changes).`}
          />
        </div>
      )}

      {/* Full content for paid users */}
      {canViewChanges && totalFiltered > 0 && (
        <>
          {viewMode === "weekly" ? (
            <div className="space-y-3">
              {filteredWeekly.map((group, idx) => (
                <WeeklyDigest
                  key={group.weekKey}
                  group={group}
                  defaultExpanded={idx === 0}
                />
              ))}
            </div>
          ) : (
            <div>
              {filteredTimeline.map((change, idx) => (
                <ChangeCard
                  key={`${change.appSlug}-${change.date}-${idx}`}
                  change={change}
                  isLast={idx === filteredTimeline.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
