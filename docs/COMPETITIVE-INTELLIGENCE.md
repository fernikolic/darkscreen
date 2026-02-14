# Competitive Intelligence Features

Four automated intelligence features that extract metadata during crawls and surface it in the UI — all zero-cost (no API calls).

## Overview

| Feature | What It Does | Crawler Function | Post-Processing Script | UI Component |
|---------|-------------|------------------|----------------------|--------------|
| Change Detection | Surfaces visual diffs as timeline entries with before/after comparison | _(uses existing diff pipeline)_ | `generate-changes.mjs` | `DiffViewer` |
| Copy Tracking | Extracts h1, meta tags, CTAs, nav items; detects text changes | `extractPageCopy()` | `extract-copy.mjs` | `CopyTracker` |
| Tech Stack | Fingerprints frameworks, analytics, wallets, CDN from DOM/scripts | `detectTechStack()` | `sync-techstack.mjs` | `TechStackBadges` |
| Performance | Captures Core Web Vitals, page weight, resource breakdown | `capturePerformance()` | `sync-performance.mjs` | `PerformanceCard` |

## Architecture

Data flows through three stages:

```
1. CRAWL          2. POST-PROCESS        3. UI
───────────       ──────────────         ──────
crawl-app.mjs  →  generate-changes.mjs  →  src/data/auto-changes.ts  →  ChangeTimeline + DiffViewer
               →  extract-copy.mjs      →  src/data/copy-tracking.ts →  CopyTracker
               →  sync-techstack.mjs    →  src/data/techstack.ts     →  TechStackBadges
               →  sync-performance.mjs  →  src/data/performance.ts   →  PerformanceCard
```

Generated TypeScript data files are checked into git and imported at build time. This keeps the static export model — no runtime data fetching.

---

## Data Model

All types are defined in `src/data/apps.ts`.

### Change Detection

```typescript
type DiffStatus = "changed" | "added" | "removed" | "unchanged";

interface DiffChange extends AppChange {
  source: "auto";              // Distinguishes from manual AppChange entries
  diffPercent?: number;        // Pixel diff percentage (0-100)
  beforeImage?: string;        // Path to archived screenshot
  afterImage?: string;         // Path to current screenshot
  flow?: string;               // Flow name (e.g. "Home")
  step?: number;               // Step number within flow
  screenLabel?: string;        // Human-readable screen label
}
```

### Copy Tracking

```typescript
interface CopySnapshot {
  date: string;                // YYYY-MM-DD
  url: string;                 // Page URL
  h1?: string;                 // Primary headline
  metaDescription?: string;    // <meta name="description">
  ogTitle?: string;            // <meta property="og:title">
  ogDescription?: string;      // <meta property="og:description">
  ctas: string[];              // Button/link text from hero area (max 10)
  navItems: string[];          // Unique navigation link text
}

interface CopyChange {
  date: string;
  element: string;             // What changed (e.g. "H1 headline", "CTA added")
  oldText: string;
  newText: string;
  url: string;
}
```

### Tech Stack

```typescript
interface TechStackEntry {
  category: string;            // "Framework" | "CSS" | "Analytics" | "Wallet" | etc.
  name: string;                // e.g. "Next.js", "Tailwind CSS", "Segment"
  evidence: string;            // How it was detected (e.g. "__NEXT_DATA__ or #__next")
}
```

### Performance

```typescript
interface PerformanceMetrics {
  date: string;                // YYYY-MM-DD
  url: string;
  loadTime: number;            // ms — loadEventEnd - navigationStart
  domContentLoaded: number;    // ms — domContentLoadedEventEnd - navigationStart
  lcp?: number;                // ms — Largest Contentful Paint
  cls?: number;                // score — Cumulative Layout Shift
  resourceCount: number;       // Total HTTP requests
  transferSize: number;        // Total bytes transferred
  breakdown: {
    js: number;                // JavaScript bytes
    css: number;               // Stylesheet bytes
    images: number;            // Image bytes
    fonts: number;             // Font bytes
    other: number;             // Everything else
  };
}
```

### Data Files

All start as empty `= {}` so the build works without any crawl data:

| File | Export | Type |
|------|--------|------|
| `src/data/auto-changes.ts` | `autoChangesBySlug` | `Record<string, DiffChange[]>` |
| `src/data/copy-tracking.ts` | `copyDataBySlug` | `Record<string, { snapshots: CopySnapshot[]; changes: CopyChange[] }>` |
| `src/data/techstack.ts` | `techStackBySlug` | `Record<string, TechStackEntry[]>` |
| `src/data/performance.ts` | `performanceBySlug` | `Record<string, PerformanceMetrics[]>` |

