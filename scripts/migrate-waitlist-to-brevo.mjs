#!/usr/bin/env node

/**
 * Migrate Waitlist to Brevo
 *
 * Reads all emails from the Firestore `waitlist` collection and
 * batch-imports them into a Brevo contact list.
 *
 * Usage:
 *   BREVO_API_KEY=xkeysib-... node scripts/migrate-waitlist-to-brevo.mjs
 *
 * Requirements:
 *   - BREVO_API_KEY env var
 *   - GOOGLE_APPLICATION_CREDENTIALS env var (or gcloud default credentials)
 *   - firebase-admin installed
 */

import admin from "firebase-admin";

// ─── Config ──────────────────────────────────────────────────────────

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = 2;
const FIREBASE_PROJECT_ID = "clawdentials";

if (!BREVO_API_KEY) {
  console.error("Error: BREVO_API_KEY environment variable is required.");
  process.exit(1);
}

// ─── Firebase ────────────────────────────────────────────────────────

admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
const db = admin.firestore();

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading waitlist from Firestore...");

  const snapshot = await db.collection("waitlist").get();

  if (snapshot.empty) {
    console.log("No documents found in waitlist collection.");
    process.exit(0);
  }

  const emails = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.email) {
      emails.push(data.email);
    }
  }

  if (emails.length === 0) {
    console.log("No emails found in waitlist documents.");
    process.exit(0);
  }

  console.log(`Found ${emails.length} emails.`);
  console.log("Importing to Brevo...");

  const jsonBody = emails.map((email) => ({ email }));

  const res = await fetch("https://api.brevo.com/v3/contacts/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      listIds: [BREVO_LIST_ID],
      emailBlacklist: false,
      jsonBody,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Brevo API error ${res.status}: ${text}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log("Brevo import response:", JSON.stringify(result, null, 2));
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
