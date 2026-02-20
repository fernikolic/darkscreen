"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Insight, type InsightCategory } from "@/data/insights";
import { screenshotUrl } from "@/lib/screenshot-url";
import { AppLogo } from "./AppLogo";
import { apps } from "@/data/apps";

const CATEGORY_COLORS: Record<InsightCategory, string> = {
  "UX Change": "#3b82f6",
  "Feature Launch": "#22c55e",
  "Design Trend": "#f59e0b",
  "Copy Update": "#a855f7",
  "Flow Change": "#06b6d4",
  "Competitive Move": "#ef4444",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "#71717a",
  medium: "#f59e0b",
  high: "#ef4444",
};

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const app = apps.find((a) => a.slug === insight.slug);
  const hasDiff = insight.beforeImage && insight.afterImage;

  return (
    <div className="border border-dark-border bg-dark-card">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          {app && (
            <AppLogo slug={app.slug} name={app.name} size={32} className="mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {app && (
                <Link
                  href={`/library/${app.slug}`}
                  className="text-[13px] font-medium text-text-primary transition-colors hover:text-white"
                >
                  {app.name}
                </Link>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{
                  color: CATEGORY_COLORS[insight.category],
                  backgroundColor: `${CATEGORY_COLORS[insight.category]}15`,
                }}
              >
                {insight.category}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-medium uppercase"
                style={{
                  color: IMPACT_COLORS[insight.impact],
                  backgroundColor: `${IMPACT_COLORS[insight.impact]}15`,
                }}
              >
                {insight.impact} impact
              </span>
            </div>
            <h3 className="mt-1.5 text-[14px] font-medium text-text-primary">
              {insight.title}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
              {insight.summary}
            </p>
            <p className="mt-1 font-mono text-[10px] text-text-tertiary">
              {insight.date}
              {insight.flow && ` · ${insight.flow}`}
              {insight.diffPercent != null && ` · ${insight.diffPercent.toFixed(1)}% changed`}
            </p>
          </div>
        </div>

        {/* Expandable analysis */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {expanded ? "Hide analysis" : "Read full analysis"}
        </button>

        {expanded && (
          <div className="mt-3 border-t border-dark-border pt-3">
            <p className="text-[13px] leading-relaxed text-text-secondary">
              {insight.analysis}
            </p>

            {hasDiff && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary">
                    Before
                  </p>
                  <div className="relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg">
                    <Image
                      src={screenshotUrl(insight.beforeImage) || insight.beforeImage!}
                      alt="Before"
                      fill
                      className="object-contain"
                      sizes="300px"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary">
                    After
                  </p>
                  <div className="relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg">
                    <Image
                      src={screenshotUrl(insight.afterImage) || insight.afterImage!}
                      alt="After"
                      fill
                      className="object-contain"
                      sizes="300px"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
