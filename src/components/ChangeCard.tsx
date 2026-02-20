"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type EnrichedChange, type EnrichedAutoChange } from "@/data/helpers";
import { type ChangeType, type DiffChange } from "@/data/apps";
import { screenshotUrl } from "@/lib/screenshot-url";

const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  "New Feature": "#22c55e",
  Redesign: "#3b82f6",
  "Copy Change": "#f59e0b",
  "Layout Shift": "#a855f7",
  Removed: "#ef4444",
};

interface ChangeCardProps {
  change: EnrichedChange | EnrichedAutoChange;
  showTimeline?: boolean;
  isLast?: boolean;
}

export function ChangeCard({ change, showTimeline = true, isLast = false }: ChangeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAuto = "source" in change && (change as EnrichedAutoChange).source === "auto";
  const diff = isAuto ? (change as DiffChange) : null;
  const hasDiffImages = diff?.beforeImage && diff?.afterImage;

  return (
    <div className="group relative flex gap-5 pb-8">
      {/* Timeline dot + line */}
      {showTimeline && (
        <div className="relative flex flex-col items-center">
          <div
            className="h-3 w-3 rounded-full border-2 border-dark-bg"
            style={{ backgroundColor: CHANGE_TYPE_COLORS[change.type] }}
          />
          {!isLast && <div className="w-px flex-1 bg-dark-border" />}
        </div>
      )}

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
          {isAuto && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cyan-400">
              Auto
            </span>
          )}
          {diff?.diffPercent != null && (
            <span className="font-mono text-[10px] text-text-tertiary">
              {diff.diffPercent.toFixed(1)}% changed
            </span>
          )}
          <span className="font-mono text-[11px] text-text-tertiary">
            {change.date}
          </span>
        </div>

        <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
          {change.description}
        </p>

        {diff?.screenLabel && (
          <p className="mt-1 font-mono text-[11px] text-text-tertiary">
            {diff.flow && `${diff.flow} / `}{diff.screenLabel}
          </p>
        )}

        {/* Before/After thumbnails */}
        {hasDiffImages && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              {expanded ? "Hide diff" : "Show before/after"}
            </button>

            {expanded && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary">
                    Before
                  </p>
                  <div className="relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg">
                    <Image
                      src={screenshotUrl(diff!.beforeImage) || diff!.beforeImage!}
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
                      src={screenshotUrl(diff!.afterImage) || diff!.afterImage!}
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
