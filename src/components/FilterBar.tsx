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
    <div className="space-y-6">
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
                  ? "border-accent-gold text-accent-gold"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat === "NFT" ? "NFT / Marketplaces" : cat}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
