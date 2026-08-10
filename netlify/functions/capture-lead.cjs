// Stores email leads server-side (Admin SDK, no client rules needed) so you can
// nurture visitors who aren't ready to buy yet. Deduped by email. Wire an email
// tool (Mailchimp/ConvertKit/Resend) later to automate the actual sends; for now
// leads collect in Firestore and the count shows in /admin.
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'site').slice(0, 60);

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please enter a valid email.' }) };
  }

  try {
    // Doc id = email so re-submits don't create duplicates.
    await db.collection('leads').doc(email).set(
      {
        email,
        source,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('capture-lead error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Try again.' }) };
  }
};
