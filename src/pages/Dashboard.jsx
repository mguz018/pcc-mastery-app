import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, slugFor } from '../lib/questions';

export default function Dashboard() {
  const { user, premium, isPremium } = useAuth();

  const daysLeft = isPremium && premium.expiryDate
    ? Math.max(0, Math.ceil((premium.expiryDate - Date.now()) / 86400000))
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <Seo title="Dashboard" description="Your PCC Mastery practice dashboard." path="/dashboard" noindex />

      <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
        Welcome back{user && user.email ? `, ${user.email.split('@')[0]}` : ''}
      </h1>

      {isPremium ? (
        <p className="text-slate-600 dark:text-slate-400 mb-10">
          Full access — {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining.
        </p>
      ) : (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.06] p-6 my-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-bold mb-1">You're on the free tier</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">10 of 215 questions available.</p>
          </div>
          <Link to="/pricing" className="btn-primary text-white font-bold rounded-full text-sm flex items-center justify-center shrink-0">
            Unlock everything →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        <Link to="/practice" className="lift rounded-2xl border-2 border-orange-500 bg-orange-500/[0.06] p-7">
          <span className="text-3xl block mb-3" aria-hidden="true">🎲</span>
          <p className="font-bold text-lg mb-1">Mixed practice</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ten questions drawn from every competency — closest to the real exam.
          </p>
        </Link>
        <Link to="/prep-guide" className="lift rounded-2xl border border-slate-200 dark:border-white/10 p-7">
          <span className="text-3xl block mb-3" aria-hidden="true">📘</span>
          <p className="font-bold text-lg mb-1">Prep guide</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            How the BEST/WORST format is scored and what examiners look for.
          </p>
        </Link>
      </div>

      <h2 className="font-bold mb-4">Practice one competency</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {Object.entries(COMPETENCIES).map(([id, name]) => (
          <li key={id}>
            <Link
              to={`/practice/${slugFor(Number(id))}`}
              className="lift flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:border-orange-500/50 transition-colors"
            >
              <span className="font-display text-xl font-bold text-orange-500/40 shrink-0">
                {String(id).padStart(2, '0')}
              </span>
              <span className="font-semibold text-sm">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
