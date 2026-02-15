# Darkscreens SEO Architecture

Complete reference for all SEO infrastructure across the Darkscreens site. Every feature here is build-time generated (static export) — no server-side rendering or client-side metadata.

---

## Table of Contents

1. [Overview](#overview)
2. [Metadata (generateMetadata)](#metadata)
3. [JSON-LD Structured Data](#json-ld-structured-data)
4. [FAQ Sections](#faq-sections)
5. [Content Enrichment](#content-enrichment)
6. [Sitemap](#sitemap)
7. [robots.txt](#robotstxt)
8. [LLM Context Files](#llm-context-files)
9. [File Reference](#file-reference)

---

## Overview

The site generates ~5,000+ static pages at build time. SEO coverage:

| Feature | Coverage |
|---------|----------|
| `generateMetadata` (title/desc/OG) | 15 page types |
| BreadcrumbJsonLd | 13 page types |
| CollectionPageJsonLd | 6 page types |
| FAQJsonLd + visible FAQ | 3 page types |
| SoftwareAppJsonLd | 1 page type (app detail) |
| WebsiteJsonLd | Root layout (all pages) |
| OrganizationJsonLd | Root layout (all pages) |
| Sitemap | All routes with priority tiers |
| robots.txt | Allow all + 11 named AI crawlers |
| llms.txt / llms-full.txt | LLM-optimized context files |

---

## Metadata

All dynamic pages export `generateMetadata` returning a Next.js `Metadata` object with `title`, `description`, and `openGraph`. Titles follow the pattern `{Page Title} — Darkscreens`.

### Root Layout (`src/app/layout.tsx`)

Static `metadata` export applied to all pages as the default.

```
Title:       "Darkscreens — Crypto Product Design Library"
Description: "Explore screens, flows, and UI patterns from {TOTAL_APPS}+ wallets, exchanges, and DeFi protocols."
OG Image:    https://darkscreens.xyz/og-image.png (1200x630)
Twitter:     summary_large_image
Icons:       /darkscreen-logo.png
```

### Per-Page Metadata

| Page | File | Title Pattern | Description Includes | OG Image |
|------|------|--------------|---------------------|----------|
| App detail | `library/[slug]/page.tsx` | `{name} — UI Screenshots, Flows & Design Patterns` | Screen count, flows list, category | App thumbnail |
| Screen detail | `screens/[appSlug]/[flow]/[step]/page.tsx` | `{label} — {app} {flow} Flow Step {n}` | Step description, total screen count | The screenshot itself |
| Screenshots | `screenshots/[slug]/page.tsx` | `{name} Screenshots — UI Design & Screens` | Screen count, category, last updated | — |
| Alternatives | `alternatives/[slug]/page.tsx` | `{name} Alternatives — {n} {category} Products Compared` | First 4 alternative names | — |
| Compare | `compare/[pair]/page.tsx` | `{A} vs {B} — UI Comparison` | Category, side-by-side description | — |
| Changelog | `changelog/[slug]/page.tsx` | `{name} UI Changelog — Design Changes & Updates` | Visual changelog description | — |
| Category | `category/[slug]/page.tsx` | From `CATEGORY_META[slug].title` | From `CATEGORY_META[slug].description` | — |
| Chain | `chain/[slug]/page.tsx` | From `CHAIN_META[slug].title` | From `CHAIN_META[slug].description` | — |
| Style | `style/[slug]/page.tsx` | From `STYLE_META[slug].title` | From `STYLE_META[slug].description` | — |
| Flow | `flows/[flow]/page.tsx` | From `FLOW_META[slug].title` | From `FLOW_META[slug].description` | — |
| Pattern | `patterns/[slug]/page.tsx` | From `PATTERN_META[slug].title` | From `PATTERN_META[slug].description` | — |
| Section | `section/[slug]/page.tsx` | From `SECTION_META[slug].title` | From `SECTION_META[slug].description` | — |
| Design (tag) | `design/[tag]/page.tsx` | From `ELEMENT_TAG_META[slug].title` | From `ELEMENT_TAG_META[slug].description` | — |
| Intel layer | `intel/[layer]/page.tsx` | `{label} Intelligence` | Layer-specific description | — |

All metadata dictionaries live in `src/data/seo.ts`:
- `CATEGORY_META` — 8 categories (wallet, exchange, defi, bridge, nft, analytics, payment, infrastructure). Each has `title`, `description`, `intro`, `plural`.
- `CHAIN_META` — 4 chains (bitcoin, ethereum, solana, multi-chain). Each has `title`, `description`, `intro`.
- `STYLE_META` — 8 styles (dark-mode, glassmorphism, minimal, card-heavy, data-dense, gradient-rich, neon-accents, clean-corporate). Each has `title`, `description`, `intro`.
- `FLOW_META` — 6 flows (home, onboarding, swap, send, staking, settings). Each has `title`, `description`, `intro`.
- `PATTERN_META` — 20+ category-flow combinations. Each has `title`, `description`.
- `SECTION_META` — 15 sections (dashboard, portfolio, trade-view, charts, token-list, etc.). Each has `title`, `description`, `intro`.
- `ELEMENT_TAG_META` — 16 UI patterns (modal-dialog, form-input, data-table, navigation, etc.). Each has `title`, `description`.

---

## JSON-LD Structured Data

All components in `src/components/JsonLd.tsx`. Each renders a `<script type="application/ld+json">` tag with static data (no user input).

### WebsiteJsonLd

**Renders on:** Every page (root layout `src/app/layout.tsx`, `<head>`)

```json
{
  "@type": "WebSite",
  "name": "Darkscreens",
  "url": "https://darkscreens.xyz",
  "potentialAction": { "@type": "SearchAction", "target": "...?search={search_term_string}" }
}
```

### OrganizationJsonLd

**Renders on:** Every page (root layout `src/app/layout.tsx`, `<head>`)

```json
{
  "@type": "Organization",
  "name": "Darkscreens",
  "sameAs": ["https://x.com/darkscreenxyz"]
}
```

### BreadcrumbJsonLd

**Renders on:** 13 page types. Props: `items: Array<{ name, url }>`. Maps to `BreadcrumbList` with indexed `ListItem` entries.

| Page | Breadcrumb Path |
|------|----------------|
| `library/[slug]` | Home > Library > {Category} > {App} |
| `screenshots/[slug]` | Home > Library > {App} > Screenshots |
| `alternatives/[slug]` | Home > Library > {App} > Alternatives |
| `changelog/[slug]` | Home > Library > {App} > Changelog |
| `compare/[pair]` | Home > Library > {A vs B} |
| `category/[slug]` | Home > Library > {Category} |
| `chain/[slug]` | Home > Library > {Chain} |
| `style/[slug]` | Home > Library > {Style} |
| `design/[tag]` | Home > Library > UI Patterns > {Tag} |
| `flows/[flow]` | Home > Flows > {Flow} Flow |
| `patterns/[slug]` | Home > Library > {Category Flow} |
| `section/[slug]` | Home > Library > {Section} |
| `screens/[appSlug]/[flow]/[step]` | Home > {App} > {Flow} > Step {n} |

### CollectionPageJsonLd

**Renders on:** 6 collection-style pages. Props: `name`, `description`, `url`, `itemCount`.

| Page | `itemCount` Source |
|------|-------------------|
| `category/[slug]` | Number of apps in category |
| `chain/[slug]` | Number of apps on chain |
| `style/[slug]` | Number of apps with style |
| `design/[tag]` | Number of screens with tag |
| `patterns/[slug]` | Number of apps with pattern |
| `section/[slug]` | Number of apps with section |

### SoftwareAppJsonLd

**Renders on:** `library/[slug]` (app detail pages for detailed apps only)

```json
{
  "@type": "SoftwareApplication",
  "applicationCategory": "{category}",
  "operatingSystem": "Web",
  "screenshot": { "@type": "ImageObject", "url": "{thumbnail}" }
}
```

### FAQJsonLd

**Renders on:** 3 page types (see [FAQ Sections](#faq-sections) below)

---

## FAQ Sections

Each FAQ implementation includes **both** invisible `FAQJsonLd` structured data and a **visible FAQ section** matching the dark design system (H3 headings + paragraphs).

### Data Generators (`src/data/seo.ts`)

#### `HOMEPAGE_FAQS` (static)

4 questions:
1. "What is Darkscreens?"
2. "How many crypto products does Darkscreens track?" — dynamically uses `apps.length`
3. "How often are screenshots updated?"
4. "Is Darkscreens free?"

#### `getCategoryFAQs(slug, name, plural, appCount, screenCount, appNames)`

Returns 4 questions:
1. "What is a crypto {name}?" — uses hand-written `CATEGORY_DESCRIPTIONS` per category
2. "How many {plural} does Darkscreens track?" — uses `appCount` and `screenCount`
3. "Which {plural} are included?" — lists first 6 `appNames`
4. "How often are screenshots updated?"

`CATEGORY_DESCRIPTIONS` covers: wallet, exchange, defi, bridge, nft, analytics, payment, infrastructure.

#### `getFlowFAQs(flowSlug, flowName, appCount, totalScreens)`

Returns 3 questions:
1. "What is a {flow} flow in crypto apps?" — uses hand-written `FLOW_DESCRIPTIONS` per flow
2. "How many crypto apps have a {flow} flow?" — uses `appCount` and `totalScreens`
3. "How can I compare {flow} flow designs?"

`FLOW_DESCRIPTIONS` covers: home, onboarding, swap, send, staking, settings.

### Where FAQs Render

| Page | File | Generator | Placement |
|------|------|-----------|-----------|
| Homepage | `src/app/page.tsx` | `HOMEPAGE_FAQS` | Before bottom CTA |
| Category | `category/[slug]/page.tsx` | `getCategoryFAQs()` | Before "Other categories" |
| Flow | `flows/[flow]/page.tsx` | `getFlowFAQs()` | Before "Other flow types" |

---

## Content Enrichment

Data-driven prose paragraphs on pages that would otherwise have thin content (<150 words).

### Compare Pages (`compare/[pair]/page.tsx`)

Added below the main description. Includes:
- Screen count for each app
- Flow count for each app
- Number of shared flows and which ones
- Chain support comparison

### Alternatives Pages (`alternatives/[slug]/page.tsx`)

Added below the main description. Includes:
- Source app's chain support
- Number of flows and which ones
- Design styles (first 2)
- Total screen count

### Screenshots Pages (`screenshots/[slug]/page.tsx`)

Added per-flow intro line above each flow's screenshot grid. Includes:
- Step count per flow
- First and last screen labels (e.g., `6 steps — from "Landing Page" to "Settings"`)

---

## Sitemap

**File:** `src/app/sitemap.ts`

Generated from `getAllSeoRoutes()` in `src/data/seo.ts`, which collects:
- Static routes: `/`, `/library`, `/flows`, `/screens`, `/changes`
- Per-app routes: `/library/{slug}`, `/screenshots/{slug}`, `/alternatives/{slug}`, `/changelog/{slug}`
- Per-screen routes: `/screens/{appSlug}/{flow}/{step}` (~4,000+ pages)
- Element tag pages: `/design/{slug}`
- Comparison pages: `/compare/{pair}` (all same-category pairs)
- Flow pages: `/flows/{slug}`
- Category pages: `/category/{slug}`
- Chain pages: `/chain/{slug}`
- Style pages: `/style/{slug}`
- Pattern pages: `/patterns/{slug}`
- Section pages: `/section/{slug}`

### Priority Tiers

| Priority | Change Frequency | Routes |
|----------|-----------------|--------|
| 1.0 | daily | `/` |
| 0.9 | daily | `/library`, `/flows` |
| 0.8 | weekly | `/library/{slug}`, `/screenshots/{slug}` |
| 0.7 | weekly | `/compare/*`, `/alternatives/*`, `/category/*`, `/chain/*` |
| 0.6 | weekly/daily | `/design/*`, `/patterns/*`, `/changelog/*` (changelog = daily) |
| 0.5 | weekly | Everything else |
| 0.4 | monthly | `/screens/{appSlug}/{flow}/{step}` (individual screenshots) |

All entries use `lastModified: new Date()` (build time).

---

## robots.txt

**File:** `src/app/robots.ts`

- **Default rule:** Allow all user agents on all paths
- **Named AI crawlers explicitly allowed:** GPTBot, ChatGPT-User, Google-Extended, Amazonbot, ClaudeBot, anthropic-ai, PerplexityBot, Bytespider, Cohere-ai, OAI-SearchBot, Applebot
- **Sitemap:** Points to `https://darkscreens.xyz/sitemap.xml`

---

## LLM Context Files

### `public/llms.txt` (concise, ~50 lines)

Designed for LLM systems that fetch context about referenced sites. Contains:
- Site description and value prop
- Product categories with counts and example names
- Chains covered
- Key URLs
- URL patterns for common queries (how to construct links for app screenshots, alternatives, comparisons, patterns, etc.)

### `public/llms-full.txt` (comprehensive, ~280 lines)

Full product directory for deeper LLM context. Contains:
- Complete product tables for all 8 categories with columns: Product, Chains, Screens, Key flows
- All URL patterns for every page type
- Design system attributes tracked
- When-to-recommend guidance

---

## File Reference

### Core SEO Files

| File | Purpose |
|------|---------|
| `src/components/JsonLd.tsx` | All 6 JSON-LD components |
| `src/data/seo.ts` | Metadata dictionaries, FAQ generators, slug helpers, route generation |
| `src/app/layout.tsx` | Root metadata + WebsiteJsonLd + OrganizationJsonLd |
| `src/app/sitemap.ts` | Sitemap generation with priority tiers |
| `src/app/robots.ts` | robots.txt rules |
| `src/lib/screenshot-url.ts` | CDN URL helper for OG images |
| `public/llms.txt` | Concise LLM context |
| `public/llms-full.txt` | Full LLM context |

### Pages with SEO Implementation

| File | Metadata | Breadcrumb | Collection | FAQ | Enrichment |
|------|----------|------------|------------|-----|------------|
| `library/[slug]/page.tsx` | Yes | Yes | — | — | — |
| `screens/[appSlug]/[flow]/[step]/page.tsx` | Yes | Yes | — | — | — |
| `screenshots/[slug]/page.tsx` | Yes | Yes | — | — | Yes |
| `alternatives/[slug]/page.tsx` | Yes | Yes | — | — | Yes |
| `compare/[pair]/page.tsx` | Yes | Yes | — | — | Yes |
| `changelog/[slug]/page.tsx` | Yes | Yes | — | — | — |
| `category/[slug]/page.tsx` | Yes | Yes | Yes | Yes | — |
| `chain/[slug]/page.tsx` | Yes | Yes | Yes | — | — |
| `style/[slug]/page.tsx` | Yes | Yes | Yes | — | — |
| `flows/[flow]/page.tsx` | Yes | Yes | — | Yes | — |
| `patterns/[slug]/page.tsx` | Yes | Yes | Yes | — | — |
| `section/[slug]/page.tsx` | Yes | Yes | Yes | — | — |
| `design/[tag]/page.tsx` | Yes | Yes | Yes | — | — |
| `intel/[layer]/page.tsx` | Yes | — | — | — | — |
| `page.tsx` (homepage) | Yes (layout) | — | — | Yes | — |

### Adding SEO to a New Page Type

1. Add `generateMetadata` exporting title, description, and openGraph
2. Import `BreadcrumbJsonLd` from `@/components/JsonLd` and add it as the first child inside the page container
3. If it's a collection/listing page, also add `CollectionPageJsonLd`
4. Add the route pattern to `getAllSeoRoutes()` in `src/data/seo.ts` so it appears in the sitemap
5. If the page has enough volume, consider adding a FAQ section with `FAQJsonLd` + visible FAQ
