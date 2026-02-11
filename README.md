# Darkscreen

Visual competitive intelligence for crypto products. Track what wallets, exchanges, and DeFi apps ship — before they announce it.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js 14 (App Router, static export)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deploy:** Cloudflare Pages

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── library/
│   │   ├── page.tsx          # Library browse with filters
│   │   └── [slug]/page.tsx   # App detail page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind + custom styles
├── components/
│   ├── Header.tsx            # Sticky nav
│   ├── Footer.tsx
│   ├── Hero.tsx              # Landing hero section
│   ├── ValueProps.tsx        # 3-column value props
│   ├── HowItWorks.tsx        # 3-step process
│   ├── Pricing.tsx           # 3-tier pricing cards
│   ├── LogoCloud.tsx         # Tracked apps cloud
│   ├── FilterBar.tsx         # Category + flow filters
│   ├── AppCard.tsx           # App card for library grid
│   ├── PlaceholderScreen.tsx # Gradient placeholder screenshots
│   ├── ScreenshotStrip.tsx   # Horizontal screenshot filmstrip
│   └── ChangeTimeline.tsx    # UI change history timeline
└── data/
    └── apps.ts               # All app data (types + 35 apps)
```

## Adding Apps

Edit `src/data/apps.ts`. Set `detailed: true` and populate `screenshots` and `changes` arrays for apps with full detail pages. Basic listings only need the top-level fields.

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Build command: `npm run build`
4. Output directory: `out`
5. Site will be live at `darkscreen.pages.dev`

To use a custom domain, add a CNAME record pointing to `darkscreen.pages.dev`.

## Local Build

```bash
npm run build    # Static export to out/
npm run start    # Serve the built site
```
