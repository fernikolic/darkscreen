// MDK checkout micro-app on Cloud Run
const MDK_APP_URL =
  process.env.NEXT_PUBLIC_MDK_APP_URL ||
  "https://mdk-checkout-361527168048.us-central1.run.app";

/**
 * Redirect to the MDK checkout micro-app for Bitcoin/Lightning payment.
 *
 * Navigates to /api/start on the micro-app which generates a signed
 * checkout URL, creates the checkout, and renders the payment page.
 */
export function redirectToBitcoinCheckout(
  plan: "pro" | "team" | "education",
  email?: string | null,
): void {
  const url = new URL(`${MDK_APP_URL}/api/start`);
  url.searchParams.set("plan", plan);
  if (email) url.searchParams.set("email", email);
  window.location.href = url.toString();
}
