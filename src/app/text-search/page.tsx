"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllScreens, type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { buildSearchIndex, searchScreens, getOcrText } from "@/lib/search";
import { OcrSnippet } from "@/components/OcrSnippet";
import { SearchMatchBadge } from "@/components/SearchMatchBadge";
import { ScreenModal } from "@/components/ScreenModal";
import { screenshotUrl } from "@/lib/screenshot-url";

const SUGGESTIONS = [
  "connect wallet",
  "slippage tolerance",
  "insufficient balance",
  "swap",
  "approve",
  "gas fee",
  "transaction pending",
  "staking rewards",
];

export default function TextSearchPage() {
  const [query, setQuery] = useState("");
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);

  const allScreens = useMemo(() => getAllScreens(), []);
  const { fuse } = useMemo(() => buildSearchIndex(allScreens), [allScreens]);

  // Search and group results by app
  const grouped = useMemo(() => {
    if (!query.trim()) return null;

    const results = searchScreens(fuse, query, 300);
    // Filter to screens that have OCR text containing the query
    const withOcr = results.filter((s) => {
      if (!s.image) return false;
      const ocr = getOcrText(s.image);
      const searchTerm = query.replace(/^["']|["']$/g, "").toLowerCase();
      return ocr.toLowerCase().includes(searchTerm);
    });

    // Group by app
    const groups = new Map<string, { appName: string; appSlug: string; screens: EnrichedScreen[] }>();
    for (const screen of withOcr) {
      const existing = groups.get(screen.appSlug);
      if (existing) {
        existing.screens.push(screen);
      } else {
        groups.set(screen.appSlug, {
          appName: screen.appName,
          appSlug: screen.appSlug,
          screens: [screen],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.screens.length - a.screens.length);
  }, [query, fuse]);

  const totalResults = grouped?.reduce((sum, g) => sum + g.screens.length, 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Text Search
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          How do crypto apps say X?
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Search for specific words and phrases across {allScreens.length} screenshots.
          Find how different products label buttons, write error messages, and describe features.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search text on screen... (wrap in "quotes" for exact match)'
          className="w-full border-b-2 border-dark-border bg-transparent py-4 text-lg text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
          autoFocus
        />
      </div>

      {/* Suggestions */}
      {!query.trim() && (
        <div className="mb-12">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Try searching for
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(`"${s}"`)}
                className="rounded-full border border-dark-border px-4 py-2 text-[13px] text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
              >
                &ldquo;{s}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {grouped && (
        <>
          <div className="mb-8">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
              {totalResults} screen{totalResults !== 1 ? "s" : ""} across{" "}
              {grouped.length} app{grouped.length !== 1 ? "s" : ""}
            </span>
          </div>

          {grouped.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[14px] text-text-tertiary">
                No screens contain &ldquo;{query.replace(/^["']|["']$/g, "")}&rdquo;
              </p>
            </div>
          )}

          <div className="space-y-12">
            {grouped.map((group) => (
              <div key={group.appSlug}>
                {/* App header */}
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src={`/logos/${group.appSlug}.png`}
                    alt={group.appName}
                    width={28}
                    height={28}
                    className="rounded-lg"
                  />
                  <Link
                    href={`/library/${group.appSlug}`}
                    className="text-[15px] font-medium text-text-primary transition-colors hover:text-white"
                  >
                    {group.appName}
                  </Link>
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {group.screens.length} match{group.screens.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Screen results */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {group.screens.slice(0, 10).map((screen) => {
                    const ocrText = screen.image ? getOcrText(screen.image) : "";
                    return (
                      <div key={`${screen.appSlug}-${screen.flow}-${screen.step}`}>
                        <Link
                          href={getScreenPath(screen)}
                          onClick={(e) => {
                            if (!e.metaKey && !e.ctrlKey) {
                              e.preventDefault();
                              setModalScreen(screen);
                            }
                          }}
                          className="group block"
                        >
                          <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                            <div className="relative aspect-[9/16] overflow-hidden bg-dark-bg">
                              {screen.image && (
                                <Image
                                  src={screenshotUrl(screen.image)!}
                                  alt={screen.label}
                                  fill
                                  className="object-cover object-top"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                />
                              )}
                              <SearchMatchBadge query={query} />
                            </div>
                            <div className="border-t border-dark-border p-3">
                              <p className="mb-1 text-[12px] text-text-secondary">
                                {screen.label}
                              </p>
                              <OcrSnippet text={ocrText} query={query} />
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {group.screens.length > 10 && (
                  <p className="mt-3 text-[12px] text-text-tertiary">
                    + {group.screens.length - 10} more screens
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalScreen && (
        <ScreenModal
          screen={modalScreen}
          flowScreens={[modalScreen]}
          onClose={() => setModalScreen(null)}
          onNavigate={setModalScreen}
        />
      )}
    </div>
  );
}
