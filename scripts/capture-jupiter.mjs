import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--ignore-certificate-errors"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  try {
    console.log("Trying jup.ag...");
    await page.goto("https://jup.ag", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "public/screenshots/jupiter-home.png", type: "png" });
    console.log("Jupiter: OK");
  } catch (e) {
    console.log(`Jupiter failed: ${e.message}`);
    console.log("Trying 1inch as fallback...");
    const page2 = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      ignoreHTTPSErrors: true,
    });
    await page2.goto("https://app.1inch.io", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page2.waitForTimeout(5000);
    await page2.screenshot({ path: "public/screenshots/1inch-home.png", type: "png" });
    console.log("1inch: OK");
    await page2.close();
  }

  await browser.close();
}

main().catch(console.error);
