import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const screenshotDir = resolve("public/screenshots");
mkdirSync(screenshotDir, { recursive: true });

// Each app has multiple pages to capture.
// Format: { slug, pages: [{ suffix, url, scrollY?, waitFor? }] }
const apps = [
  {
    slug: "uniswap",
    pages: [
      { suffix: "swap", url: "https://app.uniswap.org/swap" },
      { suffix: "pool", url: "https://app.uniswap.org/pool" },
      { suffix: "tokens", url: "https://app.uniswap.org/explore/tokens" },
    ],
  },
  {
    slug: "aave",
    pages: [
      { suffix: "markets", url: "https://app.aave.com/" },
      { suffix: "supply", url: "https://app.aave.com/", scrollY: 600 },
      { suffix: "governance", url: "https://app.aave.com/governance" },
    ],
  },
  {
    slug: "jupiter",
    pages: [
      { suffix: "swap", url: "https://jup.ag/" },
      { suffix: "limit", url: "https://jup.ag/limit/SOL-USDC" },
      { suffix: "perps", url: "https://jup.ag/perps" },
    ],
  },
  {
    slug: "lido",
    pages: [
      { suffix: "stake", url: "https://stake.lido.fi/" },
      { suffix: "wrap", url: "https://stake.lido.fi/wrap" },
      { suffix: "withdrawals", url: "https://stake.lido.fi/withdrawals" },
    ],
  },
  {
    slug: "curve",
    pages: [
      { suffix: "swap", url: "https://curve.fi/#/ethereum/swap" },
      { suffix: "pools", url: "https://curve.fi/#/ethereum/pools" },
      { suffix: "lending", url: "https://curve.fi/#/ethereum/lending" },
    ],
  },
  {
    slug: "binance",
    pages: [
      { suffix: "trade", url: "https://www.binance.com/en/trade/BTC_USDT" },
      { suffix: "earn", url: "https://www.binance.com/en/earn" },
      { suffix: "markets", url: "https://www.binance.com/en/markets/overview" },
    ],
  },
  {
    slug: "kraken",
    pages: [
      { suffix: "prices", url: "https://www.kraken.com/prices" },
      { suffix: "trade", url: "https://pro.kraken.com/" },
      { suffix: "staking", url: "https://www.kraken.com/features/staking-coins" },
    ],
  },
  {
    slug: "metamask",
    pages: [
      { suffix: "features", url: "https://metamask.io/swaps/" },
      { suffix: "portfolio", url: "https://portfolio.metamask.io/" },
      { suffix: "settings", url: "https://metamask.io/institutions/" },
    ],
  },
  {
    slug: "phantom",
    pages: [
      { suffix: "features", url: "https://phantom.app/tokens" },
      { suffix: "swap", url: "https://phantom.app/swaps" },
      { suffix: "staking", url: "https://phantom.app/staking" },
    ],
  },
  {
    slug: "coinbase",
    pages: [
      { suffix: "explore", url: "https://www.coinbase.com/explore" },
      { suffix: "prices", url: "https://www.coinbase.com/price" },
      { suffix: "earn", url: "https://www.coinbase.com/earn" },
    ],
  },
];

const DISMISS_SELECTORS = [
  'button:has-text("Accept")',
  'button:has-text("Accept All")',
  'button:has-text("Got it")',
  'button:has-text("Close")',
  'button:has-text("I agree")',
  'button:has-text("OK")',
  '[aria-label="Close"]',
  '#onetrust-accept-btn-handler',
  '[data-testid="close-btn"]',
  '.cookie-banner button',
];

async function dismissDialogs(page) {
  for (const sel of DISMISS_SELECTORS) {
    try {
      const btns = await page.$$(sel);
      for (const btn of btns) {
        await btn.click().catch(() => {});
      }
    } catch {}
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    // Some sites block headless browsers without a proper user agent
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  let captured = 0;
  let failed = 0;

  for (const app of apps) {
    for (const pg of app.pages) {
      const filename = `${app.slug}-${pg.suffix}.png`;
      const outPath = resolve(screenshotDir, filename);
      const page = await context.newPage();

      try {
        console.log(`  ${app.slug}/${pg.suffix} → ${pg.url}`);
        await page.goto(pg.url, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        await page.waitForTimeout(4000);

        await dismissDialogs(page);
        await page.waitForTimeout(1000);

        if (pg.scrollY) {
          await page.evaluate((y) => window.scrollTo(0, y), pg.scrollY);
          await page.waitForTimeout(1000);
        }

        await page.screenshot({ path: outPath, type: "png" });
        console.log(`    ✓ ${filename}`);
        captured++;
      } catch (err) {
        console.error(`    ✗ ${filename}: ${err.message}`);
        failed++;
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  console.log(`\nDone! Captured: ${captured}, Failed: ${failed}`);
}

main().catch(console.error);
