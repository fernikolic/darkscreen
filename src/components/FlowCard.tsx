"use client";

import Image from "next/image";
import { type AppFlow } from "@/data/helpers";

interface FlowCardProps {
  flow: AppFlow;
  isExpanded: boolean;
  onClick: () => void;
}

export function FlowCard({ flow, isExpanded, onClick }: FlowCardProps) {
  const previewScreens = flow.screens.slice(0, 5);

  return (
    <button onClick={onClick} className="group block w-full text-left">
      <div
        className={`overflow-hidden border bg-dark-card transition-all card-hover ${
          isExpanded ? "border-text-tertiary" : "border-dark-border"
        }`}
      >
        {/* Mini thumbnail strip */}
        <div className="flex gap-1 overflow-hidden p-3">
          {previewScreens.map((screen, idx) => (
            <div
              key={`${screen.flow}-${screen.step}-${idx}`}
              className="relative aspect-[9/16] w-12 flex-shrink-0 overflow-hidden bg-dark-bg"
            >
              {screen.image ? (
                <Image
                  src={screen.image}
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
