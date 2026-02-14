"use client";

import { type PerformanceMetrics } from "@/data/apps";

interface PerformanceCardProps {
  metrics: PerformanceMetrics[];
  appName: string;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function lcpColor(ms: number): string {
  if (ms <= 2500) return "text-emerald-400";
  if (ms <= 4000) return "text-amber-400";
  return "text-red-400";
}

function clsColor(score: number): string {
  if (score <= 0.1) return "text-emerald-400";
  if (score <= 0.25) return "text-amber-400";
  return "text-red-400";
}

function loadColor(ms: number): string {
  if (ms <= 3000) return "text-emerald-400";
  if (ms <= 6000) return "text-amber-400";
  return "text-red-400";
}

export function PerformanceCard({ metrics, appName }: PerformanceCardProps) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card px-8 py-16 text-center">
        <p className="text-[14px] text-text-tertiary">
          No performance data captured for {appName} yet. Run the crawler to collect metrics.
        </p>
      </div>
    );
  }

  const latest = metrics[metrics.length - 1];
  const total = latest.breakdown.js + latest.breakdown.css + latest.breakdown.images + latest.breakdown.fonts + latest.breakdown.other;

  const breakdownItems = [
    { label: "JS", value: latest.breakdown.js, color: "bg-amber-400" },
    { label: "CSS", value: latest.breakdown.css, color: "bg-blue-400" },
    { label: "Images", value: latest.breakdown.images, color: "bg-emerald-400" },
    { label: "Fonts", value: latest.breakdown.fonts, color: "bg-purple-400" },
    { label: "Other", value: latest.breakdown.other, color: "bg-zinc-500" },
  ];

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Performance
        </span>
        <span className="font-mono text-[11px] text-text-tertiary">
          {latest.date}
        </span>
      </div>

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Load Time</span>
          <span className={`font-mono text-[18px] font-semibold ${loadColor(latest.loadTime)}`}>
            {formatMs(latest.loadTime)}
          </span>
        </div>
        {latest.lcp !== undefined && (
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">LCP</span>
            <span className={`font-mono text-[18px] font-semibold ${lcpColor(latest.lcp)}`}>
              {formatMs(latest.lcp)}
            </span>
          </div>
        )}
        {latest.cls !== undefined && (
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">CLS</span>
            <span className={`font-mono text-[18px] font-semibold ${clsColor(latest.cls)}`}>
              {latest.cls.toFixed(3)}
            </span>
          </div>
        )}
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Page Weight</span>
          <span className="font-mono text-[18px] font-semibold text-text-primary">
            {formatBytes(latest.transferSize)}
          </span>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Resources</span>
          <span className="font-mono text-[18px] font-semibold text-text-primary">
            {latest.resourceCount}
          </span>
        </div>
      </div>

      {/* Breakdown bar */}
      {total > 0 && (
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            Resource Breakdown
          </span>
          <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-dark-bg">
            {breakdownItems.map((item) => {
              const pct = (item.value / total) * 100;
              if (pct < 0.5) return null;
              return (
                <div
                  key={item.label}
                  className={`${item.color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${formatBytes(item.value)} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {breakdownItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="font-mono text-[10px] text-text-tertiary">
                  {item.label}: {formatBytes(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical note */}
      {metrics.length > 1 && (
        <p className="mt-4 font-mono text-[11px] text-text-tertiary">
          {metrics.length} snapshots tracked since {metrics[0].date}
        </p>
      )}
    </div>
  );
}
