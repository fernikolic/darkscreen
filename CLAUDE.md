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
