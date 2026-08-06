import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, slugFor } from '../lib/questions';
import { accuracy, getProgress, resetProgress } from '../lib/progress';

export default function Dashboard() {
  const { user, premium, isPremium } = useAuth();
  const [prog, setProg] = useState(() => getProgress());

  const daysLeft = isPremium && premium.expiryDate
    ? Math.max(0, Math.ceil((premium.expiryDate - Date.now()) / 86400000))
    : 0;

  const weakest = useMemo(() => {
    const entries = Object.entries(prog.byComp).filter(([, s]) => s.answered >= 1);
    if (!entries.length) return null;
    entries.sort((a, b) => {
      const accA = a[1].correct / a[1].answered;
      const accB = b[1].correct / b[1].answered;
      return accA !== accB ? accA - accB : a[1].answered - b[1].answered;
    });
    return Number(entries[0][0]);
  }, [prog]);

  const reset = () => {
    if (window.confirm('Reset all your practice progress? This cannot be undone.')) {
      resetProgress();
      setProg(getProgress());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <Seo title="Dashboard" description="Your PCC Mastery practice dashboard and progress." path="/dashboard" noindex />

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
            <p className="text-sm text-slate-600 dark:text-slate-400">10 of 390 questions available.</p>
          </div>
          <Link to="/pricing" className="btn-primary text-white font-bold rounded-full text-sm flex items-center justify-center shrink-0">
            Unlock everything →
          </Link>
        </div>
      )}

      {/* Progress */}
      {prog.answered > 0 ? (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Your progress</h2>
            {prog.streak.current > 0 && (
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                🔥 {prog.streak.current}-day streak
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              [prog.answered, 'Practiced'],
              [`${accuracy(prog)}%`, 'Accuracy'],
              [prog.sessions, prog.sessions === 1 ? 'Session' : 'Sessions']
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 dark:border-white/10 p-4 text-center">
                <p className="font-display text-3xl font-bold accent-text">{value}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-slate-500 mb-3">Competency mastery</h3>
          <ul className="space-y-2 mb-6">
            {Object.entries(COMPETENCIES).map(([id, name]) => {
              const s = prog.byComp[id];
              const pct = s ? Math.round((100 * s.correct) / s.answered) : 0;
              const weak = Number(id) === weakest;
              return (
                <li
                  key={id}
                  className={`rounded-xl border p-3 ${weak ? 'border-orange-500/50 bg-orange-500/[0.04]' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <div className="flex justify-between items-center gap-3 mb-1.5">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {name}
                      {weak && <span className="text-[10px] font-bold uppercase text-orange-500">Focus</span>}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {s ? `${s.correct}/${s.answered} · ${pct}%` : 'Not started'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>

          {weakest !== null && (
            <Link
              to={`/practice/${slugFor(weakest)}`}
              className="btn-primary inline-flex items-center text-white font-bold rounded-full text-sm"
            >
              Drill your weakest: {COMPETENCIES[weakest]} →
            </Link>
          )}
          <button onClick={reset} className="block mt-5 text-xs text-slate-400 hover:text-rose-500">
            Reset progress
          </button>
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Complete a practice session or mock exam to start tracking your progress by competency.
          </p>
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
        <Link to="/exam" className="lift rounded-2xl border border-slate-200 dark:border-white/10 p-7">
          <span className="text-3xl block mb-3" aria-hidden="true">⏱️</span>
          <p className="font-bold text-lg mb-1">
            Exam Simulator
            {!isPremium && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-orange-500 border border-orange-500/40 rounded-full px-2 py-0.5">Premium</span>}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A full-length, timed mock exam with a readiness score — closest to the real thing.
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
