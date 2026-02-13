# Architecture

## Overview

Darkscreen is a fully static Next.js 14 site that provides visual competitive intelligence for crypto products. It uses `output: 'export'` to generate HTML at build time — no server required.

## Static Export

All routes are pre-rendered at build time via `next.config.ts`:

```ts
output: 'export'
```

Dynamic routes (e.g. `/library/[slug]`, `/screens/[appSlug]/[flow]/[step]`) use `generateStaticParams()` to enumerate all valid paths from `src/data/apps.ts`.

The build output (`out/`) is deployed to Cloudflare Pages as flat HTML/CSS/JS.

## Data Model

All app data lives in `src/data/apps.ts` — a single TypeScript file with types and a flat array of 39 crypto apps.

Each app has:

- **Top-level fields** — slug, name, category, url, description, flows, icon
- **`detailed: true`** — enables full detail page with screenshots and change history
- **`screenshots[]`** — array of `{ step, label, flow, image, tags? }` entries
- **`changes[]`** — array of `{ date, title, description, screenshots? }` entries
- **`authType?`** — `'login'` | `'wallet'` | `'none'` — determines crawl mode

### Categories

`wallet` | `exchange` | `defi` | `infrastructure` | `nft`

### Flows

`home` | `onboarding` | `send` | `receive` | `swap` | `staking` | `settings`

## Capture Pipeline

Zero-cost, fully local pipeline for systematic app screenshotting:

```
crawl-app.mjs   →  raw screenshots + {slug}-raw.json
label-local.mjs →  renamed files + {slug}-manifest.json
auto-tag.mjs    →  tags added to apps.ts screen entries
```

### Stage 1: Crawl (`crawl-app.mjs`)

Playwright-based deterministic crawler. Visits every page, tab, modal, and scroll state. Outputs numbered screenshots and a `{slug}-raw.json` manifest.

**Auth tiers:**

| Tier | Flag | Mechanism |
|------|------|-----------|
| Public | _(none)_ | Fresh browser context |
| Login | `--login` | Manual browser login, session saved for re-crawl |
| Wallet | `--wallet` | MetaMask extension with persistent profile |

Key flags: `--slug`, `--url`, `--all`, `--headed`, `--max-pages`, `--max-screenshots`, `--relogin`

### Stage 2: Label (`label-local.mjs`)

Classifies screenshots into flows using URL patterns and context text. Generates human-readable labels, renames files from `{slug}-raw-001.png` to `{slug}-{flow}-{step}-{description}.png`, and outputs `{slug}-manifest.json`.

### Stage 3: Tag (`auto-tag.mjs`)

Infers UI pattern tags (modal, form, dashboard, chart, etc.) from labels and flow context. Only tags entries that don't already have tags.

## Client-Side Interactivity

Most pages are static, but these components use `"use client"`:

- **Header** — mobile menu toggle, active route highlighting
- **FilterBar** — category/flow filter state
- **ScreenGallery** — image loading, modal triggers
- **ScreenModal** — keyboard navigation, zoom
- **BookmarkButton** — save/unsave state
- **EmailCapture** — form submission

## Auth & Payments

- **Firebase Auth** — Google sign-in for user accounts
- **Stripe** — subscription payments for premium access
- **Crypto payments** — alternative payment via crypto
- **PaywallOverlay** — gates premium content for non-subscribers
