"use client";

import { useState } from "react";
import Image from "next/image";
import { type AppScreenshot, type FlowType } from "@/data/apps";

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
  // Separate real screenshots from placeholders
  const withImages = screenshots.filter((s) => s.image);
  const [selected, setSelected] = useState(0);

  if (withImages.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-sm text-text-tertiary">
          Screenshots coming soon for {appName}.
        </p>
      </div>
    );
  }

  const current = withImages[selected];

  return (
    <div>
      {/* Large preview */}
      <div
        className="relative mb-6 aspect-[16/10] w-full overflow-hidden rounded-xl border transition-all duration-500"
        style={{ borderColor: `${accentColor}20` }}
      >
        <Image
          src={current.image!}
          alt={`${appName} — ${current.label}`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 900px"
          priority
        />
        {/* Label overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-bg/80 to-transparent px-5 pb-4 pt-10">
          <span className="font-mono text-[11px] text-text-ghost">{current.flow}</span>
          <p className="text-body-sm font-medium text-text-primary">{current.label}</p>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          {withImages.map((shot, idx) => (
            <button
              key={`${shot.flow}-${shot.step}-${idx}`}
              onClick={() => setSelected(idx)}
              className={`relative aspect-[16/10] w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                idx === selected
                  ? "opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
              style={{
                borderColor: idx === selected ? accentColor : "transparent",
              }}
            >
              <Image
                src={shot.image!}
                alt={shot.label}
                fill
                className="object-cover object-top"
                sizes="128px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot count */}
      <p className="mt-4 font-mono text-[11px] text-text-ghost">
        {withImages.length} captured screenshot{withImages.length !== 1 ? "s" : ""}
        {screenshots.length > withImages.length && (
          <span> &middot; {screenshots.length - withImages.length} more flows tracked</span>
        )}
      </p>
    </div>
  );
}
