import { useState } from 'react';

// Email opt-in for people who aren't ready to buy yet (purchase intent for a
// time-boxed product spikes right before the exam — capture now, nurture later).
export default function LeadCapture({ source = 'site' }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setState('loading');
    setErr('');
    try {
      const res = await fetch('/.netlify/functions/capture-lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      setState('done');
    } catch (e2) {
      setErr(e2.message);
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] p-6 text-center">
        <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">✓ You're on the list</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">We'll send ICF PCC exam tips your way. Talk soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 dark:border-white/10 p-6">
      <p className="font-bold mb-1">Free ICF PCC exam tips by email</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Study strategies and a heads-up before the November 2026 exam format change. No spam — unsubscribe anytime.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-full border-2 border-slate-200 dark:border-white/10 bg-transparent px-5 py-3 text-sm focus:border-orange-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="btn-primary text-white font-bold rounded-full px-6 disabled:opacity-60 shrink-0"
        >
          {state === 'loading' ? 'Joining…' : 'Join the list'}
        </button>
      </div>
      {err && <p role="alert" className="text-rose-500 text-sm mt-2">{err}</p>}
    </form>
  );
}
