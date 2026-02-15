"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllScreens, type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { buildSearchIndex, getOcrText } from "@/lib/search";
import { OcrSnippet } from "./OcrSnippet";
import { screenshotUrl } from "@/lib/screenshot-url";

const PHRASES = [
  "connect wallet",
  "slippage tolerance",
  "insufficient balance",
  "approve",
  "transaction pending",
  "gas fee",
  "staking rewards",
  "swap",
  "bridge",
  "confirm transaction",
  "network fee",
  "max slippage",
];

interface CopyResearchProps {
  onScreenClick?: (screen: EnrichedScreen) => void;
}

export function CopyResearch({ onScreenClick }: CopyResearchProps) {
  const [query, setQuery] = useState("");

  const allScreens = useMemo(() => getAllScreens(), []);

  const results = useMemo(() => {
    if (!query.trim()) return null;

    const searchTerm = query.replace(/^["']|["']$/g, "").toLowerCase();
    if (!searchTerm) return null;

    // Find all screens with OCR text containing the query
    const matches: Array<{ screen: EnrichedScreen; ocrText: string }> = [];
    for (const screen of allScreens) {
      if (!screen.image) continue;
      const ocr = getOcrText(screen.image);
      if (ocr.toLowerCase().includes(searchTerm)) {
        matches.push({ screen, ocrText: ocr });
      }
    }

    // Group by app
    const groups = new Map<string, { appName: string; appSlug: string; items: typeof matches }>();
    for (const m of matches) {
      const existing = groups.get(m.screen.appSlug);
      if (existing) {
        existing.items.push(m);
      } else {
        groups.set(m.screen.appSlug, {
          appName: m.screen.appName,
          appSlug: m.screen.appSlug,
          items: [m],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
  }, [query, allScreens]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          How do crypto apps say X?
        </h2>
        <p className="mt-2 text-[13px] text-text-secondary">
          Search for a word or phrase to see how different apps use it in their UI.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Type a phrase like "connect wallet" or "slippage"...'
        className="mb-6 w-full border-b border-dark-border bg-transparent py-3 text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
      />

      {!query.trim() && (
        <div className="flex flex-wrap gap-2">
          {PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => setQuery(p)}
              className="rounded-full border border-dark-border px-3 py-1.5 text-[11px] text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-secondary"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="py-8 text-center text-[13px] text-text-tertiary">
          No screens contain that text.
        </p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-8">
          {results.slice(0, 10).map((group) => (
            <div key={group.appSlug}>
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={`/logos/${group.appSlug}.png`}
                  alt={group.appName}
                  width={20}
                  height={20}
                  className="rounded-md"
                />
                <span className="text-[13px] font-medium text-text-primary">
                  {group.appName}
                </span>
                <span className="font-mono text-[10px] text-text-tertiary">
                  {group.items.length}x
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.items.slice(0, 3).map(({ screen, ocrText }) => (
                  <Link
                    key={`${screen.appSlug}-${screen.flow}-${screen.step}`}
                    href={getScreenPath(screen)}
                    onClick={(e) => {
                      if (onScreenClick && !e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        onScreenClick(screen);
                      }
                    }}
                    className="group block overflow-hidden border border-dark-border bg-dark-card transition-all card-hover"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
                      {screen.image && (
                        <Image
                          src={screenshotUrl(screen.image)!}
                          alt={screen.label}
                          fill
                          className="object-cover object-top"
                          sizes="33vw"
                        />
                      )}
                    </div>
                    <div className="border-t border-dark-border p-2">
                      <OcrSnippet text={ocrText} query={query} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
