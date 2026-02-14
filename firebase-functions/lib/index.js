"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoOnrampWebhook = exports.createOnrampSession = exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
// --- BTC wallet address for receiving onramp payments ---
const DESTINATION_WALLET = {
    bitcoin: "bc1q6tl4d3sy0ywsk3gddchw42428jymmkamqjxu4w",
};
const PLAN_AMOUNTS = {
    pro: "9.00",
    team: "12.00",
};
// ============================================================
// Stripe Payment Link webhook (existing)
// ============================================================
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
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Verify signature
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err);
        res.status(400).send("Invalid signature");
        return;
    }
    // Handle events
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
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
                stripeCustomerId: session.customer,
                subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Updated plan for ${email} to ${plan}`);
        }
        else {
            // User hasn't signed in yet — create pending subscription
            await db.collection("pendingSubscriptions").add({
                email,
                plan,
                stripeSessionId: session.id,
                stripeCustomerId: session.customer,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Created pending subscription for ${email} (${plan})`);
        }
    }
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = subscription.customer;
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
// ============================================================
// Crypto Onramp — Create Session (callable)
// ============================================================
/**
 * Creates a Stripe crypto onramp session.
 *
 * Called from the frontend when user clicks "Pay with Bitcoin".
 * Returns a clientSecret to mount the embedded onramp widget.
 */
exports.createOnrampSession = functions.https.onCall(async (data) => {
    const { plan, email, userId } = data;
    if (!plan || !PLAN_AMOUNTS[plan]) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid plan. Must be 'pro' or 'team'.");
    }
    const amount = PLAN_AMOUNTS[plan];
    // Create onramp session via Stripe API (raw request — not yet in typed SDK)
    const body = new URLSearchParams();
    body.append("wallet_addresses[bitcoin]", DESTINATION_WALLET.bitcoin);
    body.append("destination_currencies[]", "btc");
    body.append("destination_networks[]", "bitcoin");
    body.append("source_amount", amount);
    body.append("source_currency", "usd");
    if (email) {
        body.append("customer_information[email]", email);
    }
    const response = await fetch("https://api.stripe.com/v1/crypto/onramp_sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });
    if (!response.ok) {
        const error = await response.text();
        console.error("Stripe onramp session creation failed:", error);
        throw new functions.https.HttpsError("internal", "Failed to create onramp session");
    }
    const session = (await response.json());
    // Store session metadata for webhook fulfillment
    await db.collection("onrampSessions").doc(session.id).set({
        plan,
        email: email || null,
        userId: userId || null,
        status: session.status,
        sourceAmount: amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created onramp session ${session.id} for plan=${plan}`);
    return { clientSecret: session.client_secret };
});
// ============================================================
// Crypto Onramp — Webhook
// ============================================================
/**
 * Handles crypto.onramp_session_updated events from Stripe.
 *
 * Setup:
 *   1. Set env var: STRIPE_CRYPTO_WEBHOOK_SECRET=whsec_...
 *   2. Webhook URL: https://us-central1-clawdentials.cloudfunctions.net/cryptoOnrampWebhook
 *   3. Subscribe to: crypto.onramp_session_updated
 */
exports.cryptoOnrampWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_CRYPTO_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        console.error("Crypto webhook signature verification failed:", err);
        res.status(400).send("Invalid signature");
        return;
    }
    if (event.type === "crypto.onramp_session_updated") {
        const session = event.data.object;
        console.log(`Onramp session ${session.id} updated to status=${session.status}`);
        // Update stored session status
        const sessionRef = db.collection("onrampSessions").doc(session.id);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            console.error(`No onramp session found for ${session.id}`);
            res.status(200).json({ received: true });
            return;
        }
        await sessionRef.update({
            status: session.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // On fulfillment, upgrade the user's plan
        if (session.status === "fulfillment_complete") {
            const meta = sessionDoc.data();
            const { plan, email, userId } = meta;
            // Try by userId first, then by email
            let userDoc = null;
            if (userId) {
                const ref = db.collection("users").doc(userId);
                const snap = await ref.get();
                if (snap.exists)
                    userDoc = snap;
            }
            if (!userDoc && email) {
                const snap = await db
                    .collection("users")
                    .where("email", "==", email)
                    .limit(1)
                    .get();
                if (!snap.empty)
                    userDoc = snap.docs[0];
            }
            if (userDoc) {
                await userDoc.ref.update({
                    plan,
                    cryptoOnrampSessionId: session.id,
                    subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`Upgraded user ${userDoc.id} to ${plan} via crypto onramp`);
            }
            else if (email) {
                // User hasn't signed up yet — create pending subscription
                await db.collection("pendingSubscriptions").add({
                    email,
                    plan,
                    cryptoOnrampSessionId: session.id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`Created pending crypto subscription for ${email} (${plan})`);
            }
            else {
                console.error(`Cannot find user for fulfilled onramp session ${session.id}`);
            }
        }
    }
    res.status(200).json({ received: true });
});
//# sourceMappingURL=index.js.map