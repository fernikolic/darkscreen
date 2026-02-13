import type { PlanId } from "./stripe";

// Apps available on the free tier
export const FREE_TIER_SLUGS = [
  "uniswap",
  "metamask",
  "phantom",
  "coinbase",
  "aave",
  "jupiter",
  "lido",
  "binance",
  "kraken",
  "curve",
] as const;

// Free tier limits
export const FREE_SCREEN_LIMIT = 5;
export const FREE_FLOW_PLAYER_LIMIT = 3;

export function canAccessApp(slug: string, plan: PlanId): boolean {
  if (plan === "pro" || plan === "team") return true;
  return (FREE_TIER_SLUGS as readonly string[]).includes(slug);
}

export function getScreenLimit(plan: PlanId): number | null {
  if (plan === "pro" || plan === "team") return null; // unlimited
  return FREE_SCREEN_LIMIT;
}

export function getFlowPlayerLimit(plan: PlanId): number | null {
  if (plan === "pro" || plan === "team") return null; // unlimited
  return FREE_FLOW_PLAYER_LIMIT;
}

export function canViewChangeHistory(plan: PlanId): boolean {
  return plan === "pro" || plan === "team";
}
