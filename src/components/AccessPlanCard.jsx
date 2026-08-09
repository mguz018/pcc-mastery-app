import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { COMPETENCIES, slugFor } from '../lib/questions';
import { computeReadiness } from '../lib/readiness';

// Premium hero: time left on their access + a short, tailored plan to make the
// most of the window (leans into the time-boxed 24h/48h/1-week model).
export default function AccessPlanCard({ premium, progress, weakestComp }) {
  const r = useMemo(() => computeReadiness(progress), [progress]);

  const msLeft = Math.max(0, (premium?.expiryDate || 0) - Date.now());
  const hours = Math.floor(msLeft / 3600000);
  const days = Math.floor(hours / 24);
  const comped = !!premium?.comped;
  const timeText = comped ? 'Full access' : days >= 2 ? `${days} days left` : hours >= 1 ? `${hours}h left` : 'Under 1h left';
  const urgent = !comped && hours < 12;

  const missed = Object.keys(progress.missed || {}).length;
  const bookmarked = Object.keys(progress.bookmarks || {}).length;

  const steps = [];
  if (r.enoughData) {
    if (weakestComp != null) {
      steps.push({ t: `Drill ${COMPETENCIES[weakestComp]}`, s: 'Your weakest competency', to: `/practice/${slugFor(weakestComp)}` });
    } else if (r.weakest) {
      steps.push({ t: `Focus on ${r.weakest.label}`, s: 'Your lowest content area', to: '/practice' });
    }
    steps.push({ t: 'Take a timed mock exam', s: 'Simulate real conditions', to: '/exam' });
    if (missed > 0) steps.push({ t: `Re-drill ${missed} missed`, s: 'Lock them in before exam day', to: '/review' });
    else if (bookmarked > 0) steps.push({ t: `Review ${bookmarked} bookmarked`, s: 'Revisit the tricky ones', to: '/bookmarks' });
  } else {
    steps.push({ t: 'Take the diagnostic', s: '20 questions • ~10 min', to: '/diagnostic' });
    steps.push({ t: 'Practice a mixed set', s: '10 questions across competencies', to: '/practice' });
    steps.push({ t: 'Try a timed mock exam', s: 'See where you stand', to: '/exam' });
  }

  return (
    <section className={`rounded-2xl border p-6 sm:p-7 mb-8 ${urgent ? 'border-rose-500/40 bg-rose-500/[0.05]' : 'border-slate-200 dark:border-white/10'}`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="eyebrow text-xs font-bold uppercase text-orange-500">Your access</p>
        <span className={`text-sm font-bold ${urgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
          {comped ? '' : '⏳ '}{timeText}
        </span>
      </div>
      <h2 className="font-display text-2xl font-bold mb-1">Make your window count</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
        {comped ? 'Here’s a focused plan for your next study session.' : 'A focused plan for the time you have left.'}
      </p>

      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.to + i}>
            <Link
              to={step.to}
              className="lift flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:border-orange-500/50 transition-colors"
            >
              <span className="font-display text-lg font-bold text-orange-500/50 shrink-0 w-5 text-center">{i + 1}</span>
              <span className="flex-1">
                <span className="block font-semibold text-sm">{step.t}</span>
                <span className="block text-xs text-slate-500">{step.s}</span>
              </span>
              <span className="text-orange-500 shrink-0" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