### Helper Functions

Defined in `src/data/helpers.ts`:

| Function | Returns | Description |
|----------|---------|-------------|
| `getAutoChanges(slug)` | `DiffChange[]` | Auto-detected changes for one app |
| `getAllChangesWithAuto()` | `(EnrichedChange \| EnrichedAutoChange)[]` | Merged manual + auto changes, sorted by date |
| `getCopyData(slug)` | `{ snapshots, changes }` | Copy snapshots and detected text changes |
| `getTechStack(slug)` | `TechStackEntry[]` | Tech stack entries for one app |
| `getAllTechStacks()` | `Record<string, { app, stack }>` | All apps with tech stack data |
| `getPerformanceData(slug)` | `PerformanceMetrics[]` | Historical performance snapshots |
| `getAllPerformanceData()` | `Record<string, { app, metrics }>` | All apps with performance data |

---

## Crawler Extensions

Three functions added to `scripts/crawl-app.mjs`, called automatically after the landing page loads. All use `page.evaluate()` — zero API cost.

### `extractPageCopy(page)`

Extracts from the DOM:
- `h1` text
- `<meta name="description">` content
- `<meta property="og:title">` and `og:description`
- Up to 10 CTA texts from `<a>` and `<button>` elements within the hero area (`<main>`, `[role="main"]`, or first `<section>`)
- Unique navigation link texts from `<nav>`, `<header>`, and `[role="navigation"]` areas

### `detectTechStack(page)`

Detection methods:

| Category | Technologies | Detection Method |
|----------|-------------|-----------------|
| Framework | Next.js, Nuxt, Gatsby, React, Vue, Angular | Global variables (`__NEXT_DATA__`, `__NUXT__`, etc.), DOM selectors (`#__next`, `[ng-version]`) |
| CSS | Tailwind, Bootstrap, Chakra UI, Material UI | Class pattern matching (`sm:`, `md:`, `chakra-`, `Mui*`) |
| Analytics | Segment, Mixpanel, GA, Hotjar, Amplitude, FullStory, Datadog | Global objects + `<script src>` analysis |
| Error Tracking | Sentry | `__SENTRY__` global or script src |
| Support | Intercom | `Intercom` global or script src |
| Wallet | Ethereum, Solana, Nostr | `window.ethereum`, `window.solana`, `window.nostr` |
| CDN | Vercel | Meta generator tag, `__vercel` cookie |
| Privacy | OneTrust, Cookiebot | DOM element IDs, script src |

### `capturePerformance(page)`

- **Timing**: Uses `performance.timing` for load time and DOM content loaded
- **LCP & CLS**: Registered via `page.evaluateOnNewDocument()` before `page.goto()` — uses `PerformanceObserver` for `largest-contentful-paint` and `layout-shift` entry types, storing values on `window.__DS_LCP` and `window.__DS_CLS`
- **Resources**: `performance.getEntriesByType('resource')` — categorized by initiator type and file extension into JS, CSS, images, fonts, and other

### Raw Manifest Output

The `{slug}-raw.json` manifest now includes three additional fields:

```json
{
  "slug": "aave",
  "url": "https://app.aave.com",
  "crawledAt": "2026-02-14T...",
  "totalScreenshots": 42,
  "pageCopy": { "h1": "...", "ctas": [...], ... },
  "techStack": [{ "category": "Framework", "name": "Next.js", ... }],
  "performance": { "loadTime": 2340, "lcp": 1890, ... },
  "screens": [...]
}
```

---

## Post-Processing Scripts

All scripts support `--slug <slug>` for single-app processing or `--all` to process every available app. They merge incrementally — running a script for one app won't overwrite data for other apps.

### `scripts/generate-changes.mjs`

**Input**: `public/screenshots/{slug}-diff.json` (produced by `diff-screens.mjs`)

**Output**: `src/data/auto-changes.ts`

**Logic**:
- Skips screens with status `unchanged` or `error`
- Infers `ChangeType` from diff data:
  - `status === "added"` → "New Feature"
  - `status === "removed"` → "Removed"
  - `diffPercent > 50` → "Redesign"
  - `diffPercent > 5` → "Layout Shift"
  - `diffPercent <= 5` → "Copy Change"
