// JSON-LD structured data components for SEO
// All data is statically generated from trusted internal sources (no user input)

import { TOTAL_APPS } from "@/data/apps";
import { screenshotUrl } from "@/lib/screenshot-url";

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Darkscreens",
    alternateName: "Darkscreens Crypto Design Library",
    url: "https://darkscreens.xyz",
    description:
      `Crypto product design library — screenshots, UI patterns, and visual competitive intelligence from ${TOTAL_APPS}+ wallets, exchanges, and DeFi protocols.`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://darkscreens.xyz/library?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Safe: jsonLd is a hardcoded static object with no user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Darkscreens",
    url: "https://darkscreens.xyz",
    description:
      "Product intelligence platform for crypto — systematically screenshotting every major crypto product and tracking design changes over time.",
    sameAs: ["https://x.com/darkscreenxyz"],
  };

  return (
    <script
      type="application/ld+json"
      // Safe: jsonLd is a hardcoded static object with no user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface CollectionPageJsonLdProps {
  name: string;
  description: string;
  url: string;
  itemCount: number;
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  itemCount,
}: CollectionPageJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    numberOfItems: itemCount,
    isPartOf: {
      "@type": "WebSite",
      name: "Darkscreens",
      url: "https://darkscreens.xyz",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Safe: all props come from static app data, not user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Safe: breadcrumb items come from static route data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface SoftwareAppJsonLdProps {
  name: string;
  description: string;
  url: string;
  category: string;
  screenshot?: string;
}

export function SoftwareAppJsonLd({
  name,
  description,
  url,
  category,
  screenshot,
}: SoftwareAppJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: category,
    operatingSystem: "Web",
  };

  if (screenshot) {
    jsonLd.screenshot = {
      "@type": "ImageObject",
      url: screenshotUrl(screenshot) || `https://darkscreens.xyz${screenshot}`,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Safe: all props come from static app data in apps.ts
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{ question: string; answer: string }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Safe: FAQ content is hardcoded static data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
