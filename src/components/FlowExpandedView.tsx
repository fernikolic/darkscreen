"use client";

import Image from "next/image";
import { type AppFlow, type EnrichedScreen } from "@/data/helpers";

interface FlowExpandedViewProps {
  flow: AppFlow;
  onScreenClick: (screen: EnrichedScreen) => void;
}

export function FlowExpandedView({ flow, onScreenClick }: FlowExpandedViewProps) {
  return (
    <div className="border border-t-0 border-dark-border bg-dark-card/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          {flow.appName} / {flow.flowType} / {flow.count} steps
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {flow.screens.map((screen, idx) => (
            <button
              key={`${screen.flow}-${screen.step}-${idx}`}
              onClick={() => onScreenClick(screen)}
              className="group w-36 flex-shrink-0 text-left"
            >
              {screen.image ? (
                <div className="relative aspect-[9/16] overflow-hidden border border-dark-border bg-dark-bg transition-all group-hover:border-text-tertiary">
                  <Image
                    src={screen.image}
                    alt={`${screen.appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top"
                    sizes="144px"
                  />
                </div>
              ) : (
                <div className="flex aspect-[9/16] flex-col items-center justify-center border border-dark-border bg-dark-bg p-3 transition-all group-hover:border-text-tertiary">
                  <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">
                    {screen.appName}
                  </span>
                  <span className="text-center text-[10px] text-text-tertiary">
                    {screen.label}
                  </span>
                </div>
              )}
              <div className="mt-2 px-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                  Step {screen.step}
                </span>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-text-secondary">
                  {screen.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
