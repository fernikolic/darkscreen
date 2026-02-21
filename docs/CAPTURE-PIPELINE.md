# Capture Pipeline

How Darkscreen screenshots every crypto product, classifies the screens, and gets them into the site.

## The Big Picture

The pipeline has 4 stages. Each one is a standalone script. You run them in order.

```
crawl-app.mjs  -->  label-local.mjs  -->  sync-manifests.mjs  -->  auto-tag.mjs
   (crawl)             (label)               (sync)                 (tag)
```

**Stage 1 — Crawl.** Playwright opens a real browser, visits every page on the app's website, and takes screenshots. Outputs numbered PNGs (`metamask-raw-001.png`, `metamask-raw-002.png`, ...) and a `metamask-raw.json` manifest with metadata.

**Stage 2 — Label.** Reads the raw manifest, classifies each screenshot into a flow (Home, Onboarding, Swap, Send, Staking, Settings), generates a human-readable label, and renames the files. `metamask-raw-001.png` becomes `metamask-home-1-landing-page.png`. Outputs `metamask-manifest.json`.

**Stage 3 — Sync.** Reads the labeled manifests and writes the screen data into `src/data/apps.ts` — the single TypeScript file that powers the entire site. Updates the app's `screens` array, `screenCount`, `thumbnail`, and `lastUpdated`.

**Stage 4 — Tag.** Reads `apps.ts` and adds semantic tags to screens that don't have them yet. Tags like "Modal/Dialog", "Form/Input", "Dashboard/Overview" are inferred from the label text and flow classification. These tags power the filtering UI.

**Cost: $0.00.** The entire pipeline runs locally with zero API calls.

---

## Stage 1: Crawl (`crawl-app.mjs`)

This is the biggest script. It uses Playwright (with a stealth plugin to avoid bot detection) to systematically visit and screenshot a crypto app.

### What it does, step by step

The crawler runs through 5 phases for each app:

| Phase | What happens |
|-------|-------------|
| **1. Landing page** | Loads the homepage. Dismisses cookie/consent banners. Takes the first screenshot. Scrolls down and captures scroll states. |
| **2. Link discovery** | Extracts every same-domain link from the page (nav links first, then body links). |
| **3. Visit pages** | Visits each discovered link. On each page: dismisses overlays, takes a screenshot, scrolls, explores tabs. |
| **4. Interactive elements** | Goes back to the homepage. Clicks buttons like "Connect Wallet", "Log In", "Menu" to capture modals and dropdowns. |
| **5. Common paths** | Probes 30+ standard paths (`/swap`, `/stake`, `/settings`, `/login`, `/earn`, `/about`, etc.) to catch pages not linked from the homepage. |

### Deduplication

The crawler never takes the same screenshot twice. It uses two hashes:

- **State hash** — URL + page title + visible text. Catches the same page visited twice.
- **Content hash** — page title + visible text only (no URL). Catches identical pages at different URLs (e.g., multiple paths that all show a 404 page).

### Cookie banners and overlays

Before any screenshot is taken, the crawler tries to dismiss cookie consent banners and overlays. It looks for buttons matching common patterns:

- "Accept All", "Accept", "I Agree", "Got it", "OK", "Dismiss"
- Close buttons (`aria-label="Close"`)
- Known consent SDKs (`#onetrust-accept-btn-handler`, `.cookie-consent-accept`)

The overlay is clicked away, then the clean page is captured. No screenshot of the banner itself is saved.

### Metadata extraction

While on the landing page, the crawler also collects (at zero cost):

- **Page copy** — h1, meta description, OG tags, CTAs, nav items
- **Tech stack** — detects React, Next.js, Vue, Tailwind, analytics tools, wallet injections, etc.
- **Performance** — load time, DOM content loaded, LCP, CLS, resource counts and sizes

This metadata is saved in the raw manifest JSON.

### Three crawl modes

