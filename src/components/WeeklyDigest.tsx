"use client";

import { useState } from "react";
import { type WeeklyChangeGroup } from "@/data/helpers";
import { type ChangeType } from "@/data/apps";
import { ChangeCard } from "./ChangeCard";

const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  "New Feature": "#22c55e",
  Redesign: "#3b82f6",
  "Copy Change": "#f59e0b",
  "Layout Shift": "#a855f7",
  Removed: "#ef4444",
};

interface WeeklyDigestProps {
  group: WeeklyChangeGroup;
  defaultExpanded?: boolean;
}

export function WeeklyDigest({ group, defaultExpanded = false }: WeeklyDigestProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const uniqueApps = new Set(group.changes.map((c) => c.appSlug)).size;
  const typeCounts: Partial<Record<ChangeType, number>> = {};
  for (const c of group.changes) {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  }

  return (
    <div className="border border-dark-border bg-dark-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-dark-hover"
      >
        <div>
          <h3 className="text-[14px] font-medium text-text-primary">
            {group.weekLabel}
          </h3>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="font-mono text-[11px] text-text-tertiary">
              {group.changes.length} change{group.changes.length !== 1 ? "s" : ""}
            </span>
            <span className="text-dark-border">|</span>
            <span className="font-mono text-[11px] text-text-tertiary">
              {uniqueApps} app{uniqueApps !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Type badges */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span
                key={type}
                className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{
                  color: CHANGE_TYPE_COLORS[type as ChangeType],
                  backgroundColor: `${CHANGE_TYPE_COLORS[type as ChangeType]}15`,
                }}
              >
                {count} {type}
              </span>
            ))}
          </div>

          <svg
            className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Change list */}
      {expanded && (
        <div className="border-t border-dark-border px-5 py-4">
          {group.changes.map((change, idx) => (
            <ChangeCard
              key={`${change.appSlug}-${change.date}-${idx}`}
              change={change}
              isLast={idx === group.changes.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
