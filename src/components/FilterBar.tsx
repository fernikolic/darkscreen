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
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activeCategory === cat
                ? "pill-active"
                : "border-dark-border text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
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
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              activeFlow === flow
                ? "border-accent-purple/30 bg-accent-purple/10 text-accent-purple"
                : "border-dark-border text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {FLOW_LABELS[flow] || flow}
          </button>
        ))}
      </div>
    </div>
  );
}
