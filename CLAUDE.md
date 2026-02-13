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
npm run build
# Output: out/ — deploy to Cloudflare Pages
```
