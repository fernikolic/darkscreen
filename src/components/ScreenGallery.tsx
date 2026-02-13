"use client";

import { useState } from "react";
import Image from "next/image";
import { type AppScreen, type FlowType } from "@/data/apps";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getScreenLimit } from "@/lib/access";
import { PaywallOverlay } from "./PaywallOverlay";

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
  const { plan } = useSubscription();
  const limit = getScreenLimit(plan);

  const filtered =
    activeFlow === "All"
      ? screens
      : screens.filter((s) => s.flow === activeFlow);

  const hasMore = limit !== null && filtered.length > limit;
  const visible = limit !== null ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      {/* Flow tabs */}
      <div className="mb-8 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveFlow("All")}
          className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
            activeFlow === "All"
              ? "border-white/60 text-white"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          All
        </button>
        {flows.map((flow) => (
          <button
            key={flow}
            onClick={() => setActiveFlow(flow)}
            className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
              activeFlow === flow
                ? "border-white/60 text-white"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {flow}
          </button>
        ))}
      </div>

      {/* Screen gallery */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {visible.map((screen, idx) => (
            <div
              key={`${screen.flow}-${screen.step}-${idx}`}
              className="w-44 flex-shrink-0"
            >
              {screen.image ? (
                <div className="group relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg transition-all hover:border-text-tertiary">
                  <Image
                    src={screen.image}
                    alt={`${appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top"
                    sizes="176px"
                  />
                </div>
              ) : (
                <PlaceholderScreen
                  color={accentColor}
                  label={screen.label}
                  appName={appName}
                />
              )}
              <div className="mt-2.5 px-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                  Step {screen.step}
                </span>
                <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
                  {screen.label}
                </p>
              </div>
            </div>
          ))}

          {/* Blurred teasers for gated screens */}
          {hasMore &&
            filtered.slice(limit!, limit! + 2).map((screen, idx) => (
              <div
                key={`blur-${idx}`}
                className="w-44 flex-shrink-0 opacity-40 blur-sm"
              >
                {screen.image ? (
                  <div className="relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg">
                    <Image
                      src={screen.image}
                      alt=""
                      fill
                      className="object-cover object-top"
                      sizes="176px"
                    />
                  </div>
                ) : (
                  <PlaceholderScreen
                    color={accentColor}
                    label={screen.label}
                    appName={appName}
                  />
                )}
                <div className="mt-2.5 px-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    Step {screen.step}
                  </span>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
                    {screen.label}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Paywall overlay when screens are gated */}
      {hasMore && (
        <PaywallOverlay
          message={`Upgrade to Pro to see all ${filtered.length} screens. You're viewing ${limit} of ${filtered.length}.`}
        />
      )}
    </div>
  );
}
