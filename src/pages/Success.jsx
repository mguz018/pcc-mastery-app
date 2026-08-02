import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/AuthContext';
import { trackPurchase } from '../lib/analytics';

// Stripe redirects here. The webhook writes access to Firestore asynchronously,
// so poll until it lands rather than showing a false "no access" state.
export default function Success() {
  const [params] = useSearchParams();
  const { refreshPremium, isPremium } = useAuth();
  const [state, setState] = useState('checking');

  useEffect(() => {
    const sessionId = params.get('session_id');
    let attempts = 0;
    let timer;
    let cancelled = false;

    const poll = async () => {
      attempts += 1;
      const data = await refreshPremium();
      if (cancelled) return;

      if (data && data.isPremium) {
        setState('ready');
        if (sessionId) {
          const days = data.lastPurchase && data.lastPurchase.days;
          trackPurchase(sessionId, days === 7 ? 9.99 : 24.99, days === 7 ? '7-Day Access' : '1-Month Access');
        }
        return;
      }
      if (attempts < 12) timer = setTimeout(poll, 1500);
      else setState('slow');
    };

    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [params, refreshPremium]);

  return (
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <Seo title="Payment complete" description="Your PCC Mastery access is active." path="/success" noindex />

      <span className="text-6xl block mb-6" aria-hidden="true">🎉</span>
      <h1 className="font-display text-4xl font-bold mb-4">Payment received</h1>

      {state === 'checking' && !isPremium && (
        <p className="text-slate-600 dark:text-slate-400" role="status">
          Activating your access — this takes a few seconds.
        </p>
      )}

      {(state === 'ready' || isPremium) && (
        <>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            All 215 questions are unlocked. Good luck with your exam.
          </p>
          <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
            Start practicing →
          </Link>
        </>
      )}

      {state === 'slow' && !isPremium && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-left">
          <p className="font-bold mb-1">Your access is still activating</p>
          <p className="text-slate-600 dark:text-slate-300">
            Your payment went through. Refresh this page in a moment — if access still
            doesn't appear, email support with your receipt and we'll sort it immediately.
          </p>
        </div>
      )}
    </div>
  );
}
