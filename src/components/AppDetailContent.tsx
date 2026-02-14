"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { type CryptoApp, type IntelLayer, INTEL_LAYER_META } from "@/data/apps";
import { getScreenLayer, getAppLayerCounts } from "@/data/helpers";
import { IntelLayerTabs } from "./IntelLayerTabs";
import { ScreenGallery } from "./ScreenGallery";
import { ChangeTimeline } from "./ChangeTimeline";

interface AppDetailContentProps {
  app: CryptoApp;
}

export function AppDetailContent({ app }: AppDetailContentProps) {
  const searchParams = useSearchParams();

  const layerCounts = useMemo(() => getAppLayerCounts(app), [app]);

  const availableLayers = useMemo(
    () =>
      (Object.keys(layerCounts) as IntelLayer[]).sort(
        (a, b) =>
          ["Product", "Pricing", "Marketing", "Careers", "Company"].indexOf(a) -
          ["Product", "Pricing", "Marketing", "Careers", "Company"].indexOf(b)
      ),
    [layerCounts]
  );

  const initialLayer = (() => {
    const param = searchParams.get("layer");
    if (param) {
      const match = availableLayers.find(
        (l) => l.toLowerCase() === param.toLowerCase()
      );
      if (match) return match;
    }
    return "Product" as IntelLayer;
  })();

  const [activeLayer, setActiveLayer] = useState<IntelLayer>(initialLayer);

  const layerScreens = useMemo(
    () => app.screens.filter((s) => getScreenLayer(s) === activeLayer),
    [app.screens, activeLayer]
  );

  const layerFlows = useMemo(() => {
    const flows = new Set(layerScreens.map((s) => s.flow));
    return Array.from(flows);
  }, [layerScreens]);

  const showTabs = availableLayers.length > 1;
  const meta = INTEL_LAYER_META[activeLayer];

  return (
    <>
      {/* Layer tabs — only shown if app has multiple layers */}
      {showTabs && (
        <div className="mb-8">
          <IntelLayerTabs
            layers={availableLayers}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            layerCounts={layerCounts}
          />
        </div>
      )}

      {/* Screenshot gallery */}
      <section className="mb-16 border-t border-dark-border pt-10">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          {showTabs ? meta.label : "Screens"}
        </p>
        <h2 className="mb-8 font-heading font-semibold text-xl text-text-primary">
          {activeLayer === "Product" ? "UI Gallery" : `${meta.label} Screenshots`}
        </h2>
        {layerScreens.length > 0 ? (
          <ScreenGallery
            screens={layerScreens}
            accentColor={app.accentColor}
            appName={app.name}
            appSlug={app.slug}
            appCategory={app.category}
            appChains={app.chains}
            flows={layerFlows}
          />
        ) : (
          <div className="rounded-lg border border-dark-border bg-dark-card px-8 py-16 text-center">
            <p className="text-[14px] text-text-tertiary">
              No {meta.label.toLowerCase()} screens captured yet.
            </p>
          </div>
        )}
      </section>

      {/* Change timeline — only under Product tab */}
      {activeLayer === "Product" && (
        <section className="mb-16 border-t border-dark-border pt-10">
          <ChangeTimeline changes={app.changes} />
        </section>
      )}
    </>
  );
}