- Auto-generates description from screen label and diff percentage
- Includes `beforeImage` / `afterImage` paths for DiffViewer

### `scripts/extract-copy.mjs`

**Input**: `public/screenshots/{slug}-raw.json` (current) + `public/screenshots/archive/{slug}/{date}/{slug}-raw.json` (archived)

**Output**: `src/data/copy-tracking.ts`

**Logic**:
- Extracts `pageCopy` from the current raw manifest as a snapshot
- Compares against the most recent archived manifest to detect text changes
- Compares: h1, meta description, OG title, OG description, CTAs (added/removed)
- Appends new snapshots (deduped by date) and accumulates changes

### `scripts/sync-techstack.mjs`

**Input**: `public/screenshots/{slug}-raw.json`

**Output**: `src/data/techstack.ts`

**Logic**: Reads the `techStack` array from the raw manifest and writes it directly to the output file.

### `scripts/sync-performance.mjs`

**Input**: `public/screenshots/{slug}-raw.json` (current) + all archived manifests

**Output**: `src/data/performance.ts`

**Logic**:
- Collects performance entries from current and all archived manifests
- Deduplicates by date (keeps latest entry per date)
- Sorts chronologically to build a time series

---

## UI Components

### `DiffViewer` (`src/components/DiffViewer.tsx`)

Client component for before/after image comparison.

**Props**: `{ beforeImage, afterImage, diffPercent?, label? }`

**Modes**:
- **Slider** (default): Draggable vertical divider using an invisible `<input type="range">` controlling `clip-path: inset()` on the before image
- **Side by side**: Two-column grid with labeled before/after images

**Usage**: Rendered inline within `ChangeTimeline` when expanding an auto-detected change entry.

### `CopyTracker` (`src/components/CopyTracker.tsx`)

Client component displaying copy/messaging intelligence.

**Props**: `{ snapshots: CopySnapshot[], changes: CopyChange[], appName: string }`

**Sections**:
- **Current Copy**: Shows latest snapshot — h1, meta description, OG title, CTAs as pills, nav items as pills
- **Changes**: Expandable list of detected text changes with diff-style rendering (red strikethrough for old, green for new)

### `TechStackBadges` (`src/components/TechStackBadges.tsx`)

Server component (no `"use client"`) showing detected technologies as colored badge pills.

**Props**: `{ techStack: TechStackEntry[] }`

**Category colors**:

| Category | Color |
|----------|-------|
| Framework | Blue |
| CSS | Cyan |
| Analytics | Green |
| Error Tracking | Red |
| Support | Yellow |
| Wallet | Purple |
| CDN | Orange |
| Privacy | Zinc |

Badges show the technology name and display the detection evidence as a title tooltip.

### `PerformanceCard` (`src/components/PerformanceCard.tsx`)

Client component displaying performance metrics with Web Vitals thresholds.

**Props**: `{ metrics: PerformanceMetrics[], appName: string }`

**Key metrics** (color-coded green/amber/red):
- Load Time: good ≤3s, needs improvement ≤6s, poor >6s
- LCP: good ≤2.5s, needs improvement ≤4s, poor >4s
- CLS: good ≤0.1, needs improvement ≤0.25, poor >0.25

**Resource breakdown**: Horizontal stacked bar chart with legend (JS=amber, CSS=blue, Images=green, Fonts=purple, Other=zinc).

Shows historical snapshot count when multiple data points exist.

---

## Page Integration

### App Detail Page (`AppDetailContent.tsx`)

Under the Product tab, four sections are added after the screenshot gallery (each only renders if data exists):

1. **Change Timeline** — now merges manual `app.changes` with auto-detected changes from `getAutoChanges(slug)`, sorted by date. Auto entries show a cyan "Auto-detected" badge and an expandable DiffViewer.
2. **Copy & Messaging** — `CopyTracker` component with current snapshot and change history
3. **Tech Stack** — `TechStackBadges` component grouped by category
4. **Performance** — `PerformanceCard` with metrics and breakdown

### Changes Page (`/changes`)

- Now uses `getAllChangesWithAuto()` to include auto-detected changes
- **Source filter**: Toggle between All / Manual / Auto-detected
- Auto-detected entries display a cyan "Auto" badge next to the change type pill

### Tech Stack Page (`/techstack`)

New browse page with two views:

- **By Technology**: Table with columns — Technology, Category, App Count, Used By. Sorted by popularity (most apps first).
- **By App**: Card grid showing each app's detected tech stack using `TechStackBadges`

