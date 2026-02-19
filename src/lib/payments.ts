import { STRIPE_LINKS, type PlanId } from "./stripe";

export function getCheckoutUrl(
  plan: "pro" | "team" | "education",
  email?: string | null
): string | null {
  const link = STRIPE_LINKS[plan];
  if (!link) return null;
  const url = new URL(link);
  if (email) {
    url.searchParams.set("prefilled_email", email);
  }
  return url.toString();
}

export type { PlanId };
