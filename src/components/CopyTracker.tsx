"use client";

import { useState } from "react";
import { type CopySnapshot, type CopyChange } from "@/data/apps";

interface CopyTrackerProps {
  snapshots: CopySnapshot[];
  changes: CopyChange[];
  appName: string;
}

export function CopyTracker({ snapshots, changes, appName }: CopyTrackerProps) {
  const [showChanges, setShowChanges] = useState(false);

  if (snapshots.length === 0 && changes.length === 0) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card px-8 py-16 text-center">
        <p className="text-[14px] text-text-tertiary">
          No copy data captured for {appName} yet. Run the crawler to collect messaging data.
        </p>
      </div>
    );
  }

  const latest = snapshots[snapshots.length - 1];

  return (
    <div className="space-y-6">
      {/* Current snapshot */}
      {latest && (
        <div className="rounded-lg border border-dark-border bg-dark-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Current Copy
            </span>
            <span className="font-mono text-[11px] text-text-tertiary">
              {latest.date}
            </span>
          </div>

          <div className="space-y-4">
            {latest.h1 && (
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">H1</span>
                <p className="text-[15px] font-medium text-text-primary">{latest.h1}</p>
              </div>
            )}

            {latest.metaDescription && (
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">Meta Description</span>
                <p className="text-[13px] text-text-secondary">{latest.metaDescription}</p>
              </div>
            )}

            {latest.ogTitle && (
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">OG Title</span>
                <p className="text-[13px] text-text-secondary">{latest.ogTitle}</p>
              </div>
            )}

            {latest.ctas.length > 0 && (
              <div>
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
                  CTAs ({latest.ctas.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {latest.ctas.map((cta, i) => (
                    <span
                      key={i}
                      className="rounded border border-dark-border bg-dark-bg px-2.5 py-1 text-[12px] text-text-secondary"
                    >
                      {cta}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {latest.navItems.length > 0 && (
              <div>
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
                  Nav Items ({latest.navItems.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {latest.navItems.map((item, i) => (
                    <span
                      key={i}
                      className="rounded border border-dark-border bg-dark-bg px-2.5 py-1 text-[12px] text-text-tertiary"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Changes */}
      {changes.length > 0 && (
        <div>
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="mb-3 flex items-center gap-2 text-[13px] text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg
              className={`h-3 w-3 transition-transform ${showChanges ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {changes.length} copy change{changes.length !== 1 ? "s" : ""} detected
          </button>

          {showChanges && (
            <div className="space-y-2">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-dark-border bg-dark-card p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-tertiary">{change.date}</span>
                    <span className="text-[12px] font-medium text-amber-400">{change.element}</span>
                  </div>
                  <div className="space-y-1.5">
                    {change.oldText && (
                      <div className="flex gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-[11px] text-red-400">-</span>
                        <p className="text-[12px] text-red-400/80 line-through">{change.oldText}</p>
                      </div>
                    )}
                    {change.newText && (
                      <div className="flex gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-[11px] text-emerald-400">+</span>
                        <p className="text-[12px] text-emerald-400/80">{change.newText}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
