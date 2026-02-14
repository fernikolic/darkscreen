"use client";

import Image from "next/image";
import { type AppFlow } from "@/data/helpers";
import { useFlowPlayer } from "@/contexts/FlowPlayerContext";
import { screenshotUrl } from "@/lib/screenshot-url";

interface FlowCardProps {
  flow: AppFlow;
  isExpanded: boolean;
  onClick: () => void;
}

export function FlowCard({ flow, isExpanded, onClick }: FlowCardProps) {
  const { openPlayer } = useFlowPlayer();
  const previewScreens = flow.screens.slice(0, 5);

  return (
    <button onClick={onClick} className="group block w-full text-left">
      <div
        className={`relative overflow-hidden border bg-dark-card transition-all card-hover ${
          isExpanded ? "border-text-tertiary" : "border-dark-border"
        }`}
      >
        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openPlayer(flow.screens, 0);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center bg-black/60 text-white/70 opacity-0 transition-all hover:bg-black/80 hover:text-white group-hover:opacity-100"
          aria-label="Play flow"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>

        {/* Mini thumbnail strip */}
        <div className="flex gap-1 overflow-hidden p-3">
          {previewScreens.map((screen, idx) => (
            <div
              key={`${screen.flow}-${screen.step}-${idx}`}
              className="relative aspect-[9/16] w-12 flex-shrink-0 overflow-hidden bg-dark-bg"
            >
              {screen.image ? (
                <Image
                  src={screenshotUrl(screen.image)!}
                  alt={screen.label}
                  fill
                  className="object-cover object-top"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="h-px w-4 bg-dark-border" />
                </div>
              )}
            </div>
          ))}
          {flow.count > 5 && (
            <div className="flex aspect-[9/16] w-12 flex-shrink-0 items-center justify-center bg-dark-bg">
              <span className="font-mono text-[10px] text-text-tertiary">
                +{flow.count - 5}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="border-t border-dark-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-text-primary">
              {flow.appName}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              {flow.count} screens
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-block bg-dark-bg px-2 py-0.5 font-mono text-[11px] text-text-secondary">
              {flow.flowType}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {flow.appChains[0]}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
