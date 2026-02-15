"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { type EnrichedScreen } from "@/data/helpers";
import { type ScreenHotspot } from "@/data/apps";
import { screenshotUrl } from "@/lib/screenshot-url";

interface PrototypePlayerProps {
  screens: EnrichedScreen[];
  initialIndex: number;
  onClose: () => void;
}

export function PrototypePlayer({ screens, initialIndex, onClose }: PrototypePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [history, setHistory] = useState<number[]>([initialIndex]);
  const [hoveredHotspot, setHoveredHotspot] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<number>>(new Set([initialIndex]));

  const screen = screens[currentIndex];
  const hotspots = screen?.hotspots || [];
  const hasHotspots = hotspots.length > 0;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Backspace" || e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= screens.length) return;
      setCurrentIndex(index);
      setHistory((prev) => [...prev, index]);
      setVisited((prev) => new Set(prev).add(index));
      setHoveredHotspot(null);
    },
    [screens.length]
  );

  const goBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentIndex(newHistory[newHistory.length - 1]);
    setHoveredHotspot(null);
  }, [history]);

  const handleHotspotClick = useCallback(
    (hotspot: ScreenHotspot) => {
      if (hotspot.targetStep != null) {
        // Find the screen index by step number
        const targetIdx = screens.findIndex(
          (s) =>
            s.step === hotspot.targetStep &&
            (hotspot.targetFlow ? s.flow === hotspot.targetFlow : s.flow === screen.flow)
        );
        if (targetIdx !== -1) {
          navigateTo(targetIdx);
          return;
        }
      }
      // No target resolved — click anywhere to advance (fallback)
    },
    [screens, screen, navigateTo]
  );

  const handleScreenClick = useCallback(() => {
    // If no hotspots, click anywhere to advance (slideshow fallback)
    if (!hasHotspots) {
      const nextIdx = currentIndex + 1;
      if (nextIdx < screens.length) {
        navigateTo(nextIdx);
      }
    }
  }, [hasHotspots, currentIndex, screens.length, navigateTo]);

  if (!screen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-dark-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Prototype Player"
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-2 py-0.5 font-mono text-[10px] text-[#00d4ff]">
              Prototype
            </span>
            <span className="text-[14px] font-medium text-text-primary">
              {screen.appName}
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-mono text-[12px] text-text-secondary">
              {screen.flow}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-[13px] text-text-tertiary transition-colors hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-[13px] text-text-tertiary transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Main image area with hotspot overlays */}
      <div
        className="relative flex flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="relative max-h-[80vh] max-w-[90vw]"
          onClick={(e) => {
            e.stopPropagation();
            handleScreenClick();
          }}
          style={{ cursor: hasHotspots ? "default" : "pointer" }}
        >
          {screen.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={screenshotUrl(screen.image)!}
              alt={screen.label}
              className="max-h-[80vh] max-w-[90vw] object-contain"
              draggable={false}
            />
          )}

          {/* Hotspot overlays */}
          {hotspots.map((hotspot, i) => (
            <div
              key={i}
              className="absolute transition-all"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
                cursor: hotspot.targetStep != null ? "pointer" : "default",
                background:
                  hoveredHotspot === i
                    ? "rgba(0, 212, 255, 0.15)"
                    : "rgba(0, 212, 255, 0.05)",
                border:
                  hoveredHotspot === i
                    ? "2px solid rgba(0, 212, 255, 0.5)"
                    : "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: "4px",
              }}
              onMouseEnter={() => setHoveredHotspot(i)}
              onMouseLeave={() => setHoveredHotspot(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleHotspotClick(hotspot);
              }}
            >
              {/* Tooltip */}
              {hoveredHotspot === i && hotspot.label && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[11px] text-white">
                  {hotspot.label}
                  {hotspot.targetStep == null && (
                    <span className="ml-1 text-text-tertiary">(no target)</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-text-primary">{screen.label}</p>
            <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
              {hotspots.length > 0
                ? `${hotspots.filter((h) => h.targetStep != null).length} clickable areas`
                : "Click anywhere to advance"}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-1.5">
            <span className="mr-2 font-mono text-[10px] text-text-tertiary">
              {visited.size}/{screens.length} visited
            </span>
            {screens.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-[#00d4ff]"
                    : visited.has(idx)
                      ? "bg-white/40"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
