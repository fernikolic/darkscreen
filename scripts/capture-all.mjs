import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const screenshotDir = resolve("public/screenshots");
mkdirSync(screenshotDir, { recursive: true });

const apps = [
  { slug: "metamask", url: "https://metamask.io" },
  { slug: "phantom", url: "https://phantom.app" },
  { slug: "uniswap", url: "https://app.uniswap.org" },
  { slug: "coinbase", url: "https://www.coinbase.com/explore" },
  { slug: "aave", url: "https://app.aave.com" },
  { slug: "jupiter", url: "https://jup.ag" },
  { slug: "lido", url: "https://stake.lido.fi" },
  { slug: "binance", url: "https://www.binance.com/en/markets/overview" },
  { slug: "kraken", url: "https://www.kraken.com/prices" },
  { slug: "curve", url: "https://curve.fi" },
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--ignore-certificate-errors"],
  });

  for (const app of apps) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      ignoreHTTPSErrors: true,
    });
    try {
      console.log(`Capturing ${app.slug}...`);
      await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(5000);

      // Dismiss banners
      for (const sel of [
        'button:has-text("Accept")', 'button:has-text("Got it")',
        'button:has-text("Close")', '[aria-label="Close"]',
        '#onetrust-accept-btn-handler',
      ]) {
        for (const btn of await page.$$(sel)) {
          await btn.click().catch(() => {});
        }
      }
      await page.waitForTimeout(500);

      await page.screenshot({
        path: resolve(screenshotDir, `${app.slug}-home.png`),
        type: "png",
      });
      console.log(`  OK`);
    } catch (err) {
      console.error(`  FAIL: ${err.message.split('\n')[0]}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("Done — captured all apps");
}

main().catch(console.error);
