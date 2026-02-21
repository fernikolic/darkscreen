"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { screenshotUrl } from "@/lib/screenshot-url";

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

/** Compute the displayed image rect inside a container for a given object-fit mode. */
function computeImageRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
  mode: "cover-top" | "contain"
): { offsetX: number; offsetY: number; displayW: number; displayH: number } {
  const containerAR = containerW / containerH;
  const imageAR = imageW / imageH;

  if (mode === "contain") {
    if (imageAR > containerAR) {
      // Image wider than container — fill width, letterbox top/bottom
      const displayW = containerW;
      const displayH = containerW / imageAR;
      return { offsetX: 0, offsetY: (containerH - displayH) / 2, displayW, displayH };
    } else {
      // Image taller than container — fill height, pillarbox left/right
      const displayH = containerH;
      const displayW = containerH * imageAR;
      return { offsetX: (containerW - displayW) / 2, offsetY: 0, displayW, displayH };
    }
  } else {
    // cover-top: scale to cover container, align to top
    if (imageAR > containerAR) {
      // Image wider — fill height, center horizontally
      const displayH = containerH;
      const displayW = containerH * imageAR;
      return { offsetX: (containerW - displayW) / 2, offsetY: 0, displayW, displayH };
    } else {
      // Image taller — fill width, align top (excess crops at bottom)
      const displayW = containerW;
      const displayH = containerW / imageAR;
      return { offsetX: 0, offsetY: 0, displayW, displayH };
    }
  }
}

interface TextHighlightOverlayProps {
  imagePath: string;
  query: string;
  /** How the image is displayed. "cover-top" for thumbnails, "contain" for modal. Default: "cover-top" */
  mode?: "cover-top" | "contain";
}

/**
 * Renders semi-transparent highlight rectangles over matching text regions
 * on a screenshot. Uses pre-computed Tesseract bounding boxes and accounts
 * for object-fit differences between thumbnails and modal views.
 */
export function TextHighlightOverlay({ imagePath, query, mode = "cover-top" }: TextHighlightOverlayProps) {
  const [data, setData] = useState<Record<string, BoxLine[]> | null>(boxDataCache);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [imageNatural, setImageNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!data) {
      loadBoxData().then(setData);
    }
  }, [data]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load image natural dimensions (browser-cached, should be instant)
  const loadNaturalDims = useCallback(() => {
    const url = screenshotUrl(imagePath) || imagePath;
    const img = new window.Image();
    img.onload = () => {
      setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
  }, [imagePath]);

  useEffect(() => {
    loadNaturalDims();
  }, [loadNaturalDims]);

  const matches = useMemo(() => {
    const term = query.replace(/^["']|["']$/g, "").trim().toLowerCase();
    if (!term || term.length < 2 || !data) return [];

    const words = data[imagePath];
    if (!words) return [];

    // Split query into individual words for word-level matching
    const queryWords = term.split(/\s+/).filter((w) => w.length >= 2);
    if (queryWords.length === 0) return [];

    return words.filter((word) => {
      const wordText = (word[0] as string).toLowerCase();
      return queryWords.some((qw) => wordText.includes(qw));
    });
  }, [imagePath, query, data]);

  if (matches.length === 0) return null;

  // Compute positioned highlights
  const highlights = containerSize && imageNatural
    ? (() => {
        const rect = computeImageRect(
          containerSize.w, containerSize.h,
          imageNatural.w, imageNatural.h,
          mode
        );
        return matches.map((line) => {
          const x = line[1] as number;
          const y = line[2] as number;
          const w = line[3] as number;
          const h = line[4] as number;

          // Convert from image-normalized coords to pixel positions on the displayed image
          const pxLeft = rect.offsetX + x * rect.displayW;
          const pxTop = rect.offsetY + y * rect.displayH;
          const pxWidth = w * rect.displayW;
          const pxHeight = h * rect.displayH;

          // Convert to container percentages
          return {
            left: (pxLeft / containerSize.w) * 100,
            top: (pxTop / containerSize.h) * 100,
            width: (pxWidth / containerSize.w) * 100,
            height: (pxHeight / containerSize.h) * 100,
          };
        });
      })()
    : // Fallback: use raw normalized coords (before dimensions are known)
      matches.map((line) => ({
        left: (line[1] as number) * 100,
        top: (line[2] as number) * 100,
        width: (line[3] as number) * 100,
        height: (line[4] as number) * 100,
      }));

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      {highlights.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            width: `${pos.width}%`,
            height: `${pos.height}%`,
            backgroundColor: "rgba(0, 212, 255, 0.25)",
            boxShadow: "0 0 8px 2px rgba(0, 212, 255, 0.3)",
            border: "1px solid rgba(0, 212, 255, 0.5)",
          }}
        />
      ))}
    </div>
  );
}
