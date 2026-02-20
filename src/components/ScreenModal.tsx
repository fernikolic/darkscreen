"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { SaveToCollectionModal } from "./SaveToCollectionModal";
import { useFlowPlayer } from "@/contexts/FlowPlayerContext";
import { copyImageToClipboard, useClipboardSupport } from "@/lib/clipboard";
import { useToast } from "@/contexts/ToastContext";
import { screenshotUrl } from "@/lib/screenshot-url";
import { SimilarScreens } from "./SimilarScreens";
import { VideoPlayer } from "./VideoPlayer";
import { ExportMenu } from "./ExportMenu";

interface ScreenModalProps {
  screen: EnrichedScreen;
  flowScreens: EnrichedScreen[];
  onClose: () => void;
  onNavigate: (screen: EnrichedScreen) => void;
}

export function ScreenModal({
  screen,
  flowScreens,
  onClose,
  onNavigate,
}: ScreenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showSave, setShowSave] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showEndSlide, setShowEndSlide] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const { openPlayer } = useFlowPlayer();
  const canCopy = useClipboardSupport();
  const { showToast } = useToast();
  const currentIndex = flowScreens.findIndex(
    (s) =>
      s.appSlug === screen.appSlug &&
      s.flow === screen.flow &&
      s.step === screen.step
  );
  const hasPrev = showEndSlide || currentIndex > 0;
  const hasNext = !showEndSlide && currentIndex < flowScreens.length - 1;
  const isLast = currentIndex === flowScreens.length - 1;

  const goPrev = useCallback(() => {
    if (showEndSlide) {
      setShowEndSlide(false);
      return;
    }
    if (currentIndex > 0) onNavigate(flowScreens[currentIndex - 1]);
  }, [showEndSlide, currentIndex, flowScreens, onNavigate]);

  const goNext = useCallback(() => {
    if (showEndSlide) return;
    if (isLast) {
      setShowEndSlide(true);
    } else {
      onNavigate(flowScreens[currentIndex + 1]);
    }
  }, [showEndSlide, isLast, currentIndex, flowScreens, onNavigate]);

  // Reset end slide when screen changes
  useEffect(() => {
    setShowEndSlide(false);
  }, [screen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showSave) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext, showSave]);

  // Click-outside-to-close: detect clicks on the backdrop (outside content)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-full w-full max-h-full max-w-full bg-dark-bg/95 backdrop-blur-sm"
      onClose={onClose}
    >
      <div className="flex h-full flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-text-primary">
              {screen.appName}
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-mono text-[12px] text-text-secondary">
              {screen.flow}
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-mono text-[12px] text-text-tertiary">
              {showEndSlide
                ? `${flowScreens.length} of ${flowScreens.length}`
                : `Step ${screen.step}`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {!showEndSlide && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    openPlayer(flowScreens, currentIndex);
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-text-tertiary transition-colors hover:text-white"
                >
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Play
                </button>
                <Link
                  href={getScreenPath(screen)}
                  className="text-[13px] text-text-tertiary transition-colors hover:text-white"
                >
                  Open
                </Link>
                {screen.image && (
                  <button
                    onClick={() => setShowSave(true)}
                    className="text-[13px] text-text-tertiary transition-colors hover:text-white"
                  >
                    Save
                  </button>
                )}
                {screen.image && canCopy && (
                  <button
                    onClick={async () => {
                      if (copying) return;
                      setCopying(true);
                      try {
                        await copyImageToClipboard(screenshotUrl(screen.image)!);
                        showToast("Copied to clipboard");
                      } catch {
                        showToast("Failed to copy", "error");
                      } finally {
                        setCopying(false);
                      }
                    }}
                    disabled={copying}
                    className="text-[13px] text-text-tertiary transition-colors hover:text-white disabled:opacity-50"
                  >
                    {copying ? "Copying..." : "Copy"}
                  </button>
                )}
                {screen.image && (
                  <button
                    onClick={() => setShowSimilar(!showSimilar)}
                    className={`text-[13px] transition-colors ${showSimilar ? "text-[#00d4ff]" : "text-text-tertiary hover:text-white"}`}
                  >
                    Find Similar
                  </button>
                )}
                {screen.image && (
                  <ExportMenu
                    screen={screen}
                    flowScreens={flowScreens}
                    imageUrl={screenshotUrl(screen.image)}
                    filename={`${screen.appSlug}-${screen.flow}-${screen.step}.png`}
                  />
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Main content — click outside image to close */}
        <div
          className="flex flex-1 items-center justify-center overflow-hidden p-6"
          onClick={handleBackdropClick}
        >
          {/* Prev arrow */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center border border-dark-border text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:hover:border-dark-border disabled:hover:text-text-tertiary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Screen or end slide */}
          <div className="flex max-h-full max-w-4xl flex-1 flex-col items-center">
            {showEndSlide ? (
              <div className="flex aspect-[16/10] w-full max-w-3xl flex-col items-center justify-center border border-dark-border bg-dark-card">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
                  End of flow
                </p>
                <p className="font-heading text-xl font-bold text-text-primary">
                  Want to see more?
                </p>
                <p className="mt-3 max-w-sm text-center text-[14px] leading-relaxed text-text-secondary">
                  Get full access to every screen, flow, and update across{" "}
                  {screen.appName} and 100+ other crypto products.
                </p>
                <Link
                  href="/#pricing"
                  className="mt-6 inline-flex items-center gap-2 border border-white/60 bg-white/10 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : screen.video ? (
              <div className="relative aspect-[16/10] w-full max-w-3xl overflow-hidden border border-dark-border">
                <VideoPlayer
                  src={screen.video}
                  poster={screen.image}
                  className="h-full w-full"
                />
              </div>
            ) : screen.image ? (
              <div className="relative aspect-[16/10] w-full max-w-3xl overflow-hidden border border-dark-border">
                <Image
                  src={screenshotUrl(screen.image)!}
                  alt={`${screen.appName} - ${screen.label}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] w-full max-w-3xl items-center justify-center border border-dark-border bg-dark-card">
                <div className="text-center">
                  <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
                    {screen.appName}
                  </span>
                  <span className="text-[13px] text-text-tertiary">
                    {screen.label}
                  </span>
                </div>
              </div>
            )}
            {!showEndSlide && (
              <div className="mt-4 text-center">
                <p className="text-[14px] text-text-primary">{screen.label}</p>
                <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                  {currentIndex + 1} of {flowScreens.length} in {screen.flow}
                </p>
              </div>
            )}
          </div>

          {/* Next arrow */}
          <button
            onClick={goNext}
            disabled={showEndSlide}
            className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center border border-dark-border text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:hover:border-dark-border disabled:hover:text-text-tertiary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Similar screens panel */}
      {showSimilar && screen.image && !showEndSlide && (
        <div className="border-t border-dark-border bg-dark-bg/80 px-6 py-4">
          <SimilarScreens
            imagePath={screen.image}
            limit={8}
            onScreenClick={(s) => {
              setShowSimilar(false);
              onNavigate(s);
            }}
          />
        </div>
      )}

      {/* Save to collection modal */}
      {showSave && screen.image && (
        <SaveToCollectionModal
          screenImage={screenshotUrl(screen.image)!}
          onClose={() => setShowSave(false)}
        />
      )}
    </dialog>
  );
}
