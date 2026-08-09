// Owner-only business analytics. Uses the Admin SDK (bypasses security rules)
// so customer data is aggregated server-side and never exposed to the client
// beyond the signed-in owner. Caller must present a valid Firebase ID token
// whose email is on the owner allowlist.
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

const OWNER_EMAILS = ['mcsguzman1@gmail.com', 'aufdemarke@gmail.com'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const authz = event.headers.authorization || event.headers.Authorization || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }) };

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }
  if (!OWNER_EMAILS.includes((decoded.email || '').toLowerCase())) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    const now = Date.now();
    let totalUsers = 0;
    let everPurchased = 0;
    let premiumActive = 0;
    let revenueCents = 0;
    const planCounts = {}; // days -> count
    const recent = [];

    const usersSnap = await db.collection('users').get();
    usersSnap.forEach((doc) => {
      const d = doc.data();
      totalUsers += 1;
      if (d.isPremium && d.expiryDate > now) premiumActive += 1;
      const lp = d.lastPurchase;
      if (lp && lp.amountTotal) {
        everPurchased += 1;
        revenueCents += lp.amountTotal;
        planCounts[lp.days] = (planCounts[lp.days] || 0) + 1;
        recent.push({ email: d.email || '(unknown)', amount: lp.amountTotal, days: lp.days, at: lp.purchasedAt || 0 });
      }
    });
    recent.sort((a, b) => b.at - a.at);

    // Most-missed questions across all synced learners (a proxy for difficulty).
    const missedTally = {};
    const progSnap = await db.collection('progress').get();
    progSnap.forEach((doc) => {
      const m = doc.data().missed || {};
      Object.keys(m).forEach((id) => { missedTally[id] = (missedTally[id] || 0) + 1; });
    });
    const hardest = Object.entries(missedTally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id: Number(id), count }));

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        totalUsers,
        everPurchased,
        premiumActive,
        revenue: Math.round(revenueCents) / 100, // from each customer's latest purchase
        conversionRate: totalUsers ? Math.round((100 * everPurchased) / totalUsers) : 0,
        planCounts,
        recent: recent.slice(0, 12),
        hardest,
        syncedLearners: progSnap.size
      })
    };
  } catch (e) {
    console.error('admin-stats error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
