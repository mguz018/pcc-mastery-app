// Pay-first auto-login. A buyer who paid without an account lands on /success
// with their Stripe session id. This verifies the session is genuinely paid,
// finds (or creates) the Firebase user for the collected email, and returns a
// Firebase custom token so the success page can sign them straight in — no
// password step, no "I paid but can't log in" support tickets.
//
// Security: a valid, paid Stripe session id (cs_live_…, unguessable and only
// known to the buyer) is required, and payment_status must be 'paid'. Only that
// session's own email is ever signed in.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { sessionId } = JSON.parse(event.body || '{}');
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sessionId' }) };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return { statusCode: 402, body: JSON.stringify({ error: 'Session not paid' }) };
    }

    const email =
      (session.customer_details && session.customer_details.email) ||
      session.customer_email ||
      null;
    if (!email) {
      return { statusCode: 422, body: JSON.stringify({ error: 'No email on session' }) };
    }

    // The webhook normally creates this user; create/link here too in case this
    // request wins the race, so the buyer is never left without an account.
    let uid;
    try {
      uid = (await admin.auth().getUserByEmail(email)).uid;
    } catch {
      uid = (await admin.auth().createUser({ email })).uid;
    }

    const token = await admin.auth().createCustomToken(uid);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    };
  } catch (err) {
    console.error('claim-session failed:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not verify session' }) };
  }
};
