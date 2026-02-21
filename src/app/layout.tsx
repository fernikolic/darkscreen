import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/JsonLd";
import { TOTAL_APPS } from "@/data/apps";
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

const siteDescription = `Explore screens, flows, and UI patterns from ${TOTAL_APPS} wallets, exchanges, and DeFi protocols. The design reference built for crypto product teams.`;
const shortDescription = `Explore screens, flows, and UI patterns from ${TOTAL_APPS} wallets, exchanges, and DeFi protocols.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://darkscreens.xyz"),
  title: "Darkscreens — Crypto Product Design Library",
  description: siteDescription,
  icons: {
    icon: "/darkscreen-logo.png",
    apple: "/darkscreen-logo.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Darkscreens — Crypto Product Design Library",
    description: shortDescription,
    url: "https://darkscreens.xyz",
    siteName: "Darkscreens",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Darkscreens — See how every crypto product actually ships",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Darkscreens — Crypto Product Design Library",
    description: shortDescription,
    images: ["/og-image.png"],
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
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM Full Context" />
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
