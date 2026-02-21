#!/usr/bin/env node

/**
 * Send Weekly Digest Email
 *
 * Reads change data from diff JSON files and/or auto-changes.ts,
 * builds a dark-themed HTML email, and sends it via Brevo transactional API
 * to all contacts in the Darkscreens waitlist (list ID 2).
 *
 * Usage:
 *   BREVO_API_KEY=xkeysib-... node scripts/send-weekly-digest.mjs
 *   BREVO_API_KEY=xkeysib-... node scripts/send-weekly-digest.mjs --dry-run
 *   BREVO_API_KEY=xkeysib-... node scripts/send-weekly-digest.mjs --test you@example.com
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

// ─── Paths ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const APPS_FILE = resolve(PROJECT_ROOT, "src/data/apps.ts");
const AUTO_CHANGES_FILE = resolve(PROJECT_ROOT, "src/data/auto-changes.ts");

// ─── Config ──────────────────────────────────────────────────────────

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = 2;
const BREVO_BATCH_SIZE = 50;
const CDN_BASE = "https://darkscreen-r2-proxy.fernandonikolic.workers.dev";
const SITE_URL = "https://darkscreens.xyz";

// ─── CLI ─────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    test: { type: "string" },
  },
  strict: false,
});

const isDryRun = args["dry-run"];
const testEmail = args.test;

if (!isDryRun && !BREVO_API_KEY) {
  console.error("Error: BREVO_API_KEY environment variable is required.");
  process.exit(1);
}

// ─── Load app metadata ──────────────────────────────────────────────

function loadAppMeta() {
  const src = readFileSync(APPS_FILE, "utf-8");
  const meta = {};
  const re = /slug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    meta[m[1]] = { name: m[2], category: m[3] };
  }
  return meta;
}

// ─── Load changes from diff JSON files ──────────────────────────────

function loadChangesFromDiffs() {
  const changes = [];

  if (!existsSync(SCREENSHOT_DIR)) return changes;

  const diffFiles = readdirSync(SCREENSHOT_DIR).filter((f) =>
    f.endsWith("-diff.json")
  );

  for (const file of diffFiles) {
    try {
      const diff = JSON.parse(
        readFileSync(resolve(SCREENSHOT_DIR, file), "utf-8")
      );
      const slug = diff.slug;

      for (const screen of diff.screens) {
        if (screen.status === "unchanged" || screen.status === "error")
          continue;

        changes.push({
          slug,
          date: diff.diffDate ? diff.diffDate.split("T")[0] : "",
          type: inferChangeType(screen),
          description: generateDescription(screen),
          diffPercent: screen.diffPercent || 0,
          flow: screen.flow || "",
          step: screen.step || 0,
          screenLabel: screen.label || "",
          beforeImage: screen.previousImage || "",
          afterImage: screen.currentImage || "",
        });
      }
    } catch (err) {
      console.warn(`Warning: could not parse ${file}: ${err.message}`);
    }
  }

  return changes;
}

// ─── Load changes from auto-changes.ts ──────────────────────────────

function loadChangesFromAutoChanges() {
  const changes = [];

  if (!existsSync(AUTO_CHANGES_FILE)) return changes;

  try {
    const content = readFileSync(AUTO_CHANGES_FILE, "utf-8");
    // Match the exported object
    const match = content.match(/=\s*({[\s\S]*});?\s*$/);
    if (!match) return changes;

    // Clean up TS-isms for JSON parsing
    const cleaned = match[1]
      .replace(/\/\/.*/g, "")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    const data = JSON.parse(cleaned);

    for (const [slug, slugChanges] of Object.entries(data)) {
      for (const change of slugChanges) {
        changes.push({
          slug,
          date: change.date || "",
          type: change.type || "Layout Shift",
          description: change.description || "",
          diffPercent: change.diffPercent || 0,
          flow: change.flow || "",
          step: change.step || 0,
          screenLabel: change.screenLabel || "",
          beforeImage: change.beforeImage || "",
          afterImage: change.afterImage || "",
        });
      }
    }
  } catch (err) {
    console.warn(
      `Warning: could not parse auto-changes.ts: ${err.message}`
    );
  }

  return changes;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function inferChangeType(screen) {
  if (screen.status === "added") return "New Feature";
  if (screen.status === "removed") return "Removed";
  if (screen.diffPercent > 50) return "Redesign";
  if (screen.diffPercent > 5) return "Layout Shift";
  return "Copy Change";
}

function generateDescription(screen) {
  const label = screen.label || `${screen.flow}/${screen.step}`;
  if (screen.status === "added") return `New screen detected: ${label}`;
  if (screen.status === "removed") return `Screen removed: ${label}`;
  return `${label} changed by ${screen.diffPercent}%`;
}

function diffBadgeColor(pct) {
  if (pct > 50) return "#ef4444"; // red
  if (pct > 20) return "#f59e0b"; // amber
  if (pct > 5) return "#3b82f6"; // blue
  return "#6b7280"; // gray
}

