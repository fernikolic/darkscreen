"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import similarityData from "@/data/similarity.json";
import { getAllScreens, type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";

const similarityMap = similarityData as Record<string, string[]>;

interface SimilarScreensProps {
  imagePath: string;
  limit?: number;
  onScreenClick?: (screen: EnrichedScreen) => void;
}

export function SimilarScreens({ imagePath, limit = 8, onScreenClick }: SimilarScreensProps) {
  const similar = useMemo(() => {
    const paths = similarityMap[imagePath];
    if (!paths || paths.length === 0) return [];

    const allScreens = getAllScreens();
    const screensByImage = new Map<string, EnrichedScreen>();
    for (const s of allScreens) {
      if (s.image) screensByImage.set(s.image, s);
    }

    return paths
      .slice(0, limit)
      .map((p) => screensByImage.get(p))
      .filter((s): s is EnrichedScreen => !!s);
  }, [imagePath, limit]);

  if (similar.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        Similar Screens
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {similar.map((screen) => (
          <Link
            key={`${screen.appSlug}-${screen.flow}-${screen.step}`}
            href={getScreenPath(screen)}
            onClick={(e) => {
              if (onScreenClick && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                onScreenClick(screen);
              }
            }}
            className="group block"
          >
            <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
              <div className="relative aspect-[9/16] overflow-hidden bg-dark-bg">
                {screen.image && (
                  <Image
                    src={screenshotUrl(screen.image)!}
                    alt={`${screen.appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                )}
              </div>
              <div className="border-t border-dark-border p-2">
                <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-text-secondary">
                  {screen.appName}
                </span>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-text-tertiary">
                  {screen.label}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
