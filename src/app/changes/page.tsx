"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type AppCategory, type ChangeType, CATEGORIES } from "@/data/apps";
import { getAllChanges, getAllChangesWithAuto, type EnrichedChange, type EnrichedAutoChange } from "@/data/helpers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canViewChangeHistory } from "@/lib/access";
import { PaywallOverlay } from "@/components/PaywallOverlay";

const CHANGE_TYPES: ChangeType[] = ["New Feature", "Redesign", "Copy Change", "Layout Shift", "Removed"];
const CATEGORIES_ALL: Array<AppCategory | "All"> = ["All", ...CATEGORIES];

const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  "New Feature": "#22c55e",
  Redesign: "#3b82f6",
  "Copy Change": "#f59e0b",
  "Layout Shift": "#a855f7",
  Removed: "#ef4444",
};

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ChangesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "All">("All");
  const [activeTypes, setActiveTypes] = useState<Set<ChangeType>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "auto">("all");

  const { plan } = useSubscription();
  const canViewChanges = canViewChangeHistory(plan);

  const allChanges = useMemo(() => getAllChangesWithAuto(), []);

  const toggleType = (type: ChangeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return allChanges.filter((c) => {
      if (activeCategory !== "All" && c.appCategory !== activeCategory) return false;
      if (activeTypes.size > 0 && !activeTypes.has(c.type)) return false;
      if (sourceFilter !== "all") {
        const isAuto = "source" in c && (c as EnrichedAutoChange).source === "auto";
        if (sourceFilter === "auto" && !isAuto) return false;
        if (sourceFilter === "manual" && isAuto) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !c.description.toLowerCase().includes(q) &&
          !c.appName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allChanges, activeCategory, activeTypes, sourceFilter, search]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: { month: string; changes: EnrichedChange[] }[] = [];
    let currentMonth = "";
    for (const change of filtered) {
      const month = formatMonth(change.date);
      if (month !== currentMonth) {
        currentMonth = month;
        groups.push({ month, changes: [] });
      }
      groups[groups.length - 1].changes.push(change);
    }
    return groups;
  }, [filtered]);

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
          {allChanges.length} changes tracked across {new Set(allChanges.map((c) => c.appSlug)).size} products
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search changes..."
          className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
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
          {filtered.length} change{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {grouped.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No changes match the selected filters.
          </p>
        </div>
      )}

      {/* Paywall for free users */}
      {!canViewChanges && grouped.length > 0 && (
        <div className="relative">
          {/* Show first group as teaser */}
          <div className="opacity-60">
            <div className="mb-10">
              <h2 className="mb-6 font-heading text-[16px] font-semibold text-text-primary">
                {grouped[0].month}
              </h2>
              <div className="space-y-0">
                {grouped[0].changes.slice(0, 3).map((change, idx) => (
                  <div
                    key={`${change.appSlug}-${change.date}-${idx}`}
                    className="group relative flex gap-5 pb-8"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className="h-3 w-3 rounded-full border-2 border-dark-bg"
                        style={{ backgroundColor: CHANGE_TYPE_COLORS[change.type] }}
                      />
                      {idx < 2 && (
                        <div className="flex-1 w-px bg-dark-border" />
                      )}
                    </div>
                    <div className="flex-1 -mt-0.5 pb-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/library/${change.appSlug}`}
                          className="text-[14px] font-medium text-text-primary transition-colors hover:text-white"
                        >
                          {change.appName}
                        </Link>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            color: CHANGE_TYPE_COLORS[change.type],
                            backgroundColor: `${CHANGE_TYPE_COLORS[change.type]}15`,
                          }}
                        >
                          {change.type}
                        </span>
                        <span className="font-mono text-[11px] text-text-tertiary">
                          {change.date}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                        {change.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PaywallOverlay
            message={`You're seeing a preview. Upgrade to Pro to access the full change feed (${filtered.length} changes).`}
          />
        </div>
      )}

      {canViewChanges && grouped.map((group) => (
        <div key={group.month} className="mb-10">
          <h2 className="mb-6 font-heading text-[16px] font-semibold text-text-primary">
            {group.month}
          </h2>
          <div className="space-y-0">
            {group.changes.map((change, idx) => (
              <div
                key={`${change.appSlug}-${change.date}-${idx}`}
                className="group relative flex gap-5 pb-8"
              >
                {/* Timeline line */}
                <div className="relative flex flex-col items-center">
                  <div
                    className="h-3 w-3 rounded-full border-2 border-dark-bg"
                    style={{ backgroundColor: CHANGE_TYPE_COLORS[change.type] }}
                  />
                  {idx < group.changes.length - 1 && (
                    <div className="flex-1 w-px bg-dark-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 -mt-0.5 pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/library/${change.appSlug}`}
                      className="text-[14px] font-medium text-text-primary transition-colors hover:text-white"
                    >
                      {change.appName}
                    </Link>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: CHANGE_TYPE_COLORS[change.type],
                        backgroundColor: `${CHANGE_TYPE_COLORS[change.type]}15`,
                      }}
                    >
                      {change.type}
                    </span>
                    {"source" in change && (change as EnrichedAutoChange).source === "auto" && (
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
                        Auto
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {change.date}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                    {change.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