function changeTypeColor(type) {
  switch (type) {
    case "Redesign":
      return "#ef4444";
    case "New Feature":
      return "#22c55e";
    case "Copy Change":
      return "#3b82f6";
    case "Layout Shift":
      return "#f59e0b";
    case "Removed":
      return "#a855f7";
    default:
      return "#71717A";
  }
}

function imageUrl(path) {
  if (!path) return "";
  // Strip leading slash or "archive/" prefix, use CDN
  const clean = path.replace(/^\//, "");
  return `${CDN_BASE}/${clean}`;
}

function weekLabel() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} - ${fmt(now)}, ${now.getFullYear()}`;
}

// ─── Build HTML email ────────────────────────────────────────────────

function buildEmail(changes, appMeta) {
  const uniqueSlugs = new Set(changes.map((c) => c.slug));
  const totalChanges = changes.length;
  const totalProducts = uniqueSlugs.size;

  // Group changes by type
  const grouped = {};
  for (const change of changes) {
    if (!grouped[change.type]) grouped[change.type] = [];
    grouped[change.type].push(change);
  }

  const typeOrder = [
    "Redesign",
    "New Feature",
    "Copy Change",
    "Layout Shift",
    "Removed",
  ];

  // No changes case
  if (totalChanges === 0) {
    return buildNoChangesEmail();
  }

  // Build change sections
  let changeSectionsHtml = "";

  for (const type of typeOrder) {
    const items = grouped[type];
    if (!items || items.length === 0) continue;

    const typeColor = changeTypeColor(type);

    let itemsHtml = "";
    for (const change of items) {
      const appName =
        appMeta[change.slug]?.name || change.slug;
      const badgeColor = diffBadgeColor(change.diffPercent);
      const flowInfo =
        change.flow && change.step
          ? `${change.flow} / Step ${change.step}`
          : change.flow || "";

      // Before/after thumbnails
      let thumbnailHtml = "";
      if (change.beforeImage || change.afterImage) {
        const beforeSrc = change.beforeImage
          ? imageUrl(change.beforeImage)
          : "";
        const afterSrc = change.afterImage
          ? imageUrl(change.afterImage)
          : "";

        thumbnailHtml = `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 12px;">
            <tr>
              ${
                beforeSrc
                  ? `<td width="48%" style="vertical-align: top;">
                  <div style="font-size: 10px; color: #71717A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Before</div>
                  <img src="${beforeSrc}" alt="Before" width="100%" style="border-radius: 6px; border: 1px solid #27272A; display: block;" />
                </td>`
                  : ""
              }
              ${beforeSrc && afterSrc ? `<td width="4%"></td>` : ""}
              ${
                afterSrc
                  ? `<td width="48%" style="vertical-align: top;">
                  <div style="font-size: 10px; color: #71717A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">After</div>
                  <img src="${afterSrc}" alt="After" width="100%" style="border-radius: 6px; border: 1px solid #27272A; display: block;" />
                </td>`
                  : ""
              }
            </tr>
          </table>`;
      }

      itemsHtml += `
        <div style="background: #151518; border: 1px solid #27272A; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <span style="color: #F4F4F5; font-size: 15px; font-weight: 600;">${appName}</span>
                ${
                  flowInfo
                    ? `<span style="color: #71717A; font-size: 13px; margin-left: 8px;">${flowInfo}</span>`
                    : ""
                }
              </td>
              <td style="text-align: right; vertical-align: middle;">
                ${
                  change.diffPercent > 0
                    ? `<span style="background: ${badgeColor}; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;">${change.diffPercent.toFixed(1)}%</span>`
                    : ""
                }
              </td>
            </tr>
          </table>
          <div style="color: #A1A1AA; font-size: 13px; margin-top: 6px; line-height: 1.5;">${change.description}</div>
          ${thumbnailHtml}
        </div>`;
    }

    changeSectionsHtml += `
      <div style="margin-bottom: 28px;">
        <div style="display: flex; align-items: center; margin-bottom: 14px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${typeColor}; margin-right: 8px;"></span>
          <span style="color: #F4F4F5; font-size: 16px; font-weight: 600;">${type}</span>
          <span style="color: #71717A; font-size: 13px; margin-left: 8px;">(${items.length})</span>
        </div>
        ${itemsHtml}
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Darkscreens Weekly Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0C0C0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0E;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #F4F4F5; letter-spacing: -0.02em;">Darkscreens</div>
              <div style="font-size: 13px; color: #71717A; margin-top: 4px;">Weekly Crypto Product Intelligence</div>
              <div style="font-size: 12px; color: #52525B; margin-top: 2px;">${weekLabel()}</div>
            </td>
          </tr>

          <!-- Stats bar -->
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="background: #151518; border: 1px solid #27272A; border-radius: 10px; padding: 16px 20px; text-align: center;">
                <span style="color: #F4F4F5; font-size: 20px; font-weight: 700;">${totalChanges}</span>
                <span style="color: #A1A1AA; font-size: 14px;"> changes across </span>
                <span style="color: #F4F4F5; font-size: 20px; font-weight: 700;">${totalProducts}</span>
                <span style="color: #A1A1AA; font-size: 14px;"> products this week</span>
              </div>
            </td>
          </tr>

          <!-- Change sections -->
          <tr>
            <td>
              ${changeSectionsHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 20px 0 36px; text-align: center;">
              <a href="${SITE_URL}/changes" style="display: inline-block; background: #F4F4F5; color: #0C0C0E; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">View full change feed</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="height: 1px; background: #27272A;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <div style="color: #52525B; font-size: 12px; line-height: 1.6;">
                You're receiving this because you signed up for Darkscreens updates.<br />
                <a href="{{ unsubscribe }}" style="color: #71717A; text-decoration: underline;">Unsubscribe</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildNoChangesEmail() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Darkscreens Weekly Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0C0C0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0E;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #F4F4F5; letter-spacing: -0.02em;">Darkscreens</div>
              <div style="font-size: 13px; color: #71717A; margin-top: 4px;">Weekly Crypto Product Intelligence</div>
              <div style="font-size: 12px; color: #52525B; margin-top: 2px;">${weekLabel()}</div>
            </td>
          </tr>

          <!-- No changes message -->
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="background: #151518; border: 1px solid #27272A; border-radius: 10px; padding: 32px 20px; text-align: center;">
                <div style="color: #F4F4F5; font-size: 18px; font-weight: 600; margin-bottom: 8px;">All quiet this week</div>
                <div style="color: #A1A1AA; font-size: 14px; line-height: 1.5;">No significant UI changes were detected across the products we track. We'll keep watching and let you know when something moves.</div>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 20px 0 36px; text-align: center;">
              <a href="${SITE_URL}/library" style="display: inline-block; background: #F4F4F5; color: #0C0C0E; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">Browse the library</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="height: 1px; background: #27272A;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <div style="color: #52525B; font-size: 12px; line-height: 1.6;">
                You're receiving this because you signed up for Darkscreens updates.<br />
                <a href="{{ unsubscribe }}" style="color: #71717A; text-decoration: underline;">Unsubscribe</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Brevo API helpers ───────────────────────────────────────────────

async function brevoFetch(path, options = {}) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API error ${res.status} on ${path}: ${text}`);
  }

  return res.json();
}

async function getRecipients() {
  const contacts = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const data = await brevoFetch(
      `/contacts/lists/${BREVO_LIST_ID}/contacts?limit=${limit}&offset=${offset}`
    );

    if (data.contacts && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        if (contact.email) {
          contacts.push({ email: contact.email });
        }
      }
    }

    // Check if there are more pages
    if (
      !data.contacts ||
      data.contacts.length < limit ||
      contacts.length >= (data.count || 0)
    ) {
      break;
    }
    offset += limit;
  }

  return contacts;
}

async function sendEmail(recipients, subject, htmlContent) {
  // Send in batches of BREVO_BATCH_SIZE
  const batches = [];
  for (let i = 0; i < recipients.length; i += BREVO_BATCH_SIZE) {
    batches.push(recipients.slice(i, i + BREVO_BATCH_SIZE));
  }

  console.log(
    `Sending to ${recipients.length} recipients in ${batches.length} batch(es)...`
  );

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `  Batch ${i + 1}/${batches.length}: ${batch.length} recipients`
    );

    await brevoFetch("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: "Darkscreens", email: "digest@darkscreens.xyz" },
        to: batch,
        subject,
        htmlContent,
      }),
    });
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Loading app metadata...");
  const appMeta = loadAppMeta();
  console.log(`  ${Object.keys(appMeta).length} apps loaded`);

  // Try diff JSON files first, fall back to auto-changes.ts
  console.log("Loading change data from diff JSON files...");
  let changes = loadChangesFromDiffs();

  if (changes.length === 0) {
    console.log("  No diff JSON changes found. Trying auto-changes.ts...");
    changes = loadChangesFromAutoChanges();
  }

  console.log(`  ${changes.length} total changes found`);

  // Build email
  const subject =
    changes.length > 0
      ? `Darkscreens Weekly: ${changes.length} change${changes.length === 1 ? "" : "s"} detected`
      : "Darkscreens Weekly: All quiet this week";

  console.log("Building email HTML...");
  const html = buildEmail(changes, appMeta);

  // Dry run — output HTML and exit
  if (isDryRun) {
    console.log("\n--- DRY RUN: HTML output below ---\n");
    process.stdout.write(html);
    console.log("\n\n--- End of HTML ---");
    return;
  }

  // Test mode — send to single email
  if (testEmail) {
    console.log(`Sending test email to ${testEmail}...`);
    await sendEmail([{ email: testEmail }], subject, html);
    console.log("Done. Test email sent.");
    return;
  }

  // Production — fetch recipients from Brevo and send
  console.log("Fetching recipients from Brevo...");
  const recipients = await getRecipients();
  console.log(`  ${recipients.length} recipients found`);

  if (recipients.length === 0) {
    console.log("No recipients found. Skipping send.");
    return;
  }

  await sendEmail(recipients, subject, html);
  console.log("Done. Weekly digest sent.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
