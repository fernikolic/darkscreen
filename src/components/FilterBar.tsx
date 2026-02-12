"use client";

import { type AppCategory, type FlowType } from "@/data/apps";

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
  onCategoryChange: (cat: AppCategory | "All") => void;
  onFlowChange: (flow: FlowType | "All Flows") => void;
}

export function FilterBar({
  activeCategory,
  activeFlow,
  onCategoryChange,
  onFlowChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`rounded-xl border px-4 py-2 text-body-sm font-medium transition-all duration-300 ${
              activeCategory === cat
                ? "pill-active"
                : "border-dark-border/40 text-text-tertiary hover:border-dark-border hover:text-text-secondary"
            }`}
          >
            {cat === "NFT" ? "NFT / Marketplaces" : cat}
          </button>
        ))}
      </div>

      {/* Flow type pills */}
      <div className="flex flex-wrap gap-2">
        {flowTypes.map((flow) => (
          <button
            key={flow}
            onClick={() => onFlowChange(flow)}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-300 ${
              activeFlow === flow
                ? "pill-active-purple"
                : "border-dark-border/30 text-text-tertiary hover:border-dark-border hover:text-text-secondary"
            }`}
          >
            {FLOW_LABELS[flow] || flow}
          </button>
        ))}
      </div>
    </div>
  );
}
