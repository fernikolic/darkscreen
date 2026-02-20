"use client";

import { useState, useMemo } from "react";
import { getAllInsights } from "@/data/helpers";
import { type InsightCategory } from "@/data/insights";
import { apps } from "@/data/apps";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getInsightLimit } from "@/lib/access";
import { InsightCard } from "./InsightCard";
import { PaywallOverlay } from "./PaywallOverlay";

const CATEGORIES: Array<InsightCategory | "All"> = [
  "All",
  "UX Change",
  "Feature Launch",
  "Design Trend",
  "Copy Update",
  "Flow Change",
  "Competitive Move",
];

export function InsightsPage() {
  const [activeCategory, setActiveCategory] = useState<InsightCategory | "All">("All");
  const [activeApp, setActiveApp] = useState<string>("all");

  const { plan } = useSubscription();
  const limit = getInsightLimit(plan);

  const allInsights = useMemo(() => getAllInsights(), []);

  const filtered = useMemo(() => {
    return allInsights.filter((i) => {
      if (activeCategory !== "All" && i.category !== activeCategory) return false;
      if (activeApp !== "all" && i.slug !== activeApp) return false;
      return true;
    });
  }, [allInsights, activeCategory, activeApp]);

  const insightApps = useMemo(() => {
    const slugs = new Set(allInsights.map((i) => i.slug));
    return apps.filter((a) => slugs.has(a.slug));
  }, [allInsights]);

  const isGated = limit !== null;
  const visibleCount = isGated ? Math.min(filtered.length, limit) : filtered.length;

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Category pills */}
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Category
          </span>
          <div className="flex flex-wrap gap-1.5">
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
        </div>

        {/* App filter */}
        {insightApps.length > 0 && (
          <div>
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              App
            </span>
            <select
              value={activeApp}
              onChange={(e) => setActiveApp(e.target.value)}
              className="border border-dark-border bg-dark-card px-3 py-2 text-[12px] text-text-primary outline-none"
            >
              <option value="all">All apps</option>
              {insightApps.map((app) => (
                <option key={app.slug} value={app.slug}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {filtered.length} insight{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            {allInsights.length === 0
              ? "No insights generated yet. Run the insight generation script after your next diff cycle."
              : "No insights match the selected filters."}
          </p>
        </div>
      )}

      {/* Insight cards */}
      {filtered.length > 0 && (
        <div className="relative">
          <div className={`space-y-4 ${isGated && filtered.length > limit ? "pb-24" : ""}`}>
            {filtered.slice(0, isGated ? limit + 1 : undefined).map((insight, i) => (
              <div
                key={`${insight.slug}-${insight.date}-${i}`}
                className={isGated && i >= limit ? "opacity-40" : ""}
              >
                <InsightCard insight={insight} />
              </div>
            ))}
          </div>
          {isGated && filtered.length > limit && (
            <PaywallOverlay
              message={`You've seen ${visibleCount} free insights. Upgrade to Pro for unlimited access.`}
            />
          )}
        </div>
      )}
    </div>
  );
}
