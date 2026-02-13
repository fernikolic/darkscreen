import { STRIPE_LINKS, type PlanId } from "./stripe";

export function getCheckoutUrl(
  plan: "pro" | "team",
  email?: string | null
): string {
  const url = new URL(STRIPE_LINKS[plan]);
  if (email) {
    url.searchParams.set("prefilled_email", email);
  }
  return url.toString();
}

export type { PlanId };
