"use client";

import { type IntelLayer, INTEL_LAYER_META } from "@/data/apps";

interface IntelLayerTabsProps {
  layers: IntelLayer[];
  activeLayer: IntelLayer;
  onLayerChange: (layer: IntelLayer) => void;
  layerCounts?: Partial<Record<IntelLayer, number>>;
}

export function IntelLayerTabs({
  layers,
  activeLayer,
  onLayerChange,
  layerCounts,
}: IntelLayerTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-dark-border">
      {layers.map((layer) => {
        const meta = INTEL_LAYER_META[layer];
        const isActive = activeLayer === layer;
        const count = layerCounts?.[layer];

        return (
          <button
            key={layer}
            onClick={() => onLayerChange(layer)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-all ${
              isActive
                ? "text-white"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
            style={{
              borderBottomColor: isActive ? meta.color : "transparent",
            }}
          >
            <span>{meta.label}</span>
            {count !== undefined && (
              <span
                className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                style={{
                  backgroundColor: isActive ? `${meta.color}15` : "rgba(255,255,255,0.05)",
                  color: isActive ? meta.color : undefined,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
