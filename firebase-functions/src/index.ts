import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { Webhook } from "standardwebhooks";

admin.initializeApp();
const db = admin.firestore();

/**
 * Stripe webhook handler.
 *
 * Listens for checkout.session.completed events and updates the
 * user's Firestore document with their subscription plan.
 *
 * Setup:
 *   1. Set env vars in functions/.env:
 *      STRIPE_SECRET_KEY=sk_...
 *      STRIPE_WEBHOOK_SECRET=whsec_...
 *
 *   2. Webhook URL:
 *      https://us-central1-clawdentials.cloudfunctions.net/stripeWebhook
 *
 *   3. Events: checkout.session.completed, customer.subscription.deleted
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Verify signature
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    res.status(400).send("Invalid signature");
    return;
  }

  // Handle events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total || 0;

    // Determine plan from amount (400 = education $4, 900 = pro $9, 1200 = team $12)
    let plan: "pro" | "team" | "education";
    if (amountTotal >= 1200) {
      plan = "team";
    } else if (amountTotal <= 400) {
      plan = "education";
    } else {
      plan = "pro";
    }

    if (!email) {
      console.error("No email in checkout session:", session.id);
      res.status(200).json({ received: true });
      return;
    }

    // Try to find existing user by email
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (!snapshot.empty) {
      // User exists — update their plan
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({
        plan,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer as string,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Updated plan for ${email} to ${plan}`);
    } else {
      // User hasn't signed in yet — create pending subscription
      await db.collection("pendingSubscriptions").add({
        email,
        plan,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer as string,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created pending subscription for ${email} (${plan})`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    // Find user by stripeCustomerId and downgrade
    const snapshot = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ plan: "free" });
      console.log(`Downgraded customer ${customerId} to free`);
    }
  }

  res.status(200).json({ received: true });
});

/* ─── moneydevkit (Bitcoin / Lightning) ─── */

const MDK_PRODUCT_IDS: Record<string, string> = {
  pro: process.env.MDK_PRODUCT_PRO || "",
  team: process.env.MDK_PRODUCT_TEAM || "",
  education: process.env.MDK_PRODUCT_EDUCATION || "",
};

/**
 * moneydevkit webhook handler.
 *
 * Verifies signature with standardwebhooks, then handles:
 *   - checkout.completed → update or create pending subscription
 *   - subscription.created → mark active
 *   - subscription.renewed → update subscribedAt
 *   - subscription.canceled → downgrade to free
 */
export const mdkWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const webhookSecret = process.env.MDK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing MDK_WEBHOOK_SECRET");
    res.status(500).send("Server configuration error");
    return;
  }

  // Verify webhook signature using standardwebhooks
  const msgId = req.headers["webhook-id"] as string;
  const msgTimestamp = req.headers["webhook-timestamp"] as string;
  const msgSignature = req.headers["webhook-signature"] as string;

  if (!msgId || !msgTimestamp || !msgSignature) {
    res.status(400).send("Missing webhook signature headers");
    return;
  }

  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(req.rawBody.toString(), {
      "webhook-id": msgId,
      "webhook-timestamp": msgTimestamp,
      "webhook-signature": msgSignature,
    });
  } catch (err) {
    console.error("MDK webhook signature verification failed:", err);
    res.status(400).send("Invalid signature");
    return;
  }

  const event = req.body as { type: string; data: Record<string, unknown> };
  const eventType = event.type;
  const data = event.data;

  // Determine plan from product ID
  const productId = data.product_id as string | undefined;
  let plan: "pro" | "team" | "education" = "pro";
  if (productId) {
    const entry = Object.entries(MDK_PRODUCT_IDS).find(([, id]) => id === productId);
    if (entry) plan = entry[0] as "pro" | "team" | "education";
  }

  if (eventType === "checkout.completed") {
    const email = data.customer_email as string | undefined;
    if (!email) {
      console.error("No email in MDK checkout event");
      res.status(200).json({ received: true });
      return;
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        plan,
        paymentMethod: "bitcoin",
        mdkCustomerId: (data.customer_id as string) || null,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[MDK] Updated plan for ${email} to ${plan}`);
    } else {
      await db.collection("pendingSubscriptions").add({
        email,
        plan,
        paymentMethod: "bitcoin",
        mdkCustomerId: (data.customer_id as string) || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[MDK] Created pending subscription for ${email} (${plan})`);
    }
  }

  if (eventType === "subscription.created") {
    const email = data.customer_email as string | undefined;
    if (email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({ mdkSubscriptionStatus: "active" });
        console.log(`[MDK] Subscription active for ${email}`);
      }
    }
  }

  if (eventType === "subscription.renewed") {
    const email = data.customer_email as string | undefined;
    if (email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[MDK] Subscription renewed for ${email}`);
      }
    }
  }

  if (eventType === "subscription.canceled") {
    const email = data.customer_email as string | undefined;
    if (email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          plan: "free",
          mdkSubscriptionStatus: "canceled",
        });
        console.log(`[MDK] Subscription canceled for ${email}`);
      }
    }
  }

  res.status(200).json({ received: true });
});
