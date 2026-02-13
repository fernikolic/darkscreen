"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { type EnrichedScreen } from "@/data/helpers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getFlowPlayerLimit } from "@/lib/access";

interface FlowPlayerProps {
  screens: EnrichedScreen[];
  initialIndex: number;
  onClose: () => void;
}

type PlaybackState = "playing" | "paused";

export function FlowPlayer({ screens, initialIndex, onClose }: FlowPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("paused");

  // Two-layer crossfade: layer A and layer B
  const [layerAIndex, setLayerAIndex] = useState(initialIndex);
  const [layerBIndex, setLayerBIndex] = useState(initialIndex);
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { plan } = useSubscription();
  const limit = getFlowPlayerLimit(plan);
  const isGated = limit !== null;

  const canShowScreen = useCallback(
    (index: number) => {
      if (!isGated) return true;
      return index < limit;
    },
    [isGated, limit],
  );

  // Preload adjacent images
  useEffect(() => {
    const preloadIndices = [currentIndex - 1, currentIndex + 1].filter(
      (i) => i >= 0 && i < screens.length,
    );
    for (const i of preloadIndices) {
      const src = screens[i]?.image;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    }
  }, [currentIndex, screens]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (isTransitioning) return;
      if (nextIndex < 0 || nextIndex >= screens.length) return;

      // If gated and trying to go past limit, just set index to show paywall
      if (!canShowScreen(nextIndex) && isGated) {
        setCurrentIndex(nextIndex);
        setPlaybackState("paused");
        return;
      }

      setIsTransitioning(true);

      // Set the incoming layer's image
      if (activeLayer === "A") {
        setLayerBIndex(nextIndex);
      } else {
        setLayerAIndex(nextIndex);
      }

      // Flip active layer (triggers CSS transition)
      setActiveLayer((prev) => (prev === "A" ? "B" : "A"));

      // After transition completes, update state
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsTransitioning(false);
      }, 400);
    },
    [isTransitioning, screens.length, activeLayer, canShowScreen, isGated],
  );

  const goNext = useCallback(() => {
    if (currentIndex < screens.length - 1) {
      transitionTo(currentIndex + 1);
    } else {
      // At end, pause auto-play
      setPlaybackState("paused");
    }
  }, [currentIndex, screens.length, transitionTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      transitionTo(currentIndex - 1);
    }
  }, [currentIndex, transitionTo]);

  const jumpTo = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      transitionTo(index);
    },
    [currentIndex, transitionTo],
  );

  const togglePlayback = useCallback(() => {
    setPlaybackState((prev) => (prev === "playing" ? "paused" : "playing"));
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (playbackState === "playing") {
      intervalRef.current = setInterval(goNext, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playbackState, goNext]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlayback();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev, togglePlayback]);

  const screen = screens[currentIndex];
  if (!screen) return null;

  const showPaywall = isGated && !canShowScreen(currentIndex);

  const content = (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-dark-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Flow Player"
    >
      {/* Top bar with gradient overlay */}
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-text-primary">
              {screen.appName}
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-mono text-[12px] text-text-secondary">
              {screen.flow}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-1.5 text-[13px] text-text-tertiary transition-colors hover:text-white"
            >
              {playbackState === "playing" ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Play
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-[13px] text-text-tertiary transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Main image area — click to advance */}
      <div
        className="relative flex flex-1 cursor-pointer items-center justify-center"
        onClick={goNext}
      >
        {showPaywall ? (
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white">
              Pro Feature
            </p>
            <p className="max-w-sm text-[14px] leading-relaxed text-text-secondary">
              You&apos;ve previewed {limit} screens. Upgrade to Pro for unlimited flow playback.
            </p>
            <Link
              href="/#pricing"
              onClick={(e) => e.stopPropagation()}
              className="mt-6 inline-flex items-center gap-2 border border-white/60 bg-white/10 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* Layer A */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-[400ms]"
              style={{ opacity: activeLayer === "A" ? 1 : 0 }}
            >
              {screens[layerAIndex]?.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={screens[layerAIndex].image}
                  alt={screens[layerAIndex].label}
                  className="max-h-[80vh] max-w-[90vw] object-contain"
                  draggable={false}
                />
              )}
            </div>

            {/* Layer B */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-[400ms]"
              style={{ opacity: activeLayer === "B" ? 1 : 0 }}
            >
              {screens[layerBIndex]?.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={screens[layerBIndex].image}
                  alt={screens[layerBIndex].label}
                  className="max-h-[80vh] max-w-[90vw] object-contain"
                  draggable={false}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar with gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-text-primary">{screen.label}</p>
            <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
              Step {screen.step} of {screens.length}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {screens.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpTo(idx);
                }}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-white"
                    : isGated && idx >= limit
                      ? "bg-white/10"
                      : "bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to step ${idx + 1}`}
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
