import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/JsonLd";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Darkscreens — Crypto Product Design Library",
  description:
    "Explore screens, flows, and UI patterns from 35+ wallets, exchanges, and DeFi protocols. The design reference built for crypto product teams.",
  icons: {
    icon: "/darkscreen-logo.png",
    apple: "/darkscreen-logo.png",
  },
  openGraph: {
    title: "Darkscreens — Crypto Product Design Library",
    description:
      "Explore screens, flows, and UI patterns from 35+ wallets, exchanges, and DeFi protocols.",
    url: "https://darkscreens.xyz",
    siteName: "Darkscreens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darkscreens — Crypto Product Design Library",
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
    <html lang="en" className={`${dmSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <WebsiteJsonLd />
        <OrganizationJsonLd />
      </head>
      <body className="min-h-screen bg-dark-bg font-sans antialiased">
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