Includes search input (filters across tech names and app names) and category filter pills.

### Performance Page (`/performance`)

New browse page with a sortable table:

| Column | Sortable | Color-coded |
|--------|----------|-------------|
| App | Yes | — |
| Category | Yes | — |
| Load Time | Yes | Green/Amber/Red |
| LCP | Yes | Green/Amber/Red |
| CLS | Yes | Green/Amber/Red |
| Page Weight | Yes | — |
| Resources | Yes | — |

Includes category filter tabs matching the existing changes page pattern.

### Header Navigation

The Intel dropdown now includes two additional links with a visual separator:

```
Intel ▾
  Pricing Intelligence
  Marketing & Copy
  Hiring Signals
  Company Intel
  ─────────────────
  Tech Stack
  Performance
```

---

## Pipeline Usage

### Full pipeline for a single app

```bash
# 1. Archive current screenshots (creates baseline for comparison)
node scripts/archive-screens.mjs --slug aave

# 2. Crawl (now extracts copy, tech stack, and performance automatically)
node scripts/crawl-app.mjs --slug aave

# 3. Label and tag screenshots
node scripts/label-local.mjs --slug aave
node scripts/auto-tag.mjs --slug aave

# 4. Generate visual diffs against archive
node scripts/diff-screens.mjs --slug aave

# 5. Post-process into TypeScript data files
node scripts/generate-changes.mjs --slug aave
node scripts/extract-copy.mjs --slug aave
node scripts/sync-techstack.mjs --slug aave
node scripts/sync-performance.mjs --slug aave

# 6. Build and verify
npm run build
```

### Process all apps at once

```bash
node scripts/generate-changes.mjs --all
node scripts/extract-copy.mjs --all
node scripts/sync-techstack.mjs --all
node scripts/sync-performance.mjs --all
```

### First crawl (no archive yet)

On the first crawl of an app, there's no archive to diff against, so:
- `generate-changes.mjs` will find no diff file — this is expected
- `extract-copy.mjs` will capture a snapshot but detect no changes (no previous data)
- `sync-techstack.mjs` and `sync-performance.mjs` will capture current data

On subsequent crawls (after archiving), the diff and change detection pipelines will produce meaningful comparisons.

---

## File Reference

### New Files (14)

| File | Purpose |
|------|---------|
| `src/data/auto-changes.ts` | Generated — auto-detected change data by slug |
| `src/data/copy-tracking.ts` | Generated — copy snapshots and changes by slug |
| `src/data/techstack.ts` | Generated — tech stack entries by slug |
| `src/data/performance.ts` | Generated — performance metrics by slug |
| `scripts/generate-changes.mjs` | Reads diff JSON, writes auto-changes.ts |
| `scripts/extract-copy.mjs` | Reads pageCopy from manifests, writes copy-tracking.ts |
| `scripts/sync-techstack.mjs` | Reads techStack from manifests, writes techstack.ts |
| `scripts/sync-performance.mjs` | Reads performance from manifests, writes performance.ts |
| `src/components/DiffViewer.tsx` | Before/after image comparison (slider + side-by-side) |
| `src/components/CopyTracker.tsx` | Copy snapshot display + change diff list |
| `src/components/TechStackBadges.tsx` | Category-colored technology badge grid |
| `src/components/PerformanceCard.tsx` | Performance metrics with Web Vitals thresholds |
| `src/app/techstack/page.tsx` | Tech Stack Intelligence browse page |
| `src/app/performance/page.tsx` | Performance Benchmarks browse page |

### Modified Files (6)

| File | Changes |
|------|---------|
| `src/data/apps.ts` | Added 7 type definitions (DiffStatus, DiffChange, CopySnapshot, CopyChange, TechStackEntry, PerformanceMetrics) |
| `src/data/helpers.ts` | Added 7 accessor functions + EnrichedAutoChange type |
| `scripts/crawl-app.mjs` | Added 3 extraction functions, perf observers, manifest fields |
| `src/components/ChangeTimeline.tsx` | Supports DiffChange with auto badge + expandable DiffViewer |
| `src/components/AppDetailContent.tsx` | Added copy, tech stack, performance sections under Product tab |
| `src/app/changes/page.tsx` | Uses merged changes, added source filter (All/Manual/Auto) |
| `src/components/Header.tsx` | Added Tech Stack + Performance to Intel dropdown |
