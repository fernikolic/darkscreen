"use client";

import { useState } from "react";
import Image from "next/image";
import { type AppScreen, type FlowType } from "@/data/apps";
import { PlaceholderScreen } from "./PlaceholderScreen";

interface ScreenGalleryProps {
  screens: AppScreen[];
  accentColor: string;
  appName: string;
  flows: FlowType[];
}

export function ScreenGallery({
  screens,
  accentColor,
  appName,
  flows,
}: ScreenGalleryProps) {
  const [activeFlow, setActiveFlow] = useState<FlowType | "All">("All");

  const filtered =
    activeFlow === "All"
      ? screens
      : screens.filter((s) => s.flow === activeFlow);

  return (
    <div>
      {/* Flow tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFlow("All")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
            activeFlow === "All"
              ? "pill-active"
              : "border-dark-border text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          All
        </button>
        {flows.map((flow) => (
          <button
            key={flow}
            onClick={() => setActiveFlow(flow)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activeFlow === flow
                ? "pill-active"
                : "border-dark-border text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {flow}
          </button>
        ))}
      </div>

      {/* Screen gallery */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {filtered.map((screen, idx) => (
            <div key={`${screen.flow}-${screen.step}-${idx}`} className="w-40 flex-shrink-0">
              {screen.image ? (
                <div
                  className="relative aspect-[16/10] overflow-hidden rounded-lg border"
                  style={{ borderColor: `${accentColor}25` }}
                >
                  <Image
                    src={screen.image}
                    alt={`${appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top"
                    sizes="160px"
                  />
                </div>
              ) : (
                <PlaceholderScreen
                  color={accentColor}
                  label={screen.label}
                  appName={appName}
                />
              )}
              <div className="mt-2 px-1">
                <span className="font-mono text-[10px] text-zinc-600">
                  Step {screen.step}
                </span>
                <p className="text-xs text-zinc-400">{screen.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
