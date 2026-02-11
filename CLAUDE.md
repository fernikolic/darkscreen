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
| `src/data/apps.ts` | All app data — types and 35 crypto apps |
| `src/app/page.tsx` | Landing page |
| `src/app/library/page.tsx` | Library browse page with client-side filters |
| `src/app/library/[slug]/page.tsx` | App detail page (static params from data) |
| `src/app/globals.css` | Tailwind base + custom dark theme styles |
| `src/components/` | All UI components |
| `next.config.ts` | Static export config (`output: 'export'`) |
| `tailwind.config.ts` | Dark theme color palette |

## Architecture

- **Fully static** — `output: 'export'` generates HTML for all routes at build time
- **Client components** — FilterBar, ScreenshotStrip, Header (for interactivity)
- **Data-driven** — All app content in `src/data/apps.ts`, easy to extend
- **5 detailed apps** with screenshots + change history: MetaMask, Phantom, Uniswap, Coinbase, Aave
- **30 basic listings** with category, flows, and "coming soon" detail pages

## Design System

- Background: `#0a0a0f` (near-black with blue tint)
- Cards: `#13131a` with `#1e1e2e` borders
- Primary accent: `#00d4ff` (electric cyan)
- Secondary accent: `#8b5cf6` (muted purple)
- Fonts: Inter (body), JetBrains Mono (data/numbers)
- Glow effects on card hover, subtle noise texture overlay

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
