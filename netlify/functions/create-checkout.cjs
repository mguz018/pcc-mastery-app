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

    // userId is optional: signed-in buyers pass it; pay-first buyers don't have
    // an account yet, so the webhook creates/links one from the Stripe email.
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId' }) };
    }

    const days = PRICE_DAYS[priceId];
    if (!days) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unrecognized price' }) };
    }

    const siteUrl = process.env.SITE_URL || 'https://pccmastery.com';

    // Metadata is what the webhook reads to grant access. Include userId only
    // when present; otherwise the webhook falls back to the collected email.
    const metadata = { days: String(days), priceId };
    if (userId) metadata.userId = userId;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      // Prefill for signed-in buyers; leave unset for pay-first so Stripe
      // collects the email (which the webhook then uses to provision access).
      customer_email: userEmail || undefined,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      metadata,
      payment_intent_data: { metadata }
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
