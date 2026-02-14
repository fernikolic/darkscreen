"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type AppCategory, CATEGORIES } from "@/data/apps";
import { getAllPerformanceData } from "@/data/helpers";

type SortKey = "name" | "category" | "loadTime" | "lcp" | "cls" | "transferSize" | "resourceCount";
type SortDir = "asc" | "desc";

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function loadColor(ms: number): string {
  if (ms <= 3000) return "text-emerald-400";
  if (ms <= 6000) return "text-amber-400";
  return "text-red-400";
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

export default function PerformancePage() {
  const [sortKey, setSortKey] = useState<SortKey>("loadTime");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [categoryFilter, setCategoryFilter] = useState<AppCategory | "All">("All");

  const allPerf = useMemo(() => getAllPerformanceData(), []);
  const entries = Object.entries(allPerf);

  const rows = useMemo(() => {
    return entries
      .map(([slug, { app, metrics }]) => {
        const latest = metrics[metrics.length - 1];
        return {
          slug,
          name: app.name,
          category: app.category,
          loadTime: latest.loadTime,
          lcp: latest.lcp,
          cls: latest.cls,
          transferSize: latest.transferSize,
          resourceCount: latest.resourceCount,
        };
      })
      .filter((r) => categoryFilter === "All" || r.category === categoryFilter)
      .sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortKey) {
          case "name": av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
          case "category": av = a.category; bv = b.category; break;
          case "lcp": av = a.lcp ?? 99999; bv = b.lcp ?? 99999; break;
          case "cls": av = a.cls ?? 99999; bv = b.cls ?? 99999; break;
          default: av = a[sortKey]; bv = b[sortKey]; break;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [entries, sortKey, sortDir, categoryFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="cursor-pointer px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary font-medium transition-colors hover:text-text-secondary select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && (
          <svg className={`h-3 w-3 ${sortDir === "desc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </span>
    </th>
  );

  const isEmpty = entries.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Intelligence
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Performance Benchmarks
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {isEmpty
            ? "No performance data collected yet. Run the crawler to capture metrics."
            : `Core Web Vitals and page weight for ${entries.length} products`}
        </p>
      </div>

      {!isEmpty && (
        <>
          {/* Category filter */}
          <div className="mb-8">
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Category
            </span>
            <div className="flex flex-wrap gap-1">
              {(["All", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
                    categoryFilter === cat
                      ? "border-white/60 text-white"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-dark-border overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-dark-border bg-dark-card">
                  <SortHeader label="App" field="name" />
                  <SortHeader label="Category" field="category" />
                  <SortHeader label="Load Time" field="loadTime" />
                  <SortHeader label="LCP" field="lcp" />
                  <SortHeader label="CLS" field="cls" />
                  <SortHeader label="Page Weight" field="transferSize" />
                  <SortHeader label="Resources" field="resourceCount" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} className="border-b border-dark-border/50 transition-colors hover:bg-dark-card/50">
                    <td className="px-3 py-3">
                      <Link
                        href={`/library/${row.slug}`}
                        className="text-[13px] font-medium text-text-primary transition-colors hover:text-white"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-tertiary">{row.category}</td>
                    <td className={`px-3 py-3 font-mono text-[12px] ${loadColor(row.loadTime)}`}>
                      {formatMs(row.loadTime)}
                    </td>
                    <td className={`px-3 py-3 font-mono text-[12px] ${row.lcp !== undefined ? lcpColor(row.lcp) : "text-text-tertiary"}`}>
                      {row.lcp !== undefined ? formatMs(row.lcp) : "\u2014"}
                    </td>
                    <td className={`px-3 py-3 font-mono text-[12px] ${row.cls !== undefined ? clsColor(row.cls) : "text-text-tertiary"}`}>
                      {row.cls !== undefined ? row.cls.toFixed(3) : "\u2014"}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-text-primary">
                      {formatBytes(row.transferSize)}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-text-primary text-center">
                      {row.resourceCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="px-4 py-12 text-center text-[14px] text-text-tertiary">
                No performance data for this category.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