| Mode | Flag | How it works | Use for |
|------|------|-------------|---------|
| **Public** | _(none)_ | Fresh browser, no auth | Marketing sites, landing pages |
| **Login** | `--login` | Opens a real browser window. You log in manually. The session is saved to a persistent profile on disk. Future crawls reuse that profile automatically. | Exchanges, dashboards (Binance, Coinbase, Kraken) |
| **Wallet** | `--wallet` | Loads a MetaMask browser extension from a pre-configured profile. Auto-approves connection/signing popups. | DeFi apps (Uniswap, Aave, Lido) |

**Login mode in detail:**

1. First time: `--login` opens a headed browser. You log in manually, then press Enter.
2. The browser profile (cookies, IndexedDB, service workers) is saved to `scripts/profiles/{slug}/`.
3. Next time: `--login` detects the existing profile and crawls headlessly — no manual login needed.
4. If the session expired: the crawler detects it (checks for login redirects, password fields), tries auto-relogin if credentials are stored, and falls back to opening a headed browser for manual re-login.
5. To force a fresh login: use `--relogin`.

**Wallet mode in detail:**

1. First, run `node scripts/wallet-setup.mjs` to download MetaMask and create a profile with a test wallet.
2. Then crawl with `--wallet`. The browser loads with MetaMask installed.
3. The crawler clicks "Connect Wallet" on the DApp and auto-approves MetaMask popups (Next, Connect, Sign, Confirm).

### Limits

| Setting | Default (public) | Default (authenticated) |
|---------|-----------------|------------------------|
| Max pages visited | 50 | 100 |
| Max screenshots | 80 | 80 |

Override with `--max-pages` and `--max-screenshots`.

### Output

For each app, the crawler produces:

```
public/screenshots/{slug}-raw-001.png    # numbered screenshots
public/screenshots/{slug}-raw-002.png
public/screenshots/{slug}-raw-003.png
...
public/screenshots/{slug}-raw.json       # manifest with URLs, actions, context, metadata
```

### Commands

```bash
# Crawl a single public app
node scripts/crawl-app.mjs --slug metamask

# Crawl with a specific URL (overrides apps.ts)
node scripts/crawl-app.mjs --slug metamask --url https://metamask.io

# Crawl all public apps
node scripts/crawl-app.mjs --all

# Login app (first time — manual login)
node scripts/crawl-app.mjs --login --slug binance

# Login app (subsequent — uses saved profile)
node scripts/crawl-app.mjs --login --slug binance

# Force re-login
node scripts/crawl-app.mjs --relogin --slug binance

# DeFi app with MetaMask
node scripts/crawl-app.mjs --wallet --slug uniswap

# Show browser window (useful for debugging)
node scripts/crawl-app.mjs --slug metamask --headed

# Mobile viewport
node scripts/crawl-app.mjs --slug metamask --mobile

# Check if a login session is still valid
node scripts/crawl-app.mjs --check-auth --slug binance
```

---

## Stage 2: Label (`label-local.mjs`)

Takes the raw numbered screenshots and gives them meaningful names and flow classifications.

### How classification works

Each screenshot has a URL and context string from the crawler. The labeler matches these against regex patterns to assign a flow:

| Flow | URL patterns matched |
|------|---------------------|
| **Home** | Anything that doesn't match another flow |
| **Onboarding** | `/signup`, `/login`, `/register`, `/connect`, `/auth` |
| **Swap** | `/swap`, `/trade`, `/exchange`, `/convert`, `/markets`, `/futures` |
| **Send** | `/send`, `/transfer`, `/bridge`, `/withdraw`, `/deposit` |
| **Staking** | `/stake`, `/earn`, `/lend`, `/borrow`, `/pool`, `/yield`, `/vault`, `/governance` |
| **Settings** | `/settings`, `/help`, `/faq`, `/about`, `/terms`, `/privacy`, `/blog`, `/docs` |

If the URL doesn't match, the context text is checked against similar keyword patterns.

### File renaming

Files are renamed from raw numbered format to a descriptive format:

```
metamask-raw-001.png  -->  metamask-home-1-landing-page.png
metamask-raw-002.png  -->  metamask-home-2-pricing.png
metamask-raw-015.png  -->  metamask-swap-1-swap-page.png
metamask-raw-020.png  -->  metamask-settings-1-faqs.png
```

Pattern: `{slug}-{flow}-{step}-{description}.png`

### Output

