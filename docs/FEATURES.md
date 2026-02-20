# Darkscreen Feature Documentation

This document covers the competitive feature set implemented across 6 phases — from the OCR search pipeline to the intelligence layer.

---

## Table of Contents

1. [Phase 1: OCR + Content Scale Pipeline](#phase-1-ocr--content-scale-pipeline)
2. [Phase 2: AI Intelligence Features](#phase-2-ai-intelligence-features)
3. [Phase 3: Rich Media](#phase-3-rich-media)
4. [Phase 4: Platform Expansion + Export](#phase-4-platform-expansion--export)
5. [Phase 5: Polish](#phase-5-polish)
6. [Phase 6: Intelligence Layer](#phase-6-intelligence-layer)
7. [New Files Reference](#new-files-reference)
8. [Modified Files Reference](#modified-files-reference)
9. [Pipeline Commands](#pipeline-commands)
10. [Dependencies Added](#dependencies-added)
11. [Estimated API Costs](#estimated-api-costs)

---

## Phase 1: OCR + Content Scale Pipeline

### 1A. Full OCR Extraction

**Purpose:** Enable search over the actual text visible on every screenshot. The search infrastructure (Fuse.js) already supports OCR — it just needed data at scale.

#### Script: `scripts/extract-ocr.mjs`

Enhanced with:
- `--concurrency N` flag for parallel API calls (default: 5)
- `--slug <slug>` to extract OCR for a single app
- Progress bar with ETA, speed tracking, and remaining count
- Incremental saves (every 10 screenshots) for crash safety

```bash
# Extract OCR for all screenshots (parallel)
ANTHROPIC_API_KEY=sk-... node scripts/extract-ocr.mjs --concurrency 10

# Extract for a single app
ANTHROPIC_API_KEY=sk-... node scripts/extract-ocr.mjs --slug uniswap
```

Output: `src/data/ocr.json` — maps image paths to extracted text.

#### Search Changes: `src/lib/search.ts`

- **Updated Fuse.js weights:**
  - `ocrText`: 0.15 → 0.25 (boosted for better OCR results)
  - `label`: 0.35 → 0.30
  - `appName`: 0.25 → 0.20
  - `tagsText`: 0.15 (unchanged)
  - `flow`: 0.10 (unchanged)
- **Exact-match mode:** Wrapping a query in quotes (e.g., `"connect wallet"`) bypasses fuzzy matching and does a case-insensitive exact substring search on all fields.
- **New exports:** `getOcrText(imagePath)` and `getOcrSnippet(imagePath, query)` for displaying OCR context in search results.

#### Component: `src/components/OcrSnippet.tsx`

Renders a truncated OCR text snippet with `<mark>` highlighted matching terms. Used below ScreenCard thumbnails when a search query is active.

#### Route: `src/app/text-search/page.tsx`

Dedicated "Search text on screen" page:
- Headline: *"How do crypto apps say X?"*
- Phrase suggestions: "connect wallet", "slippage tolerance", "insufficient balance", etc.
- Results grouped by app, showing text snippets with context
- Links to individual screen detail pages

### 1B. Batch Crawl Workflow

Three new scripts for scaling the crawl pipeline:

#### `scripts/add-app.mjs`

Single-command app addition pipeline:

```bash
node scripts/add-app.mjs \
  --url https://raydium.io \
  --name Raydium \
  --category DeFi \
  --chains Solana
```

Pipeline: detect metadata → generate slug → append to `apps.ts` → fetch logo → crawl → label → tag → sync.

#### `scripts/batch-crawl.mjs`

Batch add from a JSON file:

```bash
node scripts/batch-crawl.mjs --input apps-to-add.json --concurrency 3
```

Input format:
```json
[
  { "url": "https://raydium.io", "name": "Raydium", "category": "DeFi", "chains": ["Solana"] },
  { "url": "https://orca.so", "name": "Orca", "category": "DeFi", "chains": ["Solana"] }
]
```

Features: configurable concurrency, per-app retry, summary report on completion.

#### `scripts/recrawl-stale.mjs`

Re-crawl apps where `lastUpdated` is older than N days:

```bash
# Re-crawl apps not updated in 14 days
node scripts/recrawl-stale.mjs --days 14

# Preview which apps would be re-crawled
node scripts/recrawl-stale.mjs --days 14 --dry-run
```

Skips login-required apps (exchanges, dashboards) since they can't be auto-crawled.

---

## Phase 2: AI Intelligence Features

### 2A. Visual/AI Search (Pre-computed Similarity)

**Approach:** Generate CLIP embeddings offline, pre-compute top-N similar screens per image, ship as static JSON. "Find Similar" on any screen is an instant lookup — no runtime AI cost.

#### Script: `scripts/generate-embeddings.py`

Python script using OpenAI CLIP (ViT-B/32):

```bash
pip install openai-clip torch pillow
python scripts/generate-embeddings.py
```

Outputs:
- `src/data/embeddings.bin` — binary Float32Array (~8MB raw → ~2MB gzipped)
- `src/data/embedding-index.json` — maps array position → image path

#### Script: `scripts/build-similarity.mjs`

Reads the embeddings binary, computes pairwise cosine similarity:

```bash
node scripts/build-similarity.mjs
```

Output: `src/data/similarity.json` — `{ [imagePath]: [top20SimilarPaths] }` (~400KB)

#### Component: `src/components/SimilarScreens.tsx`

Grid of similar screenshots rendered from pre-computed data. Given a screen's image path, it looks up the similarity index and renders ScreenCards for matches.

#### Integration: `src/components/ScreenModal.tsx`

- New **"Find Similar"** button in the top bar (between Save and Copy)
- Toggles a SimilarScreens panel below the main image
- Also supports video playback when `screen.video` exists

### 2B. UI Element-Level Browsing

**Purpose:** Enable browsing by specific UI components — "show me all token selectors across DeFi apps."

#### Data Model: `src/data/apps.ts`

Added 28 crypto-specific granular element types:

```typescript
type GranularElementTag =
  | ElementTag              // existing 16
  | "Token Selector"
  | "Swap Form"
  | "Price Chart"
  | "Gas Estimator"
  | "Wallet Connect Button"
  | "Transaction Confirmation"
  | "Portfolio Pie Chart"
  | "APY / Yield Display"
  | "Staking Form"
  | "Bridge Selector"
  | "Token Balance"
  | "Network Selector"
  | "Slippage Settings"
  | "Transaction History"
  | "Address Input"
  | "QR Code"
  | "Price Ticker"
  | "Volume Bar Chart"
  | "Order Book"
  | "Liquidity Pool Card"
  | "Fee Breakdown"
  | "Approval Button"
  | "Progress Stepper"
  | "Banner / Announcement"
  | "Tooltip / Popover"
  | "Copy Address Button"
  | "Explorer Link"
  | "Token Logo Grid"
  | "Countdown Timer";
```

Plus `DetectedElement` interface with bounding box data (`x`, `y`, `width`, `height`, `confidence`).

#### Script: `scripts/detect-elements.mjs`

Claude Vision element detection with bounding boxes:

```bash
ANTHROPIC_API_KEY=sk-... node scripts/detect-elements.mjs --concurrency 5
ANTHROPIC_API_KEY=sk-... node scripts/detect-elements.mjs --slug uniswap --force
```

Output: `src/data/elements.json` — maps image paths to arrays of detected elements with coordinates.

#### Routes

- `/elements` — Element browser index: grid of all element types with example thumbnails and counts
- `/elements/[element]` — Browse all instances of a specific element type across apps

#### Components

- `ElementHighlight.tsx` — SVG overlay rendering bounding boxes on screenshots with colored rectangles and labels on hover
- `ElementGrid.tsx` — Grid of element type cards with counts and example thumbnails

#### SEO Integration

- Element routes added to `src/data/seo.ts` with metadata
- Element routes added to `src/app/sitemap.ts` with 0.7 priority

### 2C. OCR Search UX

#### Component: `src/components/CopyResearch.tsx`

"How do crypto apps say X?" copywriting research tool:
- Input field for phrases like "connect wallet", "slippage tolerance"
- Shows all screenshots containing that text, grouped by app
- Shows OCR text in context around the matching phrase

#### SearchOverlay Update: `src/components/SearchOverlay.tsx`

Added **"Text on Screen"** tab alongside existing browse tabs (Trending, Categories, Screens, Sections, Styles). Contains:
- Quick link to `/text-search` page
- Common phrase quick links for fast OCR searching

---

## Phase 3: Rich Media

### 3A. Video/Animation Capture (WebM)

**Purpose:** Capture interactions (modal opens, swap flows, chart animations) as short video clips alongside static screenshots.

#### Data Model: `src/data/apps.ts`

```typescript
interface AppScreen {
  // ... existing fields ...
  video?: string;           // path to WebM clip "/screenshots/uniswap-swap-1.webm"
  videoDuration?: number;   // duration in seconds
}
```

#### Component: `src/components/VideoPlayer.tsx`

Custom WebM player:
- Dark theme matching controls (play/pause, scrub bar, loop toggle, fullscreen)
- Uses screenshot as poster frame
- Auto-play on hover (configurable)
- Keyboard: Space for play/pause, M for mute

#### Integration

- **ScreenModal**: Shows VideoPlayer instead of static image when `screen.video` exists
- **ScreenCard**: Play icon overlay badge when video is available
- **R2 Proxy** (`workers/r2-proxy/index.js`): Added `Content-Type: video/webm` handling
- **Upload script** (`scripts/upload-screenshots.sh`): Extended to upload `.webm` files with correct content type

#### Crawler Usage

When crawling with video recording enabled, Playwright captures interaction sequences as WebM. The crawl script outputs `{slug}-{flow}-{step}.webm` alongside PNG screenshots.

### 3B. Interactive Prototype Mode

**Purpose:** Turn passive flow slideshows into interactive prototypes with clickable hotspots.

#### Data Model: `src/data/apps.ts`

```typescript
interface ScreenHotspot {
  x: number;            // percentage from left (0-100)
  y: number;            // percentage from top (0-100)
  width: number;        // percentage width
  height: number;       // percentage height
  targetStep?: number;  // screen step this links to
  targetFlow?: FlowType; // flow this links to (cross-flow)
  label?: string;       // tooltip text
}

interface AppScreen {
  // ... existing fields ...
  hotspots?: ScreenHotspot[];
}
```

#### Script: `scripts/resolve-hotspots.mjs`

Post-crawl processing that resolves which hotspot links to which screen:

```bash
node scripts/resolve-hotspots.mjs --slug uniswap
```

Matches hotspot URLs to screens captured during crawl, assigning `targetStep` and `targetFlow`.

#### Component: `src/components/PrototypePlayer.tsx`

Full-screen interactive viewer:
- SVG hotspot overlay with colored highlights on hover
- Click a resolved hotspot → transitions to target screen (crossfade animation)
- Back button with breadcrumb trail of visited screens
- Progress indicator showing visited vs. unvisited screens
- Fallback: if no hotspots, behaves like FlowPlayer (click anywhere to advance)

#### FlowPlayer Integration

`src/components/FlowPlayer.tsx` now has a **"Prototype"** toggle button in the top bar. When active, it renders PrototypePlayer instead of the passive slideshow. Only shown when any screen in the flow has hotspot data.

---

## Phase 4: Platform Expansion + Export

### 4A. Mobile/Tablet Screenshot Support

#### Data Model: `src/data/apps.ts`

```typescript
type DeviceType = "desktop" | "mobile" | "tablet";

interface AppScreen {
  // ... existing fields ...
  device?: DeviceType;  // defaults to "desktop" when absent
}
```

#### Screens Page: `src/app/screens/page.tsx`

New device filter bar with pills: **All Devices** | **Desktop** | **Mobile** | **Tablet**

#### ScreenCard Aspect Ratios: `src/components/ScreenCard.tsx`

Aspect ratios adapt to device type:
- Desktop: 9:16 (portrait, default)
- Mobile: 9:19 (tall phone)
- Tablet: 3:4 (iPad-like)

#### Crawl Usage

The existing crawl script already supports `--mobile` and `--tablet` flags with device presets (iPhone 15 Pro, Pixel 8, iPad Pro). The `device` field is now preserved through the labeling and sync pipeline.

### 4B. Batch Export (ZIP Download)

#### Component: `src/components/BatchSelect.tsx`

Multi-select mode for screen grids:
- Toggle "Select" mode in the screen results header
- Checkbox overlay on each ScreenCard
- "Select All" / "Clear" quick actions
- Bottom action bar showing count + "Download ZIP" button

#### Utility: `src/lib/batch-export.ts`

```typescript
downloadScreensAsZip(screens: EnrichedScreen[], filename?: string): Promise<void>
```

- Fetches all selected screen images in parallel
- Creates ZIP archive via JSZip (dynamically imported to avoid bundle bloat)
- Triggers browser download with structured filenames: `{appSlug}-{flow}-{step}.png`

#### Screens Page Integration

`src/app/screens/page.tsx` wraps the screen grid with `BatchSelect`, providing checkbox overlays and the download action bar.

---

## Phase 5: Polish

### 5A. Light Mode Toggle

#### How It Works

1. **CSS Custom Properties** (`src/app/globals.css`): Theme colors defined as RGB channel values (e.g., `--color-bg: 12 12 14` for dark, `250 250 250` for light) — this format supports Tailwind opacity modifiers like `bg-dark-bg/70`.

2. **Tailwind Config** (`tailwind.config.ts`): Colors reference CSS variables with `<alpha-value>` support:
   ```
   dark.bg: "rgb(var(--color-bg) / <alpha-value>)"
   ```

3. **ThemeContext** (`src/contexts/ThemeContext.tsx`): React context with:
   - `theme` state ("dark" | "light")
   - `toggleTheme()` function
   - localStorage persistence (`darkscreen-theme` key)
   - System preference detection via `prefers-color-scheme` media query
   - Sets `data-theme` attribute on `<html>` element

4. **Header Toggle** (`src/components/Header.tsx`): Sun/moon SVG button in the right actions area. Sun icon in dark mode (switch to light), moon icon in light mode (switch to dark).

#### Theme Variable Map

| Variable | Dark | Light |
|----------|------|-------|
| `--color-bg` | `12 12 14` (#0C0C0E) | `250 250 250` (#FAFAFA) |
| `--color-card` | `21 21 24` (#151518) | `255 255 255` (#FFFFFF) |
| `--color-border` | `39 39 42` (#27272A) | `228 228 231` (#E4E4E7) |
| `--color-hover` | `30 30 34` (#1E1E22) | `244 244 245` (#F4F4F5) |
| `--color-text-primary` | `244 244 245` (#F4F4F5) | `24 24 27` (#18181B) |
| `--color-text-secondary` | `161 161 170` (#A1A1AA) | `82 82 91` (#52525B) |
| `--color-text-tertiary` | `113 113 122` (#71717A) | `161 161 170` (#A1A1AA) |

All existing Tailwind classes (`bg-dark-bg`, `text-text-primary`, `border-dark-border`, etc.) automatically respond to theme changes — no per-file refactoring needed.

### 5B. Education Tier

#### Pricing: `src/lib/stripe.ts`

| Plan | Price | Stripe Link |
|------|-------|-------------|
| Free | $0 | — |
| Pro | $9/mo | test link |
| Team | $12/member/mo | test link |
| **Education** | **$4/mo** | placeholder |

#### Access: `src/lib/access.ts`

Education plan gets **pro-equivalent access** — same unlimited screens, unlimited flow player, full change history, all apps. Implemented via `isPaid()` helper that checks for `pro`, `team`, or `education`.

#### Pricing UI: `src/components/Pricing.tsx`

4-column grid (was 3). Education card with:
- "$4/mo" pricing
- "Everything in Pro" + "Verify with .edu email" + "Perfect for research" + "Cancel anytime"
- Checkout redirect via Stripe

#### Firebase Webhook: `firebase-functions/src/index.ts`

Updated plan detection logic:
- `amount >= 1200` → team
- `amount <= 400` → education
- Otherwise → pro

#### Updated Files

- `src/contexts/SubscriptionContext.tsx`: `isPro` now includes education
- `src/lib/payments.ts`: Accepts `"education"` plan
- `src/components/CryptoPayModal.tsx`: Education option for Bitcoin payment

---

## Phase 6: Intelligence Layer

Six features that transform Darkscreen from a screenshot reference library into a product intelligence tool — showing what changed, why it matters, and what patterns to steal.

### 6A. Enhanced Change Detection & Visual Diffs

**Purpose:** Transform the flat `/changes` timeline into a rich, weekly-grouped change feed with before/after thumbnails and diff percentages.

#### Helpers: `src/data/helpers.ts`

New functions for time-based change grouping:

```typescript
getISOWeekKey(dateStr: string): string       // "2026-W08"
getWeekLabel(weekKey: string): string         // "Feb 16 – Feb 22, 2026"
getChangesByWeek(): WeeklyChangeGroup[]       // all changes grouped by ISO week
getRecentChanges(n: number): (EnrichedChange | EnrichedAutoChange)[]
getChangeStats(): { total, thisWeek, uniqueApps, autoDetected }
```

`WeeklyChangeGroup` contains the week key, label, and an array of merged manual + auto-detected changes sorted by date.

#### Component: `src/components/ChangeCard.tsx`

Rich change entry replacing the plain list items on `/changes`:
- Timeline dot indicator with connecting line
- Change type badge (Redesign, New Feature, etc.) + "Auto" source badge
- Diff percentage when available (`diffPercent > 0`)
- Expandable before/after image comparison (click to toggle)
- Links to app detail page

#### Component: `src/components/WeeklyDigest.tsx`

Collapsible weekly sections wrapping `ChangeCard` entries:
- Week date range header with chevron toggle
- Summary stats: total changes, type breakdown counts, unique apps
- First (most recent) week expanded by default

#### Component: `src/components/ChangeHeroBanner.tsx`

Homepage banner shown after `<Hero />`:
- "X changes detected this week" headline
- Up to 4 recent change thumbnails as preview grid
- "View all changes →" link to `/changes`
- Only renders when there are recent changes

#### Page Rewrite: `src/app/changes/page.tsx`

Two view modes toggled via pills:
- **Weekly view** — changes grouped into collapsible `WeeklyDigest` sections
- **Timeline view** — flat chronological list using `ChangeCard` components

Both views share the same filter pipeline (search, category, change type, source).

---

### 6B. Flow-Level Comparison

**Purpose:** Side-by-side flow comparison — select 2-4 apps and a flow type, compare how each implements the same user journey.

#### Helpers: `src/data/helpers.ts`

```typescript
getFlowsForApps(slugs: string[], flowType: FlowType): Map<string, EnrichedScreen[]>
getMaxStepCount(flowMap: Map<string, EnrichedScreen[]>): number
```

#### Component: `src/components/FlowComparisonTool.tsx`

Core interactive tool (~350 lines):
- **Flow type selector** — pills for all `FlowType` values
- **App selector** — search input with dropdown, max 4 apps, removable chips
- **Two view modes:**
  - *Side-by-side* — `FlowComparisonColumn` per app, vertically scrollable
  - *Step-by-step* — `StepComparisonRow` per step number, apps in columns
- **URL state** — `?apps=aave,uniswap&flow=Swap` for shareable links via `router.replace()`

#### Component: `src/components/FlowComparisonColumn.tsx`

Single app's flow rendered as a vertical column:
- Sticky header with app logo + name
- Screens listed top-to-bottom with step labels
- Scroll independently per column

#### Component: `src/components/StepComparisonRow.tsx`

One step across all selected apps in a horizontal row:
- Step number label on the left
- One cell per app — screenshot + label, or placeholder if that app has fewer steps

#### Page: `src/app/compare-flows/page.tsx`

Server wrapper with metadata. Wrapped in `<Suspense>` (required for `useSearchParams` in App Router).

#### Cross-links

- `src/app/compare/[pair]/page.tsx` — "Compare their flows step by step →" link when shared flows exist
- `src/app/flows/[flow]/page.tsx` — "Compare this flow across apps →" link

---

### 6C. Pattern Search (Unified Pattern Library)

**Purpose:** Unify fragmented pattern pages (`/design/[tag]`, `/elements/[element]`, `/patterns/[slug]`) into a searchable visual library of crypto-specific UX patterns.

#### Data: `src/data/patterns.ts`

18 crypto-specific UX pattern definitions:

```typescript
type PatternCategory = "UX Pattern" | "UI Element" | "Flow Pattern" | "Crypto-Specific";

interface PatternDefinition {
  slug: string;
  name: string;
  description: string;
  category: PatternCategory;
  tags: GranularElementTag[];      // element tags that match this pattern
  labelPatterns?: RegExp[];         // screen label regex matches
  flowTypes?: FlowType[];           // associated flow types
}
```

Patterns include: progressive-disclosure, skeleton-loading, gas-fee-breakdown, slippage-warning, token-selector, wallet-connection, price-impact-display, fee-transparency, transaction-confirmation, address-input, portfolio-overview, staking-rewards, swap-form, order-book, network-selector, progress-stepper, empty-state, notification-system.

Key functions:
```typescript
getAllPatterns(): PatternDefinition[]
getPatternBySlug(slug): PatternDefinition | undefined
getPatternWithScreens(slug): { pattern, screens, appCount }
getAllPatternsWithScreens(): PatternWithScreens[]
searchPatterns(query): PatternWithScreens[]
```

#### Helpers: `src/data/helpers.ts`

```typescript
getScreensByGranularTag(tag: GranularElementTag): EnrichedScreen[]
getScreensMatchingAnyTag(tags: GranularElementTag[]): EnrichedScreen[]
```

#### Component: `src/components/PatternLibrary.tsx`

Searchable grid with:
- Real-time text search across pattern names, descriptions, and tags
- Category pill filters: All | UX Pattern | UI Element | Flow Pattern | Crypto-Specific
- Results as `PatternCard` grid

#### Component: `src/components/PatternCard.tsx`

Card with:
- 2×2 thumbnail preview grid from matched screens
- Pattern name, description
- Category badge (color-coded)
- Screen count + app count
- Links to `/patterns/[slug]` detail page

#### Page: `src/app/patterns/page.tsx`

New patterns index page replacing the old static list. Renders `<PatternLibrary />`.

#### Page Update: `src/app/patterns/[slug]/page.tsx`

Rewritten `generateStaticParams()` merges both category-flow pattern slugs and UX pattern slugs. The render function checks UX patterns first (renders `UXPatternView` — screens grouped by app), falls back to the existing category-flow pattern view.

---

### 6D. AI-Generated Insights

**Purpose:** Build-time script sends diff data to Claude API, generates editorial insights about what changed and why it matters. New `/insights` page.

#### Script: `scripts/generate-insights.mjs`

Build-time insight generation using **Claude Sonnet 4.6** (`claude-sonnet-4-6`):

```bash
ANTHROPIC_API_KEY=sk-... npm run generate-insights
```

Pipeline:
1. Reads `data/*-diff.json` files (output of the diff pipeline)
2. Filters diffs with `diffPercent > 3%` (skips noise)
3. Sends each diff to Claude with app metadata + change context
4. Claude returns: title, summary, analysis, impact level, category
5. Writes output to `src/data/insights.ts` (idempotent — deduplicates by date + screenLabel)

Features:
- Batched: 5 concurrent API calls
- Cached: won't regenerate insights for diffs already processed
- Requires `ANTHROPIC_API_KEY` environment variable (build-time only, not in static output)

**Why Sonnet 4.6?** Called repeatedly per diff — Sonnet is faster/cheaper while producing good editorial analysis. Opus would be overkill for structured summaries.

#### Data: `src/data/insights.ts`

```typescript
type InsightCategory = "UX Change" | "Feature Launch" | "Design Trend"
  | "Copy Update" | "Flow Change" | "Competitive Move";

interface Insight {
  slug: string;           // app slug
  date: string;           // ISO date
  title: string;          // headline
  summary: string;        // 1-2 sentence summary
  analysis: string;       // detailed analysis paragraph
  impact: "low" | "medium" | "high";
  category: InsightCategory;
  beforeImage?: string;
  afterImage?: string;
  diffPercent?: number;
  flow?: string;
  screenLabel?: string;
}

export const insightsBySlug: Record<string, Insight[]> = {};
```

Starts empty — populated after first `generate-insights` run.

#### Helpers: `src/data/helpers.ts`

```typescript
getAllInsights(): Insight[]                    // flat array, newest first
getRecentInsights(days: number): Insight[]    // filtered by date window
```

#### Component: `src/components/InsightCard.tsx`

Expandable insight card:
- App logo + name, date
- Category badge (color-coded) + impact badge (low/medium/high)
- Title + summary always visible
- Click to expand: full analysis text + before/after images

#### Component: `src/components/InsightsPage.tsx`

Filtered insight feed:
- Category pill filters (All + each InsightCategory)
- App filter dropdown
- Paywall: free users see 2 insights/week, pro sees unlimited (via `getInsightLimit()`)
- `PaywallOverlay` when limit reached

#### Component: `src/components/InsightsBanner.tsx`

Homepage banner:
- Insight count + "This week in crypto UX" heading
- Recent insight titles as preview
- "View insights →" link

#### Access Control: `src/lib/access.ts`

```typescript
getInsightLimit(plan: PlanId): number | null
// free → 2 per week, pro/team/education → null (unlimited)
```

---

### 6E. Enhanced Export & Figma Workflow

**Purpose:** Export flows as image strips, Figma-compatible JSON, and enhanced batch export with format selection.

#### Utility: `src/lib/flow-strip.ts`

Canvas compositing for flow screenshots:

```typescript
createFlowStrip(
  screens: EnrichedScreen[],
  orientation: "horizontal" | "vertical",
  gap?: number,        // default: 16px
  maxHeight?: number   // default: 800px
): Promise<Blob>
```

How it works:
1. Fetches all flow images with `crossOrigin = "anonymous"`
2. Scales to uniform height (horizontal) or width (vertical)
3. Draws on offscreen `<canvas>` with `#0C0C0E` background and gaps
4. Returns PNG blob via `canvas.toBlob()`

#### Utility: `src/lib/figma-export.ts`

Figma-compatible JSON frame structure:

```typescript
interface FigmaFrame {
  type: "FRAME";
  name: string;
  width: number;
  height: number;
  children: FigmaNode[];
  metadata: {
    app: string;
    flow: string;
    exportedAt: string;
    source: string;
  };
}
```

Functions:
```typescript
generateFigmaJSON(screens, appName, flowName): FigmaFrame
downloadFigmaJSON(screens, appName, flowName): void    // triggers download
downloadMetadataJSON(screen): void                      // single screen metadata
```

#### Component: `src/components/ExportMenu.tsx`

Dropdown menu with 7 export formats:
1. **Download PNG** — direct image download
2. **Copy to clipboard** — via `copyImageToClipboard()`
3. **Flow strip (horizontal)** — stitched PNG via `createFlowStrip()`
4. **Flow strip (vertical)** — vertical stitched PNG
5. **Figma JSON** — structured frame export (pro-only)
6. **Metadata JSON** — screen metadata export
7. **Download as ZIP** — via JSZip (when multiple screens)

All format-specific modules are dynamically imported to avoid bundle bloat.

#### Component: `src/components/BatchExportPanel.tsx`

Batch export UI:
- Scope selector: by app or by flow
- Format selector: PNG ZIP, Flow strips, Figma JSON
- Progress bar during export
- Pro-only via `canBatchExport()`

#### Integration

- `src/components/FlowPlayer.tsx` — `ExportMenu` added after the Copy button in the top bar
- `src/components/ScreenModal.tsx` — Download `<a>` tag replaced with `ExportMenu`
- `src/components/ScreenActions.tsx` — "More export options" expandable section with metadata JSON

#### Access Control: `src/lib/access.ts`

```typescript
canBatchExport(plan: PlanId): boolean   // pro/team/education only
canExportFigma(plan: PlanId): boolean   // pro/team/education only
```

---

### 6F. Shareable Collections

**Purpose:** Public share links for user-created collections. Collections can include per-screen notes/annotations.

#### Architecture

Uses a query param approach (`/shared?id=abc123`) instead of a dynamic route — required because `output: 'export'` can't handle user-generated `[shareId]` params at build time.

Firestore structure:
- **Private**: `users/{uid}/collections/{id}` — existing, owner-only read/write
- **Shared**: `sharedCollections/{shareId}` — new top-level collection, public read, owner-only write

#### Context Update: `src/contexts/CollectionsContext.tsx`

Extended `Collection` type:
```typescript
interface Collection {
  // ... existing fields ...
  shareId?: string;     // nanoid-generated public ID
  isPublic?: boolean;   // sharing status
  notes?: Record<string, string>;  // per-screen notes (key = image path with / → __)
}
```

New context methods:
```typescript
shareCollection(id: string): Promise<string | null>
// Generates nanoid, writes to sharedCollections/{shareId}, returns shareId

unshareCollection(id: string): Promise<void>
// Deletes sharedCollections doc, clears shareId/isPublic on user collection

updateCollectionNote(collectionId: string, screenImage: string, note: string): Promise<void>
// Updates notes map on both user collection and shared collection (if public)
```

#### Component: `src/components/ShareCollectionButton.tsx`

Share/unshare toggle:
- "Share" → generates nanoid, writes shared doc, copies URL to clipboard
- "Shared" (cyan) → click to unshare, plus "Copy link" button
- Respects `getShareLimit()` — shows upgrade toast when limit reached

#### Component: `src/components/CollectionNotes.tsx`

Inline text notes per screen within a collection:
- "Add note" link when no note exists
- Textarea with Save/Cancel when editing
- Displays saved note as italic text with "Edit" link

#### Component: `src/components/SharedCollectionView.tsx`

Client-side viewer for shared collections:
1. Reads `?id=` from search params
2. Fetches `sharedCollections/{shareId}` from Firestore
3. Resolves screen data via `getAllScreens()` for labels, app names, and flow context
4. Renders grid of screen cards with app links and notes

#### Page: `src/app/shared/page.tsx`

Server wrapper with `<Suspense>` boundary (needed for `useSearchParams`).

#### Saved Page Update: `src/app/saved/page.tsx`

- `ShareCollectionButton` added to collection card actions (alongside Rename/Delete)
- "Public" badge (cyan pill) shown for shared collections

#### Access Control: `src/lib/access.ts`

```typescript
getShareLimit(plan: PlanId): number | null
// free → 1 shared collection, pro/team/education → null (unlimited)
```

---

## New Files Reference

| File | Phase | Purpose |
|------|-------|---------|
| `scripts/add-app.mjs` | 1B | Single-command app addition |
| `scripts/batch-crawl.mjs` | 1B | Batch app crawling from JSON |
| `scripts/recrawl-stale.mjs` | 1B | Re-crawl apps by staleness |
| `scripts/generate-embeddings.py` | 2A | CLIP embedding generator (Python) |
| `scripts/build-similarity.mjs` | 2A | Pairwise cosine similarity builder |
| `scripts/detect-elements.mjs` | 2B | Claude Vision element detection |
| `scripts/resolve-hotspots.mjs` | 3B | Post-crawl hotspot URL resolution |
| `src/data/similarity.json` | 2A | Pre-computed similar screens index |
| `src/data/elements.json` | 2B | Detected UI elements with bounding boxes |
| `src/components/OcrSnippet.tsx` | 1A | OCR text snippet with highlighted matches |
| `src/components/SimilarScreens.tsx` | 2A | Similar screens grid |
| `src/components/ElementHighlight.tsx` | 2B | SVG bounding box overlay |
| `src/components/ElementGrid.tsx` | 2B | Element type card grid |
| `src/components/CopyResearch.tsx` | 2C | "How do apps say X?" research tool |
| `src/components/VideoPlayer.tsx` | 3A | Custom WebM player |
| `src/components/PrototypePlayer.tsx` | 3B | Interactive prototype viewer |
| `src/components/BatchSelect.tsx` | 4B | Multi-select with ZIP export |
| `src/app/text-search/page.tsx` | 1A | Dedicated OCR text search page |
| `src/app/elements/page.tsx` | 2B | Element browser index |
| `src/app/elements/[element]/page.tsx` | 2B | Element type browse page |
| `src/contexts/ThemeContext.tsx` | 5A | Dark/light theme context |
| `src/lib/batch-export.ts` | 4B | ZIP download utility |
| `src/components/ChangeCard.tsx` | 6A | Rich change entry with before/after thumbnails |
| `src/components/WeeklyDigest.tsx` | 6A | Collapsible weekly change group |
| `src/components/ChangeHeroBanner.tsx` | 6A | Homepage banner: "X changes this week" |
| `src/components/FlowComparisonTool.tsx` | 6B | Core flow comparison interactive tool |
| `src/components/FlowComparisonColumn.tsx` | 6B | Single app's flow as vertical column |
| `src/components/StepComparisonRow.tsx` | 6B | One step across all apps in a row |
| `src/app/compare-flows/page.tsx` | 6B | Flow comparison page |
| `src/data/patterns.ts` | 6C | 18 UX pattern definitions + search functions |
| `src/components/PatternLibrary.tsx` | 6C | Searchable pattern grid with category filters |
| `src/components/PatternCard.tsx` | 6C | Pattern card with 2×2 preview thumbnails |
| `src/data/insights.ts` | 6D | AI-generated insight types + data store |
| `scripts/generate-insights.mjs` | 6D | Claude Sonnet 4.6 insight generation script |
| `src/components/InsightCard.tsx` | 6D | Expandable insight card with before/after |
| `src/components/InsightsPage.tsx` | 6D | Filtered insight feed with paywall |
| `src/components/InsightsBanner.tsx` | 6D | Homepage insight preview banner |
| `src/app/insights/page.tsx` | 6D | Insights page server wrapper |
| `src/lib/flow-strip.ts` | 6E | Canvas compositing for flow strip PNGs |
| `src/lib/figma-export.ts` | 6E | Figma-compatible JSON + metadata export |
| `src/components/ExportMenu.tsx` | 6E | 7-format export dropdown menu |
| `src/components/BatchExportPanel.tsx` | 6E | Batch export with scope/format/progress |
| `src/components/ShareCollectionButton.tsx` | 6F | Share/unshare toggle with link copy |
| `src/components/CollectionNotes.tsx` | 6F | Inline per-screen notes in collections |
| `src/components/SharedCollectionView.tsx` | 6F | Public shared collection viewer |
| `src/app/shared/page.tsx` | 6F | Shared collection page server wrapper |

## Modified Files Reference

| File | Phases |
|------|--------|
| `scripts/extract-ocr.mjs` | 1A |
| `scripts/upload-screenshots.sh` | 3A |
| `src/data/apps.ts` | 2B, 3A, 3B, 4A |
| `src/data/helpers.ts` | 2B, 6A, 6B, 6C, 6D |
| `src/data/seo.ts` | 2B, 6B, 6C, 6D, 6F |
| `src/lib/search.ts` | 1A |
| `src/lib/access.ts` | 5B, 6D, 6E, 6F |
| `src/lib/stripe.ts` | 5B |
| `src/lib/payments.ts` | 5B |
| `src/lib/batch-export.ts` | 4B, 6E |
| `src/app/globals.css` | 5A |
| `src/app/page.tsx` | 6A |
| `src/app/changes/page.tsx` | 6A |
| `src/app/screens/page.tsx` | 1A, 4A, 4B |
| `src/app/patterns/page.tsx` | 6C |
| `src/app/patterns/[slug]/page.tsx` | 6C |
| `src/app/compare/[pair]/page.tsx` | 6B |
| `src/app/flows/[flow]/page.tsx` | 6B |
| `src/app/saved/page.tsx` | 6F |
| `src/app/sitemap.ts` | 2B |
| `src/components/ScreenModal.tsx` | 2A, 3A, 6E |
| `src/components/FlowPlayer.tsx` | 3B, 6E |
| `src/components/ScreenActions.tsx` | 6E |
| `src/components/ScreenCard.tsx` | 3A, 4A |
| `src/components/SearchOverlay.tsx` | 2C |
| `src/components/Header.tsx` | 5A |
| `src/components/Providers.tsx` | 5A |
| `src/components/Pricing.tsx` | 5B |
| `src/components/CryptoPayModal.tsx` | 5B |
| `src/contexts/SubscriptionContext.tsx` | 5B |
| `src/contexts/CollectionsContext.tsx` | 6F |
| `tailwind.config.ts` | 5A |
| `workers/r2-proxy/index.js` | 3A |
| `firebase-functions/src/index.ts` | 5B |
| `package.json` | 1B, 4B, 6D, 6F |

## Pipeline Commands

```bash
# ─── Content Pipeline ─────────────────────────────────────────

# Add a single app (end-to-end)
node scripts/add-app.mjs --url https://app.com --name "App" --category DeFi --chains Ethereum

# Batch add apps
node scripts/batch-crawl.mjs --input apps-to-add.json --concurrency 3

# Re-crawl stale apps (older than 14 days)
node scripts/recrawl-stale.mjs --days 14

# ─── AI Enrichment ────────────────────────────────────────────

# Extract OCR text from all screenshots
ANTHROPIC_API_KEY=sk-... node scripts/extract-ocr.mjs --concurrency 10

# Detect UI elements with bounding boxes
ANTHROPIC_API_KEY=sk-... node scripts/detect-elements.mjs --concurrency 5

# Generate visual similarity embeddings
pip install openai-clip torch pillow
python scripts/generate-embeddings.py

# Build similarity index from embeddings
node scripts/build-similarity.mjs

# Resolve hotspot targets after crawling
node scripts/resolve-hotspots.mjs --slug uniswap

# ─── Intelligence Layer ──────────────────────────────────────

# Generate AI insights from diff data (requires Claude API key)
ANTHROPIC_API_KEY=sk-... npm run generate-insights

# ─── Build & Deploy ──────────────────────────────────────────

npm run build
npm run deploy
```

## Dependencies Added

| Package | Purpose | Install |
|---------|---------|---------|
| `jszip` | Client-side ZIP creation for batch export | `npm install jszip` |
| `openai-clip` + `torch` + `pillow` | CLIP embeddings (Python, dev machine only) | `pip install openai-clip torch pillow` |
| `nanoid` (v5) | Share ID generation for collection sharing | `npm install nanoid` |

## Estimated API Costs

| Feature | Model | Cost |
|---------|-------|------|
| Full OCR extraction (~4K screenshots) | Claude Haiku | ~$40 |
| Element detection (~4K screenshots) | Claude Haiku | ~$80 |
| Insight generation (per diff batch) | Claude Sonnet 4.6 | ~$2-5/run |
| **Total one-time** | | **~$120** |

Visual similarity (CLIP embeddings) runs locally — no API cost.
Insight generation is incremental — only processes new diffs each run.

## Access Control Summary (Phase 6)

| Feature | Free | Pro / Team / Education |
|---------|------|----------------------|
| Enhanced change feed | Full | Full |
| Flow comparison tool | Full | Full |
| Pattern search | Full | Full |
| AI insights | 2/week | Unlimited |
| Batch export | — | Full |
| Figma JSON export | — | Full |
| Shared collections | 1 collection | Unlimited |
