"use client";

import { useState } from "react";
import {
  type AppCategory,
  type FlowType,
  type SectionType,
  type StyleType,
  type IntelLayer,
  SECTION_TYPES,
  STYLE_TYPES,
  INTEL_LAYERS,
  INTEL_LAYER_META,
} from "@/data/apps";

const categories: Array<AppCategory | "All"> = [
  "All",
  "Wallet",
  "Exchange",
  "DeFi",
  "Bridge",
  "NFT",
  "Analytics",
];

const flowTypes: Array<FlowType | "All Flows"> = [
  "All Flows",
  "Home",
  "Onboarding",
  "Swap",
  "Send",
  "Staking",
  "Settings",
];

const FLOW_LABELS: Record<string, string> = {
  "All Flows": "All Flows",
  Home: "Home / Dashboard",
  Onboarding: "Onboarding",
  Swap: "Swap / Trade",
  Send: "Send / Receive",
  Staking: "Staking",
  Settings: "Settings",
};

interface FilterBarProps {
  activeCategory: AppCategory | "All";
  activeFlow: FlowType | "All Flows";
  activeSections: SectionType[];
  activeStyles: StyleType[];
  activeLayer?: IntelLayer | "All";
  onCategoryChange: (cat: AppCategory | "All") => void;
  onFlowChange: (flow: FlowType | "All Flows") => void;
  onSectionsChange: (sections: SectionType[]) => void;
  onStylesChange: (styles: StyleType[]) => void;
  onLayerChange?: (layer: IntelLayer | "All") => void;
}

export function FilterBar({
  activeCategory,
  activeFlow,
  activeSections,
  activeStyles,
  activeLayer = "All",
  onCategoryChange,
  onFlowChange,
  onSectionsChange,
  onStylesChange,
  onLayerChange,
}: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);

  const toggleSection = (section: SectionType) => {
    if (activeSections.includes(section)) {
      onSectionsChange(activeSections.filter((s) => s !== section));
    } else {
      onSectionsChange([...activeSections, section]);
    }
  };

  const toggleStyle = (style: StyleType) => {
    if (activeStyles.includes(style)) {
      onStylesChange(activeStyles.filter((s) => s !== style));
    } else {
      onStylesChange([...activeStyles, style]);
    }
  };

  const moreFilterCount = activeSections.length + activeStyles.length + (activeFlow !== "All Flows" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Intelligence layer filter */}
      {onLayerChange && (
        <div>
          <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Intelligence Layer
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onLayerChange("All")}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                activeLayer === "All"
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
              }`}
            >
              All Layers
            </button>
            {INTEL_LAYERS.map((layer) => {
              const meta = INTEL_LAYER_META[layer];
              const isActive = activeLayer === layer;
              return (
                <button
                  key={layer}
                  onClick={() => onLayerChange(layer)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? "text-white"
                      : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
                  }`}
                  style={{
                    borderColor: isActive ? meta.color : undefined,
                    backgroundColor: isActive ? `${meta.color}15` : undefined,
                    color: isActive ? meta.color : undefined,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div>
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Category
        </span>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-none border-b-2 px-3 py-2 text-[13px] font-medium transition-all ${
                activeCategory === cat
                  ? "border-white/60 text-white"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat === "NFT" ? "NFT / Marketplaces" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* More filters toggle */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-2 text-[12px] font-medium text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {showMore ? "Less filters" : "More filters"}
        {moreFilterCount > 0 && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {moreFilterCount}
          </span>
        )}
      </button>

      {showMore && (
        <>
          {/* Flow type tabs */}
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Flow type
            </span>
            <div className="flex flex-wrap gap-1">
              {flowTypes.map((flow) => (
                <button
                  key={flow}
                  onClick={() => onFlowChange(flow)}
                  className={`rounded-none border-b-2 px-3 py-2 text-[12px] font-medium transition-all ${
                    activeFlow === flow
                      ? "border-text-secondary text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {FLOW_LABELS[flow] || flow}
                </button>
              ))}
            </div>
          </div>

          {/* Sections pills */}
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Sections
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_TYPES.map((section) => (
                <button
                  key={section}
                  onClick={() => toggleSection(section)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    activeSections.includes(section)
                      ? "pill-active-cyan"
                      : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {/* Styles pills */}
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Styles
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TYPES.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    activeStyles.includes(style)
                      ? "pill-active-amber"
                      : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
