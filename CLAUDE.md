# Darkscreen — Claude Code Context

## What Is This?

Darkscreen is a product intelligence platform for crypto. We systematically screenshot every major crypto product, track how they change over time, and present visual competitive intelligence to product teams, founders, and designers.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router, static export) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Deploy | Cloudflare Pages |
| Database | None (static MVP) |

## Key Files

| File | Purpose |
|------|---------|
| `src/data/apps.ts` | All app data — types and 39 crypto apps |
| `src/app/page.tsx` | Landing page |
| `src/app/library/page.tsx` | Library browse page with client-side filters |
| `src/app/library/[slug]/page.tsx` | App detail page (static params from data) |
| `src/app/globals.css` | Tailwind base + custom dark theme styles |
| `src/components/` | All UI components |
| `src/lib/clipboard.ts` | Copy-to-clipboard utility + `useClipboardSupport` hook |
| `src/contexts/ToastContext.tsx` | Lightweight toast notification system |
| `src/components/ScreenActions.tsx` | Client-side Copy + Download buttons for screen detail page |
| `next.config.ts` | Static export config (`output: 'export'`) |
| `tailwind.config.ts` | Dark theme color palette |
| `scripts/crawl-app.mjs` | Deterministic Playwright crawler ($0 API cost) |
| `scripts/label-local.mjs` | Local flow classification + file renaming |
| `scripts/auto-tag.mjs` | Auto-infer screen tags from labels |
| `scripts/wallet-setup.mjs` | MetaMask extension setup for DeFi crawling |
| `scripts/fetch-logos.mjs` | Fetch app logos from free favicon/logo APIs |
| `src/components/AppLogo.tsx` | Reusable logo component with letter-circle fallback |

## Architecture

- **Fully static** — `output: 'export'` generates HTML for all routes at build time
- **Client components** — FilterBar, ScreenshotStrip, Header (for interactivity)
- **Data-driven** — All app content in `src/data/apps.ts`, easy to extend
- **Detailed apps** with screenshots + change history (Aave, Binance, Coinbase, Kraken, Leather, Lido, Mempool, MetaMask, Xverse)
- **Basic listings** with category, flows, and "coming soon" detail pages

## Capture Pipeline

Zero-cost, fully local pipeline — no API calls required.

```
crawl-app.mjs   →  raw screenshots + {slug}-raw.json
label-local.mjs →  renamed files + {slug}-manifest.json
auto-tag.mjs    →  tags added to apps.ts screen entries
```

### Crawl modes

| Mode | Flag | Use case |
|------|------|----------|
| Public | _(default)_ | Landing pages, marketing sites |
| Login | `--login` | Manual browser login, then auto-crawl (exchanges, dashboards) |
| Wallet | `--wallet` | MetaMask extension, auto-approves popups (DeFi apps) |

### Examples

```bash
# Public crawl
node scripts/crawl-app.mjs --slug aave

# Authenticated crawl (login once, reuse session)
node scripts/crawl-app.mjs --slug binance --login

# DeFi crawl with MetaMask
node scripts/crawl-app.mjs --slug uniswap --wallet

# Crawl all apps
node scripts/crawl-app.mjs --all
```

## App Logos

Every app in `apps.ts` has a corresponding logo at `/public/logos/{slug}.png`. Logos are displayed across 4 surfaces via the `AppLogo` component.

### Fetching logos

```bash
# Fetch logos for all apps missing a logo
npm run fetch-logos

# Fetch logo for a single new app
node scripts/fetch-logos.mjs --slug <slug>

# Re-fetch all logos (overwrite existing)
node scripts/fetch-logos.mjs --force

# Preview what would be fetched
node scripts/fetch-logos.mjs --dry-run
```

The script tries sources in waterfall order: Google Favicon (128px) → icon.horse → Clearbit → DuckDuckGo. Files < 1KB are skipped (likely placeholders). Batches 5 concurrent requests.

### When adding a new app

1. Add the app to `src/data/apps.ts`
2. Run `node scripts/fetch-logos.mjs --slug <slug>` to fetch its logo
3. If the script fails (all sources return tiny/broken images), manually save a PNG to `/public/logos/<slug>.png`
4. The `AppLogo` component handles missing logos gracefully — it shows a letter-circle fallback

