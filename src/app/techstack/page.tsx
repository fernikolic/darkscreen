"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllTechStacks } from "@/data/helpers";
import { TechStackBadges } from "@/components/TechStackBadges";

const CATEGORY_COLORS: Record<string, string> = {
  Framework: "text-blue-400",
  CSS: "text-cyan-400",
  Analytics: "text-green-400",
  "Error Tracking": "text-red-400",
  Support: "text-yellow-400",
  Wallet: "text-purple-400",
  CDN: "text-orange-400",
  Privacy: "text-zinc-400",
};

export default function TechStackPage() {
  const [view, setView] = useState<"tech" | "app">("tech");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const allStacks = useMemo(() => getAllTechStacks(), []);
  const appEntries = Object.entries(allStacks);

  // Build tech-centric view
  const techMap = useMemo(() => {
    const map = new Map<string, { name: string; category: string; apps: string[] }>();
    for (const [slug, { app, stack }] of appEntries) {
      for (const entry of stack) {
        const key = entry.name;
        if (!map.has(key)) {
          map.set(key, { name: entry.name, category: entry.category, apps: [] });
        }
        map.get(key)!.apps.push(app.name);
      }
    }
    return [...map.values()].sort((a, b) => b.apps.length - a.apps.length);
  }, [appEntries]);

  const categories = useMemo(() => {
    const cats = new Set(techMap.map((t) => t.category));
    return ["All", ...Array.from(cats).sort()];
  }, [techMap]);

  const filteredTech = useMemo(() => {
    return techMap.filter((t) => {
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.apps.some((a) => a.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [techMap, categoryFilter, search]);

  const filteredApps = useMemo(() => {
    if (!search.trim()) return appEntries;
    const q = search.toLowerCase();
    return appEntries.filter(([slug, { app, stack }]) =>
      app.name.toLowerCase().includes(q) || stack.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [appEntries, search]);

  const isEmpty = appEntries.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Intelligence
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Tech Stack Intelligence
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {isEmpty
            ? "No tech stack data collected yet. Run the crawler to fingerprint technologies."
            : `${techMap.length} technologies detected across ${appEntries.length} products`}
        </p>
      </div>

      {!isEmpty && (
        <>
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search technologies or apps..."
              className="w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
            />
          </div>

          {/* View toggle + category filter */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1">
              <button
                onClick={() => setView("tech")}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  view === "tech" ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                By Technology
              </button>
              <button
                onClick={() => setView("app")}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  view === "app" ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                By App
              </button>
            </div>

            {view === "tech" && (
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                      categoryFilter === cat
                        ? "border-white/20 text-text-primary"
                        : "border-dark-border text-text-tertiary hover:border-text-tertiary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* By Technology view */}
          {view === "tech" && (
            <div className="rounded-lg border border-dark-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-card">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Technology</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Category</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary font-medium text-center">Apps</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Used by</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTech.map((tech) => (
                    <tr key={tech.name} className="border-b border-dark-border/50 transition-colors hover:bg-dark-card/50">
                      <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{tech.name}</td>
                      <td className={`px-4 py-3 text-[12px] font-medium ${CATEGORY_COLORS[tech.category] || "text-text-secondary"}`}>
                        {tech.category}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[13px] text-text-primary">{tech.apps.length}</td>
                      <td className="px-4 py-3 text-[12px] text-text-tertiary">{tech.apps.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTech.length === 0 && (
                <div className="px-4 py-12 text-center text-[14px] text-text-tertiary">
                  No technologies match the current filters.
                </div>
              )}
            </div>
          )}

          {/* By App view */}
          {view === "app" && (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredApps.map(([slug, { app, stack }]) => (
                <div key={slug} className="rounded-lg border border-dark-border bg-dark-card p-5">
                  <Link
                    href={`/library/${slug}`}
                    className="mb-4 block text-[15px] font-medium text-text-primary transition-colors hover:text-white"
                  >
                    {app.name}
                  </Link>
                  <TechStackBadges techStack={stack} />
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="col-span-2 py-12 text-center text-[14px] text-text-tertiary">
                  No apps match the search.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
