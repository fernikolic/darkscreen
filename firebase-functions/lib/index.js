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
exports.mdkWebhook = exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const standardwebhooks_1 = require("standardwebhooks");
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
        // Determine plan from amount (400 = education $4, 900 = pro $9, 1200 = team $12)
        let plan;
        if (amountTotal >= 1200) {
            plan = "team";
        }
        else if (amountTotal <= 400) {
            plan = "education";
        }
        else {
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
/* ─── moneydevkit (Bitcoin / Lightning) ─── */
const MDK_PRODUCT_IDS = {
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
exports.mdkWebhook = functions.https.onRequest(async (req, res) => {
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
    const msgId = req.headers["webhook-id"];
    const msgTimestamp = req.headers["webhook-timestamp"];
    const msgSignature = req.headers["webhook-signature"];
    if (!msgId || !msgTimestamp || !msgSignature) {
        res.status(400).send("Missing webhook signature headers");
        return;
    }
    try {
        const wh = new standardwebhooks_1.Webhook(webhookSecret);
        wh.verify(req.rawBody.toString(), {
            "webhook-id": msgId,
            "webhook-timestamp": msgTimestamp,
            "webhook-signature": msgSignature,
        });
    }
    catch (err) {
        console.error("MDK webhook signature verification failed:", err);
        res.status(400).send("Invalid signature");
        return;
    }
    const event = req.body;
    const eventType = event.type;
    const data = event.data;
    // Determine plan from product ID
    const productId = data.product_id;
    let plan = "pro";
    if (productId) {
        const entry = Object.entries(MDK_PRODUCT_IDS).find(([, id]) => id === productId);
        if (entry)
            plan = entry[0];
    }
    if (eventType === "checkout.completed") {
        const email = data.customer_email;
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
                mdkCustomerId: data.customer_id || null,
                subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[MDK] Updated plan for ${email} to ${plan}`);
        }
        else {
            await db.collection("pendingSubscriptions").add({
                email,
                plan,
                paymentMethod: "bitcoin",
                mdkCustomerId: data.customer_id || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[MDK] Created pending subscription for ${email} (${plan})`);
        }
    }
    if (eventType === "subscription.created") {
        const email = data.customer_email;
        if (email) {
            const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({ mdkSubscriptionStatus: "active" });
                console.log(`[MDK] Subscription active for ${email}`);
            }
        }
    }
    if (eventType === "subscription.renewed") {
        const email = data.customer_email;
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
        const email = data.customer_email;
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
//# sourceMappingURL=index.js.map