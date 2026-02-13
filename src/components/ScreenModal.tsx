"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { type EnrichedScreen } from "@/data/helpers";
import { SaveToCollectionModal } from "./SaveToCollectionModal";

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
  const currentIndex = flowScreens.findIndex(
    (s) => s.appSlug === screen.appSlug && s.flow === screen.flow && s.step === screen.step
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < flowScreens.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(flowScreens[currentIndex - 1]);
  }, [hasPrev, currentIndex, flowScreens, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(flowScreens[currentIndex + 1]);
  }, [hasNext, currentIndex, flowScreens, onNavigate]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showSave) return; // don't navigate while save modal is open
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
              Step {screen.step}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {screen.image && (
              <button
                onClick={() => setShowSave(true)}
                className="text-[13px] text-text-tertiary transition-colors hover:text-accent-gold"
              >
                Save
              </button>
            )}
            {screen.image && (
              <a
                href={screen.image}
                download={`${screen.appSlug}-${screen.flow}-${screen.step}.png`}
                className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
          {/* Prev arrow */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center border border-dark-border text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:hover:border-dark-border disabled:hover:text-text-tertiary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Screen */}
          <div className="flex max-h-full max-w-4xl flex-1 flex-col items-center">
            {screen.image ? (
              <div className="relative aspect-[16/10] w-full max-w-3xl overflow-hidden border border-dark-border">
                <Image
                  src={screen.image}
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
            <div className="mt-4 text-center">
              <p className="text-[14px] text-text-primary">{screen.label}</p>
              <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                {currentIndex + 1} of {flowScreens.length} in {screen.flow}
              </p>
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center border border-dark-border text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:hover:border-dark-border disabled:hover:text-text-tertiary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Save to collection modal */}
      {showSave && screen.image && (
        <SaveToCollectionModal
          screenImage={screen.image}
          onClose={() => setShowSave(false)}
        />
      )}
    </dialog>
  );
}
