"use client";

import Link from "next/link";
import Image from "next/image";
import { type EnrichedScreen, getScreenPath } from "@/data/helpers";

interface ScreenCardProps {
  screen: EnrichedScreen;
  onClick: () => void;
}

export function ScreenCard({ screen, onClick }: ScreenCardProps) {
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
        {/* Thumbnail */}
        <div className="relative aspect-[9/16] overflow-hidden bg-dark-bg">
          {screen.image ? (
            <Image
              src={screen.image}
              alt={`${screen.appName} - ${screen.label}`}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
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
