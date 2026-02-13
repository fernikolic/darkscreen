"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { type AppScreen, type FlowType, type AppCategory, type ChainType } from "@/data/apps";
import { type EnrichedScreen } from "@/data/helpers";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { ScreenModal } from "./ScreenModal";
import { PaywallOverlay } from "./PaywallOverlay";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getScreenLimit } from "@/lib/access";
import { useFlowPlayer } from "@/contexts/FlowPlayerContext";

interface ScreenGalleryProps {
  screens: AppScreen[];
  accentColor: string;
  appName: string;
  appSlug: string;
  appCategory: AppCategory;
  appChains: ChainType[];
  flows: FlowType[];
}

export function ScreenGallery({
  screens,
  accentColor,
  appName,
  appSlug,
  appCategory,
  appChains,
  flows,
}: ScreenGalleryProps) {
  const [activeFlow, setActiveFlow] = useState<FlowType | "All">("All");
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);
  const { openPlayer } = useFlowPlayer();

  const enriched = useMemo<EnrichedScreen[]>(
    () =>
      screens.map((s) => ({
        ...s,
        appSlug,
        appName,
        appCategory,
        appChains,
        accentColor,
      })),
    [screens, appSlug, appName, appCategory, appChains, accentColor]
  );

  const filtered =
    activeFlow === "All"
      ? enriched
      : enriched.filter((s) => s.flow === activeFlow);

  const { plan } = useSubscription();
  const screenLimit = getScreenLimit(plan);
  const isCapped = screenLimit !== null && filtered.length > screenLimit;
  const visibleScreens = isCapped ? filtered.slice(0, screenLimit) : filtered;

  // For the modal, navigate within the same flow as the selected screen
  const modalFlowScreens = useMemo(() => {
    if (!modalScreen) return [];
    return enriched
      .filter((s) => s.flow === modalScreen.flow)
      .sort((a, b) => a.step - b.step);
  }, [enriched, modalScreen]);

  return (
    <div>
      {/* Flow tabs */}
      <div className="mb-8 flex flex-wrap items-center gap-1">
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
        {activeFlow !== "All" && (
          <button
            onClick={() => openPlayer(filtered, 0)}
            className="ml-2 flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-[13px] text-text-tertiary transition-colors hover:text-white"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Play Flow
          </button>
        )}
      </div>

      {/* Screen gallery */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {visibleScreens.map((screen, idx) => (
            <button
              key={`${screen.flow}-${screen.step}-${idx}`}
              className="w-44 flex-shrink-0 text-left"
              onClick={() => setModalScreen(screen)}
            >
              {screen.image ? (
                <div className="group relative aspect-[16/10] cursor-pointer overflow-hidden border border-dark-border bg-dark-bg transition-all hover:border-text-tertiary">
                  <Image
                    src={screen.image}
                    alt={`${appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
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
            </button>
          ))}
        </div>
      </div>

      {/* Paywall for free users */}
      {isCapped && (
        <PaywallOverlay
          message={`You're seeing ${screenLimit} of ${filtered.length} screens. Upgrade to Pro for unlimited access.`}
        />
      )}

      {/* Lightbox modal */}
      {modalScreen && (
        <ScreenModal
          screen={modalScreen}
          flowScreens={modalFlowScreens}
          onClose={() => setModalScreen(null)}
          onNavigate={(s) => setModalScreen(s)}
        />
      )}
    </div>
  );
}
