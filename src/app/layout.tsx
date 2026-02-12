import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Darkscreen — Crypto Product Design Library",
  description:
    "Explore screens, flows, and UI patterns from 35+ wallets, exchanges, and DeFi protocols. The design reference built for crypto product teams.",
  openGraph: {
    title: "Darkscreen — Crypto Product Design Library",
    description:
      "Explore screens, flows, and UI patterns from 35+ wallets, exchanges, and DeFi protocols.",
    url: "https://darkscreen.xyz",
    siteName: "Darkscreen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darkscreen — Crypto Product Design Library",
    description:
      "Explore screens, flows, and UI patterns from 35+ wallets, exchanges, and DeFi protocols.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-dark-bg font-sans antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
