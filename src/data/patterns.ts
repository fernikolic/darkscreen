import { type GranularElementTag, type FlowType } from "./apps";
import {
  getAllScreens,
  getScreensByGranularTag,
  getScreensMatchingAnyTag,
  type EnrichedScreen,
} from "./helpers";

export type PatternCategory =
  | "UX Pattern"
  | "UI Element"
  | "Flow Pattern"
  | "Crypto-Specific";

export interface PatternDefinition {
  slug: string;
  name: string;
  description: string;
  category: PatternCategory;
  tags: GranularElementTag[];
  labelPatterns?: RegExp[];
  flowTypes?: FlowType[];
}

const UX_PATTERNS: PatternDefinition[] = [
  {
    slug: "progressive-disclosure",
    name: "Progressive Disclosure",
    description:
      "Reveal complexity gradually — advanced settings, expandable details, and tiered information display.",
    category: "UX Pattern",
    tags: ["Tooltip / Popover", "Slippage Settings", "Fee Breakdown"],
    labelPatterns: [/advanced/i, /more\s*options/i, /details/i, /expand/i],
  },
  {
    slug: "skeleton-loading",
    name: "Skeleton Loading",
    description:
      "Placeholder UI that mirrors the shape of content while data loads, reducing perceived wait time.",
    category: "UX Pattern",
    tags: ["Loading State"],
    labelPatterns: [/loading/i, /skeleton/i],
  },
  {
    slug: "gas-fee-breakdown",
    name: "Gas Fee Breakdown",
    description:
      "How apps display network fees, gas estimates, priority tips, and total cost breakdowns.",
    category: "Crypto-Specific",
    tags: ["Gas Estimator", "Fee Breakdown"],
    labelPatterns: [/gas/i, /fee/i, /cost/i],
  },
  {
    slug: "slippage-warning",
    name: "Slippage Warning",
    description:
      "Patterns for displaying price impact, slippage tolerance, and trade execution warnings.",
    category: "Crypto-Specific",
    tags: ["Slippage Settings"],
    labelPatterns: [/slippage/i, /price\s*impact/i],
  },
  {
    slug: "token-selector",
    name: "Token Selector",
    description:
      "Token search, selection, and display patterns — search bars, token lists, balance display, and favorites.",
    category: "Crypto-Specific",
    tags: ["Token Selector", "Token Balance", "Token Logo Grid"],
    labelPatterns: [/token/i, /select.*token/i],
  },
  {
    slug: "wallet-connection",
    name: "Wallet Connection Flow",
    description:
      "How apps handle wallet discovery, connection modals, network switching, and account display.",
    category: "Flow Pattern",
    tags: ["Wallet Connect Button", "Network Selector"],
    labelPatterns: [/connect\s*wallet/i, /wallet/i],
    flowTypes: ["Onboarding"],
  },
  {
    slug: "price-impact-display",
    name: "Price Impact Display",
    description:
      "Visual patterns for showing how a trade affects market price — percentage display, warning colors, confirmation gates.",
    category: "Crypto-Specific",
    tags: ["Swap Form", "Fee Breakdown"],
    labelPatterns: [/price\s*impact/i, /impact/i],
  },
  {
    slug: "fee-transparency",
    name: "Fee Transparency",
    description:
      "How apps communicate all fees — network fees, protocol fees, spread, and total cost of a transaction.",
    category: "Crypto-Specific",
    tags: ["Fee Breakdown", "Gas Estimator"],
    labelPatterns: [/fee/i, /cost/i, /spread/i],
  },
  {
    slug: "transaction-confirmation",
    name: "Transaction Confirmation",
    description:
      "Confirmation screens, review steps, and final approval patterns before executing on-chain actions.",
    category: "Flow Pattern",
    tags: ["Transaction Confirmation", "Approval Button"],
    labelPatterns: [/confirm/i, /review/i, /approve/i],
  },
  {
    slug: "address-input",
    name: "Address Input",
    description:
      "Patterns for entering, validating, and displaying blockchain addresses — paste, QR scan, and address book.",
    category: "UI Element",
    tags: ["Address Input", "QR Code", "Copy Address Button"],
    labelPatterns: [/address/i, /recipient/i],
    flowTypes: ["Send"],
  },
  {
    slug: "portfolio-overview",
    name: "Portfolio Overview",
    description:
      "Dashboard patterns for displaying portfolio value, asset allocation, P&L, and token holdings.",
    category: "UX Pattern",
    tags: ["Portfolio Pie Chart", "Token Balance", "Price Chart"],
    labelPatterns: [/portfolio/i, /balance/i, /holdings/i],
    flowTypes: ["Home"],
  },
  {
    slug: "staking-rewards",
    name: "Staking & Rewards",
    description:
      "APY displays, validator selection, reward tracking, and delegation management patterns.",
    category: "Crypto-Specific",
    tags: ["APY / Yield Display", "Staking Form"],
    labelPatterns: [/stak/i, /reward/i, /yield/i, /apy/i],
    flowTypes: ["Staking"],
  },
  {
    slug: "swap-form",
    name: "Swap Form",
    description:
      "Core swap UI patterns — from/to token inputs, amount fields, swap direction toggle, and rate display.",
    category: "UI Element",
    tags: ["Swap Form", "Token Selector"],
    labelPatterns: [/swap/i, /exchange/i, /trade/i],
    flowTypes: ["Swap"],
  },
  {
    slug: "order-book",
    name: "Order Book Display",
    description:
      "Order book visualization patterns — bid/ask spread, depth charts, and real-time price ladders.",
    category: "UI Element",
    tags: ["Order Book", "Volume Bar Chart", "Price Chart"],
    labelPatterns: [/order\s*book/i, /depth/i],
  },
  {
    slug: "network-selector",
    name: "Network Selector",
    description:
      "Chain switching UI — network lists, chain icons, custom RPC, and multi-chain toggle patterns.",
    category: "Crypto-Specific",
    tags: ["Network Selector", "Bridge Selector"],
    labelPatterns: [/network/i, /chain/i, /switch\s*network/i],
  },
  {
    slug: "progress-stepper",
    name: "Progress Stepper",
    description:
      "Multi-step flow indicators — numbered steps, progress bars, and breadcrumb-style navigation.",
    category: "UX Pattern",
    tags: ["Progress Stepper"],
    labelPatterns: [/step/i, /progress/i],
  },
  {
    slug: "empty-state",
    name: "Empty State",
    description:
      "How apps handle zero-data states — first-time experiences, no results, and placeholder content with CTAs.",
    category: "UX Pattern",
    tags: ["Empty State"],
    labelPatterns: [/empty/i, /no\s*result/i, /get\s*started/i],
  },
  {
    slug: "notification-system",
    name: "Notification System",
    description:
      "Alert patterns — toast notifications, banners, in-app messages, and transaction status updates.",
    category: "UI Element",
    tags: ["Notification / Alert", "Banner / Announcement"],
    labelPatterns: [/notif/i, /alert/i, /banner/i],
  },
];

