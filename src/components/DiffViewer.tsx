"use client";

import { useState } from "react";
import Image from "next/image";

interface DiffViewerProps {
  beforeImage: string;
  afterImage: string;
  diffPercent?: number;
  label?: string;
}

export function DiffViewer({ beforeImage, afterImage, diffPercent, label }: DiffViewerProps) {
  const [mode, setMode] = useState<"slider" | "side">("slider");
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
        <div className="flex items-center gap-3">
          {label && (
            <span className="text-[13px] text-text-primary font-medium">{label}</span>
          )}
          {diffPercent !== undefined && (
            <span className="font-mono text-[11px] text-cyan-400">
              {diffPercent}% diff
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("slider")}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              mode === "slider"
                ? "bg-white/10 text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Slider
          </button>
          <button
            onClick={() => setMode("side")}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              mode === "side"
                ? "bg-white/10 text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Side by Side
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === "slider" ? (
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden">
            {/* After (bottom layer) */}
            <Image
              src={afterImage}
              alt="After"
              fill
              className="object-contain object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Before (top layer, clipped) */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image
                src={beforeImage}
                alt="Before"
                fill
                className="object-contain object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 pointer-events-none z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 z-20 cursor-col-resize opacity-0 w-full h-full"
          />
          <div className="flex justify-between px-4 py-2 text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
            <span>Before</span>
            <span>After</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-dark-border">
          <div className="bg-dark-bg p-2">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Before</p>
            <div className="relative aspect-video">
              <Image
                src={beforeImage}
                alt="Before"
                fill
                className="object-contain object-top rounded"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>
          <div className="bg-dark-bg p-2">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-wider text-text-tertiary">After</p>
            <div className="relative aspect-video">
              <Image
                src={afterImage}
                alt="After"
                fill
                className="object-contain object-top rounded"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
