// Stripe Payment Link URLs (test mode)
export const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/test_9B6cN58No2g9a7y1F663K03",
  team: "https://buy.stripe.com/test_9B67sL3t40815Ri2Ja63K04",
  education: "https://buy.stripe.com/test_edu_placeholder",
} as const;

export type PlanId = "free" | "pro" | "team" | "education";

export interface PlanConfig {
  id: PlanId;
  name: string;
  stripeLink: string | null;
  price: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: { id: "free", name: "Free", stripeLink: null, price: 0 },
  pro: { id: "pro", name: "Pro", stripeLink: STRIPE_LINKS.pro, price: 9 },
  team: { id: "team", name: "Team", stripeLink: STRIPE_LINKS.team, price: 12 },
  education: { id: "education", name: "Education", stripeLink: STRIPE_LINKS.education, price: 4 },
};

/**
 * Redirect to Stripe Payment Link with optional pre-filled email
 */
export function redirectToCheckout(plan: "pro" | "team" | "education", email?: string | null) {
  const link = STRIPE_LINKS[plan];
  const url = new URL(link);
  if (email) {
    url.searchParams.set("prefilled_email", email);
  }
  window.location.href = url.toString();
}
