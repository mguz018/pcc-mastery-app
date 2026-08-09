import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Spinner from '../components/Spinner';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, loadQuestions } from '../lib/questions';

const OWNER_EMAILS = ['mcsguzman1@gmail.com', 'aufdemarke@gmail.com'];
const PLAN_LABEL = { 1: '24-Hour', 2: '48-Hour', 7: '1-Week' };
const fmtMoney = (n) => `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Admin() {
  const { user } = useAuth();
  const [state, setState] = useState('loading'); // loading | ready | error | forbidden
  const [stats, setStats] = useState(null);
  const [qById, setQById] = useState({});

  const isOwner = user && OWNER_EMAILS.includes((user.email || '').toLowerCase());

  useEffect(() => {
    if (!user) return; // ProtectedRoute will redirect
    if (!isOwner) { setState('forbidden'); return; }

    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/.netlify/functions/admin-stats', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        const all = await loadQuestions();
        const map = {};
        all.forEach((q) => { map[q.id] = q; });
        if (!cancelled) { setStats(data); setQById(map); setState('ready'); }
      } catch (e) {
        if (!cancelled) { console.error(e); setState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, isOwner]);

  if (state === 'forbidden') {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Admin" description="Owner dashboard." path="/admin" noindex />
        <h1 className="font-display text-3xl font-bold mb-4">Not authorized</h1>
        <Link to="/dashboard" className="text-orange-500 font-semibold">← Back to your dashboard</Link>
      </div>
    );
  }

  if (state === 'loading') return <Spinner label="Loading analytics" />;

  if (state === 'error') {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Admin" description="Owner dashboard." path="/admin" noindex />
        <h1 className="font-display text-3xl font-bold mb-4">Couldn't load analytics</h1>
        <p className="text-slate-600 dark:text-slate-400">Try again in a moment.</p>
      </div>
    );
  }

  const tiles = [
    [stats.totalUsers, 'Signups'],
    [stats.everPurchased, 'Paying customers'],
    [`${stats.conversionRate}%`, 'Conversion'],
    [fmtMoney(stats.revenue), 'Latest-purchase revenue'],
    [stats.premiumActive, 'Active access now'],
    [stats.syncedLearners, 'Synced learners']
  ];

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <Seo title="Admin" description="Owner dashboard." path="/admin" noindex />
      <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Owner analytics</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-10">
        A quick pulse on the business. Revenue reflects each customer's latest purchase — Stripe is the source of truth for exact lifetime totals.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {tiles.map(([value, label]) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-white/10 p-5 text-center">
            <p className="font-display text-3xl font-bold accent-text">{value}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-bold mb-4">Sales by plan</h2>
      <ul className="space-y-2 mb-12">
        {[1, 2, 7].map((days) => (
          <li key={days} className="flex justify-between items-center rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <span className="text-sm font-medium">{PLAN_LABEL[days]} Access</span>
            <span className="text-sm text-slate-500">{stats.planCounts?.[days] || 0} sold</span>
          </li>
        ))}
      </ul>

      <h2 className="font-bold mb-4">Recent purchases</h2>
      {stats.recent.length === 0 ? (
        <p className="text-slate-500 mb-12">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-white/10">
                <th className="py-2 pr-4 font-semibold">Customer</th>
                <th className="py-2 pr-4 font-semibold">Plan</th>
                <th className="py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-white/5">
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4 text-slate-500">{PLAN_LABEL[r.days] || `${r.days}d`}</td>
                  <td className="py-2">{fmtMoney((r.amount || 0) / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-bold mb-1">Hardest questions</h2>
      <p className="text-xs text-slate-500 mb-4">Most-missed across synced learners — candidates to review or rewrite.</p>
      {stats.hardest.length === 0 ? (
        <p className="text-slate-500">Not enough data yet.</p>
      ) : (
        <ol className="space-y-2">
          {stats.hardest.map((h) => {
            const q = qById[h.id];
            return (
              <li key={h.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="flex justify-between gap-4">
                  <span className="text-sm">
                    <span className="text-slate-400">#{h.id}</span>{' '}
                    {q ? q.scenario.slice(0, 90) + (q.scenario.length > 90 ? '…' : '') : '(question not found)'}
                    {q && <span className="block text-xs text-orange-500 mt-1">{COMPETENCIES[q.competency]}</span>}
                  </span>
                  <span className="text-sm text-slate-500 shrink-0">missed ×{h.count}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
