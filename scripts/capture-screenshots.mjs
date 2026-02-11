import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const screenshotDir = resolve("public/screenshots");
mkdirSync(screenshotDir, { recursive: true });

const apps = [
  { slug: "metamask", url: "https://metamask.io" },
  { slug: "phantom", url: "https://phantom.app" },
  { slug: "uniswap", url: "https://app.uniswap.org" },
  { slug: "coinbase", url: "https://www.coinbase.com/explore" },
  { slug: "aave", url: "https://app.aave.com" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const app of apps) {
    const outPath = resolve(screenshotDir, `${app.slug}-home.png`);
    if (existsSync(outPath)) {
      console.log(`Skipping ${app.slug} (already captured)`);
      continue;
    }

    const page = await context.newPage();
    try {
      console.log(`Capturing ${app.slug} from ${app.url}...`);
      await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(5000);

      // Dismiss cookie/consent banners
      try {
        const selectors = [
          'button:has-text("Accept")',
          'button:has-text("Got it")',
          'button:has-text("Close")',
          '[aria-label="Close"]',
          'button:has-text("OK")',
          '#onetrust-accept-btn-handler',
        ];
        for (const sel of selectors) {
          const btns = await page.$$(sel);
          for (const btn of btns) {
            await btn.click().catch(() => {});
          }
        }
        await page.waitForTimeout(1000);
      } catch {}

      await page.screenshot({ path: outPath, type: "png" });
      console.log(`  OK: ${app.slug}-home.png`);
    } catch (err) {
      console.error(`  FAIL ${app.slug}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
