"use client";

import Link from "next/link";
import Image from "next/image";
import { type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";
import { SearchMatchBadge } from "@/components/SearchMatchBadge";
import { TextHighlightOverlay } from "@/components/TextHighlightOverlay";

interface ScreenCardProps {
  screen: EnrichedScreen;
  onClick: () => void;
  searchQuery?: string;
}

export function ScreenCard({ screen, onClick, searchQuery }: ScreenCardProps) {
  return (
    <Link
      href={getScreenPath(screen)}
      onClick={(e) => {
        // Normal click opens modal; Cmd/Ctrl+click follows the link (default <a> behavior)
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onClick();
        }
      }}
      className="group block w-full text-left"
    >
      <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
        {/* Thumbnail — mobile uses 9:19, tablet uses 3:4, desktop uses 9:16 */}
        <div className={`relative overflow-hidden bg-dark-bg ${
          screen.device === "mobile" ? "aspect-[9/19]" :
          screen.device === "tablet" ? "aspect-[3/4]" :
          "aspect-[9/16]"
        }`}>
          {screen.image ? (
            <>
              <Image
                src={screenshotUrl(screen.image)!}
                alt={`${screen.appName} - ${screen.label}`}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
              {screen.video && (
                <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              )}
              {searchQuery && screen.image && <TextHighlightOverlay imagePath={screen.image} query={searchQuery} />}
              {searchQuery && <SearchMatchBadge query={searchQuery} />}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4">
              <span className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                {screen.appName}
              </span>
              <span className="text-center text-[11px] text-text-tertiary">
                {screen.label}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="border-t border-dark-border p-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">
              {screen.appName}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-text-tertiary">
            {screen.label}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block bg-dark-bg px-2 py-0.5 font-mono text-[10px] text-text-tertiary">
              {screen.flow}
            </span>
            <span className="font-mono text-[10px] text-text-tertiary">
              Step {screen.step}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
