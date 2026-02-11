"use client";

import { useState } from "react";
import { type AppScreenshot, type FlowType } from "@/data/apps";
import { PlaceholderScreen } from "./PlaceholderScreen";

interface ScreenshotStripProps {
  screenshots: AppScreenshot[];
  accentColor: string;
  appName: string;
  flows: FlowType[];
}

export function ScreenshotStrip({
  screenshots,
  accentColor,
  appName,
  flows,
}: ScreenshotStripProps) {
  const [activeFlow, setActiveFlow] = useState<FlowType | "All">("All");

  const filtered =
    activeFlow === "All"
      ? screenshots
      : screenshots.filter((s) => s.flow === activeFlow);

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

      {/* Screenshot filmstrip */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {filtered.map((screenshot, idx) => (
            <div key={`${screenshot.flow}-${screenshot.step}-${idx}`} className="w-40 flex-shrink-0">
              <PlaceholderScreen
                color={accentColor}
                label={screenshot.label}
                appName={appName}
              />
              <div className="mt-2 px-1">
                <span className="font-mono text-[10px] text-zinc-600">
                  Step {screenshot.step}
                </span>
                <p className="text-xs text-zinc-400">{screenshot.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
