const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Server-side price -> access length map.
// Never trust the client for this: a user can edit the JS and ask for 3650 days.
// Must stay in sync with PLANS in src/pages/Pricing.jsx. Replace the
// placeholders with the real Stripe Price IDs (one-time / "payment" mode).
const PRICE_DAYS = {
  'price_1TztmkEaqOzbp5TY05cTwyQ4': 1,       // 24-Hour Access $10.99
  'price_1TzuPTEaqOzbp5TYLQRvijZ8': 2,       // 48-Hour Access $16.99
  'price_1TzuOAEaqOzbp5TYLXiVYsHm': 7        // 1-Week Access  $29.99
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { priceId, userId, userEmail } = JSON.parse(event.body || '{}');

    if (!priceId || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId or userId' }) };
    }

    const days = PRICE_DAYS[priceId];
    if (!days) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unrecognized price' }) };
    }

    const siteUrl = process.env.SITE_URL || 'https://pccmastery.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      // Metadata is what the webhook reads to grant access.
      metadata: { userId, days: String(days), priceId },
      payment_intent_data: {
        metadata: { userId, days: String(days) }
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      // sessionId keeps the current frontend working; url lets you switch
      // to a plain redirect later without touching this function.
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };
  } catch (err) {
    console.error('create-checkout failed:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
