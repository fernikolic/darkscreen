"use client";

import { useState } from "react";
import { type AppChange, type ChangeType, type DiffChange } from "@/data/apps";
import { DiffViewer } from "./DiffViewer";

const TYPE_STYLES: Record<ChangeType, string> = {
  "New Feature": "text-emerald-400",
  Redesign: "text-white",
  "Copy Change": "text-amber-400",
  "Layout Shift": "text-text-secondary",
  Removed: "text-red-400",
};

function isAutoChange(change: AppChange | DiffChange): change is DiffChange {
  return "source" in change && change.source === "auto";
}

interface ChangeTimelineProps {
  changes: (AppChange | DiffChange)[];
}

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (changes.length === 0) return null;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        History
      </p>
      <h2 className="mb-8 font-heading font-semibold text-xl text-text-primary">
        Change Timeline
      </h2>
      <div className="space-y-0">
        {changes.map((change, idx) => {
          const textColor = TYPE_STYLES[change.type];
          const auto = isAutoChange(change);
          const expanded = expandedIdx === idx;
          const hasDiff = auto && change.beforeImage && change.afterImage;

          return (
            <div key={idx} className="relative flex gap-5 pb-8 last:pb-0">
              {/* Timeline line */}
              {idx < changes.length - 1 && (
                <div className="absolute left-[5px] top-4 h-full w-px bg-dark-border" />
              )}

              {/* Dot */}
              <div
                className={`relative mt-2 h-[11px] w-[11px] flex-shrink-0 rounded-full border ${
                  auto ? "border-cyan-500/50 bg-cyan-500/20" : "border-dark-border bg-dark-card"
                }`}
              />

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {change.date}
                  </span>
                  <span className={`text-[11px] font-medium ${textColor}`}>
                    {change.type}
                  </span>
                  {auto && (
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
                      Auto-detected
                    </span>
                  )}
                  {auto && change.diffPercent !== undefined && (
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {change.diffPercent}% diff
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                  {change.description}
                </p>

                {/* Expand button for diff */}
                {hasDiff && (
                  <button
                    onClick={() => setExpandedIdx(expanded ? null : idx)}
                    className="mt-2 text-[12px] text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    {expanded ? "Hide comparison" : "View comparison"}
                  </button>
                )}

                {/* DiffViewer */}
                {expanded && hasDiff && (
                  <div className="mt-3">
                    <DiffViewer
                      beforeImage={change.beforeImage!}
                      afterImage={change.afterImage!}
                      diffPercent={change.diffPercent}
                      label={change.screenLabel}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