### Where logos appear

| Surface | Size | File |
|---------|------|------|
| AppCard (library grid) | 20px | `src/components/AppCard.tsx` |
| LogoCloud (homepage footer) | 18px | `src/components/LogoCloud.tsx` |
| Hero (floating + inline cloud) | 16-64px | `src/components/Hero.tsx` |
| App detail header | 48px | `src/app/library/[slug]/page.tsx` |
| App detail "coming soon" | 40px | `src/app/library/[slug]/page.tsx` |

### AppLogo component

```tsx
<AppLogo slug="coinbase" name="Coinbase" size={24} />
```

Props: `slug`, `name`, `size` (default 24), `className`, `rounded`. Uses Next.js `<Image>` with `onError` fallback to a styled circle showing the first letter.

## Copy to Clipboard

Screenshots can be copied to clipboard from three surfaces: **ScreenModal**, **FlowPlayer**, and the **screen detail page**. Useful for pasting into Slack, Figma, Notion, etc.

### How it works

1. `copyImageToClipboard(imageUrl)` in `src/lib/clipboard.ts` fetches the image, draws it to a canvas, converts to PNG blob, and writes via `navigator.clipboard.write()`
2. `useClipboardSupport()` hook detects `ClipboardItem` support — Copy buttons auto-hide in unsupported browsers
3. Success/error feedback via the toast system

### Where Copy appears

| Surface | Location | Notes |
|---------|----------|-------|
| `ScreenModal` | Top bar, between Save and Download | |
| `FlowPlayer` | Top bar, between Play/Pause and Close | Hidden during paywall overlay, uses `stopPropagation` |
| Screen detail page | Sidebar, alongside Download | Via `ScreenActions` client component |

## Toast System

Lightweight notification system (no dependencies) following the existing context provider pattern.

- **Provider**: `ToastProvider` in `src/contexts/ToastContext.tsx`, wraps the app in `Providers.tsx`
- **Hook**: `useToast()` returns `showToast(message, type?)` where type is `'success' | 'error'`
- **UI**: `src/components/Toast.tsx` — dark card with green (success) / red (error) accent border
- **Behavior**: Auto-dismiss after 2s, max 3 stacked, portal-rendered at `z-[120]`, fixed bottom-right

## SEO

Full documentation in [`docs/SEO.md`](docs/SEO.md). Summary:

- **Metadata**: `generateMetadata` on all 15 dynamic page types (title, description, OG image)
- **JSON-LD**: 6 structured data types — WebsiteJsonLd and OrganizationJsonLd on every page, BreadcrumbJsonLd on 13 page types, CollectionPageJsonLd on 6, SoftwareAppJsonLd on app detail, FAQJsonLd on 3
- **FAQ sections**: Programmatic FAQ generators + visible sections on homepage, category, and flow pages
- **Sitemap**: Auto-generated from `getAllSeoRoutes()` with 5 priority tiers
- **robots.txt**: Allow all + 11 named AI crawlers explicitly allowed
- **LLM context**: `public/llms.txt` (concise) and `public/llms-full.txt` (full product directory)
- **Content enrichment**: Data-driven prose on compare, alternatives, and screenshots pages

Key files: `src/components/JsonLd.tsx`, `src/data/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`

## Design System

- Background: `#0C0C0E` (near-black)
- Cards: `#151518` with `#27272A` borders
- Text: `#F4F4F5` (primary), `#A1A1AA` (secondary), `#71717A` (tertiary)
- Accents: white / zinc for interactive elements
- Fonts: Space Grotesk (headings), Inter (body), Fira Code (mono/data)
- Subtle dot-grid texture overlay, card hover border shifts

## Environment Variables

None required for the MVP.

## Getting Started

```bash
npm install && npm run dev
```

## Deploy

```bash
npm run deploy
# Builds Next.js static export → out/, then deploys to Cloudflare Pages via wrangler
```

**Important:** The `firebase-functions/` directory contains Firebase Cloud Functions (Stripe webhooks, etc.). It was renamed from `functions/` because Wrangler auto-detects any `functions/` directory as Cloudflare Pages Functions and tries to compile it, which fails. Do not rename it back to `functions/`.
