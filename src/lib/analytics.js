// Loads gtag once, then exposes named events. Every call is a no-op if the
// ID isn't configured, so local dev never pollutes production numbers.
const GA_ID = import.meta.env.VITE_GA_ID;
let loaded = false;

export function initAnalytics() {
  if (loaded || !GA_ID || import.meta.env.DEV) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // allow_enhanced_conversions lets gtag send a hashed email with conversions,
  // recovering sales that cookies miss (big deal at ~92% mobile). Requires
  // Enhanced Conversions to also be turned on for the conversion action in the
  // Google Ads UI ("Google tag" method).
  window.gtag('config', GA_ID, { send_page_view: false, allow_enhanced_conversions: true });
  loaded = true;
}

function send(name, params = {}) {
  if (import.meta.env.DEV) { console.debug('[analytics]', name, params); return; }
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// --- Google Ads conversion actions ------------------------------------------
// Each constant is the account's conversion ID plus one action's label. Purchase
// was the only measured action in the account, and it fires far too rarely to
// bid on — sign-up and begin-checkout are the upstream steps with enough monthly
// volume for smart bidding to learn from at all.
//
// Create each in Google Ads (Goals > Conversions > Create conversion action >
// Website > "Add manually using code"), then paste its label below. Note that
// only PRIMARY actions influence bidding — Secondary ones are observation-only.
const ADS_PURCHASE = 'AW-17793251865/E10uCJHChM8bEJn0vaRC'; // Primary
const ADS_BEGIN_CHECKOUT = 'AW-17793251865/5QE8CMaqtOQcEJn0vaRC'; // Primary
const ADS_SIGN_UP = 'AW-17793251865/2wo-CMmqtOQcEJn0vaRC';        // observation only

// Fires one Ads conversion action. An unset label no-ops, so an action that
// hasn't been created yet never sends a malformed send_to. Passing `email` opts
// the hit into Enhanced Conversions: gtag hashes it on-device (SHA-256) before
// it ever leaves the browser, then Google matches it to the ad click.
function sendAdsConversion(label, { email, ...params } = {}) {
  if (!label) return;
  if (import.meta.env.DEV) { console.debug('[analytics] ads conversion', label, params); return; }
  if (typeof window.gtag !== 'function') return;
  if (email) window.gtag('set', 'user_data', { email });
  window.gtag('event', 'conversion', { send_to: label, ...params });
}

// Real routes mean real pageviews — this is what was impossible before.
export const trackPageView = (path, title) =>
  send('page_view', { page_path: path, page_title: title, page_location: window.location.href });

export const trackSignUp = (method, email) => {
  send('sign_up', { method });
  sendAdsConversion(ADS_SIGN_UP, { email });
};
export const trackLogin = (method) => send('login', { method });

// Funnel: view pricing -> begin checkout -> purchase
export const trackViewPricing = () => send('view_item_list', { item_list_name: 'plans' });
export const trackBeginCheckout = (plan, value, email) => {
  send('begin_checkout', { currency: 'USD', value, items: [{ item_name: plan }] });
  sendAdsConversion(ADS_BEGIN_CHECKOUT, { value, currency: 'USD', email });
};
export const trackPurchase = (sessionId, value, plan) =>
  send('purchase', { transaction_id: sessionId, currency: 'USD', value, items: [{ item_name: plan }] });

// Fires the Google Ads "Purchase" conversion action so bidding can optimize
// toward sales (and their real dollar value). transaction_id lets Google
// de-duplicate repeat loads of /success.
export const trackAdsPurchase = (value, transactionId, email) =>
  sendAdsConversion(ADS_PURCHASE, {
    value,
    currency: 'USD',
    transaction_id: transactionId || '',
    email
  });

// Engagement: tells you whether free questions actually convert.
export const trackQuestionAnswered = (id, correct) =>
  send('question_answered', { question_id: id, correct });
export const trackPracticeComplete = (score, total) =>
  send('practice_complete', { score, total });
export const trackPaywallHit = () => send('paywall_hit');
