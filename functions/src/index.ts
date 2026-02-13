import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

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

    // Determine plan from amount (900 = pro $9, 1200 = team $12)
    const plan = amountTotal >= 1200 ? "team" : "pro";

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
