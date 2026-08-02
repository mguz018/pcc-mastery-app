import { Link, Navigate, useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import { COMPETENCIES } from '../lib/questions';

export default function Results() {
  const { state } = useLocation();

  // Deep-linked here without a session? Send them somewhere useful.
  if (!state || !state.answers) return <Navigate to="/practice" replace />;

  const { answers } = state;
  const score = answers.filter((a) => a.correct).length;
  const pct = Math.round((score / answers.length) * 100);

  const byComp = answers.reduce((acc, a) => {
    acc[a.competency] = acc[a.competency] || { right: 0, total: 0 };
    acc[a.competency].total += 1;
    if (a.correct) acc[a.competency].right += 1;
    return acc;
  }, {});

  const verdict = pct >= 80 ? 'Exam ready' : pct >= 65 ? 'Nearly there' : 'Keep practicing';

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo title="Your results" description="Your PCC practice session results." path="/results" noindex />

      <div className="text-center mb-12">
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Session complete</p>
        <p className="font-display text-7xl font-bold accent-text mb-2">{pct}%</p>
        <p className="text-slate-600 dark:text-slate-400">
          {score} of {answers.length} correct — {verdict}
        </p>
      </div>

      <h2 className="font-bold mb-4">By competency</h2>
      <ul className="space-y-3 mb-12">
        {Object.entries(byComp).map(([id, s]) => (
          <li key={id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-sm font-semibold">{COMPETENCIES[id]}</span>
              <span className="text-sm text-slate-500 shrink-0">{s.right}/{s.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                style={{ width: `${(s.right / s.total) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/practice" className="btn-primary flex-1 text-white font-bold rounded-full flex items-center justify-center">
          Practice again
        </Link>
        <Link to="/dashboard" className="flex-1 border border-slate-300 dark:border-white/15 rounded-full font-bold py-3.5 text-center hover:border-orange-500 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