```
public/screenshots/{slug}-{flow}-{step}-{description}.png   # renamed files
public/screenshots/{slug}-manifest.json                      # labeled manifest
```

### Commands

```bash
# Label a single app
node scripts/label-local.mjs --slug metamask

# Label all apps that have raw manifests
node scripts/label-local.mjs
```

---

## Stage 3: Sync (`sync-manifests.mjs`)

Reads the labeled manifests and writes the data into `src/data/apps.ts`.

### What it updates

For each app that has a manifest, it updates these fields in `apps.ts`:

| Field | Value |
|-------|-------|
| `screens` | Array of `{ step, label, flow, image }` from the manifest |
| `screenCount` | Total number of screens |
| `thumbnail` | First screenshot image path |
| `lastUpdated` | Today's date |
| `detailed` | Set to `true` (enables the detail page on the site) |

### Commands

```bash
# Sync all manifests into apps.ts
node scripts/sync-manifests.mjs

# Sync a single app
node scripts/sync-manifests.mjs --slug metamask

# Preview without writing
node scripts/sync-manifests.mjs --dry-run
```

---

## Stage 4: Tag (`auto-tag.mjs`)

Adds semantic UI tags to screens based on their labels. Non-destructive — only tags screens that don't already have tags.

### Tag examples

| Label contains | Tag assigned |
|---------------|-------------|
| modal, popup, dialog, overlay | Modal / Dialog |
| form, input, field, email | Form / Input |
| dashboard, overview, summary | Dashboard / Overview |
| chart, graph, analytics | Chart / Graph |
| table, list, rows | Data Table |
| search, filter | Search |
| error, 404 | Error Page |
| loading, skeleton | Loading State |

### Commands

```bash
# Tag all apps
node scripts/auto-tag.mjs

# Tag a single app
node scripts/auto-tag.mjs --slug metamask
```

---

## Full Pipeline: Adding a New App

Here's the complete workflow to add a new app to Darkscreen:

### 1. Add the app entry to `apps.ts`

Add a new object to the `apps` array in `src/data/apps.ts` with at minimum: `slug`, `name`, `category`, `website`, `description`, `flows`, and `accentColor`.

### 2. Fetch its logo

```bash
node scripts/fetch-logos.mjs --slug newapp
```

### 3. Run the pipeline

```bash
# Crawl
node scripts/crawl-app.mjs --slug newapp

# Label
node scripts/label-local.mjs --slug newapp

# Sync into apps.ts
node scripts/sync-manifests.mjs --slug newapp

# Add tags
node scripts/auto-tag.mjs --slug newapp
```

### 4. Verify

```bash
npm run dev
# Visit http://localhost:3000/library/newapp
```

---

## Full Pipeline: Re-crawling Everything

To refresh all screenshots:

```bash
# Crawl all public apps
node scripts/crawl-app.mjs --all

# Label everything
node scripts/label-local.mjs

# Sync into apps.ts
node scripts/sync-manifests.mjs

# Tag new screens
node scripts/auto-tag.mjs
```

Login and wallet apps need to be crawled individually with their respective flags.

---

## Automated Weekly Pipeline (CI)

The entire pipeline runs automatically every Monday via GitHub Actions. No manual intervention needed for public apps.

**Workflow file:** `.github/workflows/weekly-crawl.yml`

**Schedule:** Every Monday at 6 AM UTC (`0 6 * * 1`). Can also be triggered manually with `gh workflow run weekly-crawl.yml`.

### How it works

```
Download from R2 → Archive → Recrawl stale → Diff → Generate changes → Upload to R2 → Commit → Build → Deploy
```

