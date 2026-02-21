"use client";

import { useMemo, useState, useEffect } from "react";

type BoxLine = (string | number)[];
let boxDataCache: Record<string, BoxLine[]> | null = null;
let loadPromise: Promise<Record<string, BoxLine[]>> | null = null;

function loadBoxData(): Promise<Record<string, BoxLine[]>> {
  if (boxDataCache) return Promise.resolve(boxDataCache);
  if (!loadPromise) {
    loadPromise = fetch("/data/ocr-boxes.json")
      .then((r) => r.json())
      .then((d) => {
        boxDataCache = d;
        return d;
      })
      .catch(() => {
        loadPromise = null;
        return {};
      });
  }
  return loadPromise;
}

interface TextHighlightOverlayProps {
  imagePath: string;
  query: string;
}

/**
 * Renders semi-transparent highlight rectangles over matching text regions
 * on a screenshot thumbnail. Uses pre-computed Tesseract bounding boxes.
 * Data is fetched from /data/ocr-boxes.json only when search is active.
 */
export function TextHighlightOverlay({ imagePath, query }: TextHighlightOverlayProps) {
  const [data, setData] = useState<Record<string, BoxLine[]> | null>(boxDataCache);

  useEffect(() => {
    if (!data) {
      loadBoxData().then(setData);
    }
  }, [data]);

  const matches = useMemo(() => {
    const term = query.replace(/^["']|["']$/g, "").trim().toLowerCase();
    if (!term || term.length < 2 || !data) return [];

    const lines = data[imagePath];
    if (!lines) return [];

    return lines.filter((line) =>
      (line[0] as string).toLowerCase().includes(term)
    );
  }, [imagePath, query, data]);

  if (matches.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {matches.map((line, i) => {
        const x = line[1] as number;
        const y = line[2] as number;
        const w = line[3] as number;
        const h = line[4] as number;
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              backgroundColor: "rgba(0, 212, 255, 0.25)",
              boxShadow: "0 0 8px 2px rgba(0, 212, 255, 0.3)",
              border: "1px solid rgba(0, 212, 255, 0.5)",
            }}
          />
        );
      })}
    </div>
  );
}
