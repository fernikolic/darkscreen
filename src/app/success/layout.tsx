import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Confirmed | Darkscreens",
  description: "Your payment has been confirmed. Welcome to Darkscreens Pro.",
  robots: { index: false, follow: true },
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
