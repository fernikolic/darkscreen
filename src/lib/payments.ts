import { STRIPE_LINKS, type PlanId } from "./stripe";

// Coinbase Commerce checkout URLs
// Replace with your actual Coinbase Commerce hosted checkout links
export const COINBASE_COMMERCE_LINKS = {
  pro: "https://commerce.coinbase.com/checkout/YOUR_PRO_CHECKOUT",
  team: "https://commerce.coinbase.com/checkout/YOUR_TEAM_CHECKOUT",
} as const;

export interface PaymentOption {
  stripeLink: string;
  cryptoLink: string;
}

export function getPaymentLinks(plan: "pro" | "team"): PaymentOption {
  return {
    stripeLink: STRIPE_LINKS[plan],
    cryptoLink: COINBASE_COMMERCE_LINKS[plan],
  };
}

export function getCheckoutUrl(
  plan: "pro" | "team",
  method: "stripe" | "crypto",
  email?: string | null
): string {
  if (method === "crypto") {
    return COINBASE_COMMERCE_LINKS[plan];
  }
  const url = new URL(STRIPE_LINKS[plan]);
  if (email) {
    url.searchParams.set("prefilled_email", email);
  }
  return url.toString();
}

export type { PlanId };
