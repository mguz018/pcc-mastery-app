const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize firebase-admin once per container.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  // Signature verification needs the RAW body. Netlify base64-encodes it
  // in some configurations, so decode before verifying.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const userId = session.metadata && session.metadata.userId;
    const days = parseInt((session.metadata && session.metadata.days) || '0', 10);

    if (!userId || !days) {
      console.error('Session missing userId/days metadata:', session.id);
      return { statusCode: 200, body: 'ignored' }; // 200 so Stripe stops retrying
    }

    try {
      const userRef = db.collection('users').doc(userId);
      const snap = await userRef.get();
      const existing = snap.exists ? snap.data() : {};

      // If they still have unused time, extend from expiry rather than from now.
      const base =
        existing.expiryDate && existing.expiryDate > Date.now()
          ? existing.expiryDate
          : Date.now();

      const expiryDate = base + days * 24 * 60 * 60 * 1000;

      await userRef.set(
        {
          isPremium: true,
          expiryDate,
          email: session.customer_email || existing.email || null,
          lastPurchase: {
            sessionId: session.id,
            amountTotal: session.amount_total,
            days,
            purchasedAt: Date.now()
          }
        },
        { merge: true }
      );

      console.log(`Granted ${days}d to ${userId}, expires ${new Date(expiryDate).toISOString()}`);
    } catch (err) {
      console.error('Firestore write failed:', err);
      return { statusCode: 500, body: 'Firestore write failed' };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
