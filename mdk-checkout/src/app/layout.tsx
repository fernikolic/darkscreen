import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darkscreens Checkout",
  description: "Complete your payment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0C0C0E", color: "#F4F4F5", margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