| Step | Script | What happens |
|------|--------|-------------|
| 1. Download | `download-r2-screenshots.sh` | Pulls current screenshots from R2 via Cloudflare REST API so they can be archived and diffed |
| 2. Archive | `archive-screens.mjs --all` | Copies screenshots + manifests to `public/screenshots/archive/{slug}/{date}/` |
| 3. Recrawl | `recrawl-stale.mjs --days 7` | Re-crawls public apps not updated in 7+ days. Runs the full local pipeline (crawl → label → tag → sync) per app. Skips login apps. |
| 4. Diff | `diff-screens.mjs --all` | Pixel-level comparison (via `pixelmatch`) of new vs archived screenshots. Writes `{slug}-diff.json` |
| 5. Changes | `generate-changes.mjs --all` | Reads diff JSON, generates `src/data/auto-changes.ts` with change type and description |
| 6. Upload | `upload-screenshots.sh --all` | Uploads new/changed screenshots to R2 bucket `darkscreen-screenshots` |
| 7. Commit | git | Commits `apps.ts` and `auto-changes.ts` if changed |
| 8. Deploy | wrangler | Builds Next.js static export and deploys to Cloudflare Pages |

### Required GitHub Secrets

These must be set at **Settings > Secrets and variables > Actions** in the GitHub repo:

| Secret | Where to find it |
|--------|-----------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar |
| `CLOUDFLARE_API_TOKEN` | Cloudflare > Profile > API Tokens. Needs: **Cloudflare Pages (Edit)** + **Workers R2 Storage (Edit)** |

### What it skips

- **Login apps** (exchanges, dashboards) — `recrawl-stale.mjs` auto-skips `authType: "login"`. These must be recrawled manually with `--login`.
- **Wallet apps** — attempted with `--wallet` flag but MetaMask isn't available in CI (no extension). These may fail and get logged.
- **Apps updated within the last 7 days** — not stale, not recrawled.

### Troubleshooting CI

**Workflow never runs on schedule:** GitHub disables cron workflows on repos with no activity for 60 days. Push a commit or trigger manually to re-enable.

**R2 download fails:** Check that `CLOUDFLARE_API_TOKEN` has **Workers R2 Storage (Edit)** permission. The script uses the Cloudflare REST API (`/accounts/{id}/r2/buckets/{name}/objects`), not wrangler, for listing objects.

**Deploy fails:** Check that `CLOUDFLARE_API_TOKEN` has **Cloudflare Pages (Edit)** permission.

**Recrawl fails for specific apps:** Non-fatal. The workflow continues. Check the run logs for which apps failed and why (usually the site changed its DOM structure or added new bot detection).

---

## Where Files Live

| Path | Contents |
|------|----------|
| `public/screenshots/*.png` | All screenshot images |
| `public/screenshots/{slug}-raw.json` | Raw crawl manifest (URLs, metadata) |
| `public/screenshots/{slug}-manifest.json` | Labeled manifest (flows, labels) |
| `src/data/apps.ts` | All app data consumed by the site |
| `scripts/profiles/{slug}/` | Saved browser profiles for login apps |
| `scripts/wallets/` | MetaMask extension + profile for wallet apps |
| `scripts/credentials/` | Encrypted login credentials (optional) |
| `scripts/sessions/` | Legacy session files (deprecated, use profiles) |

---

## Environment Variables

All optional. The pipeline works with zero configuration for public apps.

| Variable | Purpose |
|----------|---------|
| `CAPSOLVER_API_KEY` | Auto-solve CAPTCHAs during login crawls |
| `DARKSCREEN_PROXY` | Proxy server for crawls (e.g., US exit node) |
| `DARKSCREEN_CRED_KEY` | Encryption key for stored credentials |

---

## Troubleshooting

**Crawl hangs on a page:** The `networkidle` wait can stall on pages with persistent connections (WebSockets, polling). The 10-second timeout will eventually kick in and move on.

**Screenshots look wrong / show cookie banners:** Re-crawl the app. The crawler dismisses overlays before capturing. If a site has an unusual cookie banner, add its button selector to the `OVERLAY_SELECTORS` array in `crawl-app.mjs`.

**Login session expired:** Run `--login` again (it will detect the expired session and prompt for manual re-login), or use `--relogin` to force a fresh login.

**MetaMask not connecting:** Run `node scripts/wallet-setup.mjs` to reset the MetaMask profile. Make sure the extension directory exists at `scripts/wallets/metamask-extension/`.

**Labeling puts screens in the wrong flow:** The classification is based on URL patterns. If an app uses unusual URLs (e.g., `/app/earn` instead of `/earn`), the patterns in `label-local.mjs` may need updating.