// ── Core API ─────────────────────────────────────────────────────────

export function getAllPatterns(): PatternDefinition[] {
  return UX_PATTERNS;
}

export function getPatternBySlug(slug: string): PatternDefinition | undefined {
  return UX_PATTERNS.find((p) => p.slug === slug);
}

export interface PatternWithScreens extends PatternDefinition {
  screens: EnrichedScreen[];
  appCount: number;
}

export function getPatternWithScreens(pattern: PatternDefinition): PatternWithScreens {
  const tagScreens = pattern.tags.length > 0
    ? getScreensMatchingAnyTag(pattern.tags)
    : [];

  const allScreens = getAllScreens();
  const tagScreenPaths = new Set(tagScreens.map((s) => s.image));

  // Also match by label patterns
  let labelScreens: EnrichedScreen[] = [];
  if (pattern.labelPatterns && pattern.labelPatterns.length > 0) {
    labelScreens = allScreens.filter(
      (s) =>
        !tagScreenPaths.has(s.image) &&
        pattern.labelPatterns!.some((re) => re.test(s.label))
    );
  }

  // Also match by flow types
  let flowScreens: EnrichedScreen[] = [];
  if (pattern.flowTypes && pattern.flowTypes.length > 0) {
    const existingPaths = new Set([
      ...tagScreenPaths,
      ...labelScreens.map((s) => s.image),
    ]);
    flowScreens = allScreens.filter(
      (s) =>
        !existingPaths.has(s.image) &&
        pattern.flowTypes!.includes(s.flow)
    );
  }

  const combined = [...tagScreens, ...labelScreens, ...flowScreens];
  const appCount = new Set(combined.map((s) => s.appSlug)).size;

  return { ...pattern, screens: combined, appCount };
}

export function getAllPatternsWithScreens(): PatternWithScreens[] {
  return UX_PATTERNS.map(getPatternWithScreens).sort(
    (a, b) => b.screens.length - a.screens.length
  );
}

export function searchPatterns(query: string): PatternWithScreens[] {
  const q = query.toLowerCase();
  const all = getAllPatternsWithScreens();

  if (!q) return all;

  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}
