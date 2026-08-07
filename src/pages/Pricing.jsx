import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/AuthContext';
import { trackBeginCheckout, trackViewPricing } from '../lib/analytics';

// priceId values MUST be real Stripe Price IDs (one-time / "payment" mode) and
// MUST stay in sync with PRICE_DAYS in netlify/functions/create-checkout.js.
// Create the three Prices in the Stripe dashboard, then replace the placeholders.
export const PLANS = {
  day1: {
    priceId: 'price_1TztmkEaqOzbp5TY05cTwyQ4',
    price: 10.99, days: 1, label: '24-Hour Access', icon: '⚡',
    desc: 'Perfect for last-minute, night-before review'
  },
  day2: {
    priceId: 'price_1TzuPTEaqOzbp5TYLQRvijZ8',
    price: 16.99, days: 2, label: '48-Hour Access', icon: '🎯',
    desc: 'A focused weekend of exam prep'
  },
  week: {
    priceId: 'price_1TzuOAEaqOzbp5TYLXiVYsHm',
    price: 29.99, days: 7, label: '1-Week Access', icon: '🚀',
    desc: 'Thorough prep at the best daily rate', popular: true
  }
};

export default function Pricing() {
  const [selected, setSelected] = useState('week');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { trackViewPricing(); }, []);

  const checkout = async () => {
    setError('');

    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    const plan = PLANS[selected];
    setBusy(true);
    trackBeginCheckout(plan.label, plan.price);

    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId, userId: user.uid, userEmail: user.email })
      });

      // A non-JSON body here means the function didn't deploy — surface that
      // plainly instead of a raw JSON parse error.
      const type = res.headers.get('content-type') || '';
      if (!type.includes('application/json')) {
        throw new Error('Checkout is temporarily unavailable. Please try again shortly.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.');

      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (isPremium) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Pricing" description="You already have full access to PCC Mastery." path="/pricing" />
        <h1 className="font-display text-3xl font-bold mb-4">You already have full access</h1>
        <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          Start practicing →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      <Seo
        title="Pricing"
        description="Unlock all 430 PCC exam practice questions. One-time access from $10.99 — 24-hour, 48-hour, or 1-week. No subscription."
        path="/pricing"
      />

      <div className="text-center mb-14">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Choose your plan</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Full access to all 430 questions. One-time payment — nothing recurring.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3 mb-10">
        {Object.entries(PLANS).map(([key, plan]) => {
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              aria-pressed={active}
              className={`relative text-left rounded-2xl border-2 p-8 transition-all ${
                active
                  ? 'border-orange-500 bg-orange-500/[0.06]'
                  : 'border-slate-200 dark:border-white/10 hover:border-orange-500/40'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  ★ BEST VALUE
                </span>
              )}
              <div className="text-center">
                <span className="text-4xl block mb-3" aria-hidden="true">{plan.icon}</span>
                <p className="font-bold text-lg mb-2">{plan.label}</p>
                <p className="font-display text-5xl font-bold mb-4">${plan.price}</p>
                <hr className="border-slate-200 dark:border-white/10 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{plan.desc}</p>
                {active && <p className="mt-4 font-bold text-orange-500">✓ Selected</p>}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      <button
        onClick={checkout}
        disabled={busy}
        className="btn-primary w-full text-white font-bold rounded-full text-lg disabled:opacity-60"
      >
        {busy ? 'Opening secure checkout…' : `Get ${PLANS[selected].label} →`}
      </button>

      <p className="text-center mt-5 text-sm text-slate-500 flex items-center justify-center gap-2">
        <span aria-hidden="true">🔒</span> Secure payment powered by Stripe
      </p>
    </div>
  );
}
