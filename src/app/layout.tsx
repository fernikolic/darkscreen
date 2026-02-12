import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Darkscreen — Visual Intelligence for Crypto Products",
  description:
    "See what every crypto product ships. Visual competitive intelligence for wallets, exchanges, and DeFi. Track UI changes. Spot features before they're announced.",
  openGraph: {
    title: "Darkscreen — Visual Intelligence for Crypto Products",
    description:
      "See what every crypto product ships. Visual competitive intelligence for wallets, exchanges, and DeFi.",
    url: "https://darkscreen.xyz",
    siteName: "Darkscreen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darkscreen — Visual Intelligence for Crypto Products",
    description:
      "See what every crypto product ships. Visual competitive intelligence for wallets, exchanges, and DeFi.",
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
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
