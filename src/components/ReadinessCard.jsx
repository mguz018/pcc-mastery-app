import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { computeReadiness } from '../lib/readiness';
import ShareButton from './ShareButton';

const TONE = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40 bg-emerald-500/[0.05]' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', ring: 'border-amber-500/40 bg-amber-500/[0.05]' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', ring: 'border-rose-500/40 bg-rose-500/[0.05]' }
};

export default function ReadinessCard({ progress, isPremium }) {
  const r = useMemo(() => computeReadiness(progress), [progress]);

  // Not enough data yet — show a progress-to-unlock prompt instead of a number.
  if (!r.enoughData) {
    const pct = Math.round((r.answered / (r.answered + r.needed)) * 100);
    return (
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-8">
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-2">Exam Readiness Score</p>
        <p className="font-bold mb-1">Answer {r.needed} more {r.needed === 1 ? 'question' : 'questions'} to unlock it</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Once you've practiced enough, we'll estimate how close you are to passing — weighted to the real exam blueprint.
        </p>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${pct}%` }} />
        </div>
        <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full text-sm">
          Keep practicing →
        </Link>
      </section>
    );
  }

  const tone = TONE[r.band.tone];

  return (
    <section className={`rounded-2xl border ${tone.ring} p-6 sm:p-7 mb-8`}>
      <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Exam Readiness Score</p>

      <div className="flex items-end gap-4 mb-4">
        <p className={`font-display text-6xl font-bold leading-none ${tone.text}`}>{r.score}%</p>
        <div className="pb-1">
          <p className={`font-bold ${tone.text}`}>{r.band.label}</p>
          <p className="text-xs text-slate-500">Passing is roughly {r.passLine}%</p>
        </div>
      </div>

      {/* Score bar with the pass line marked */}
      <div className="relative h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-1">
        <div className={`h-full ${tone.bar} transition-all duration-700`} style={{ width: `${r.score}%` }} />
      </div>
      <div className="relative h-4 mb-4">
        <span className="absolute -translate-x-1/2 text-[10px] text-slate-400" style={{ left: `${r.passLine}%` }}>
          ▲ pass
        </span>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
        Based on {r.answered} practiced {r.answered === 1 ? 'question' : 'questions'}
        {r.hasExam ? ' plus your best mock exam' : ''}.
        {!r.hasExam && (
          <> No mock exam yet — <Link to="/exam" className="text-orange-500 font-semibold hover:underline">take a timed exam</Link> to confirm your score.</>
        )}
      </p>

      {/* Blueprint content-area breakdown */}
      <ul className="space-y-2.5 mb-5">
        {r.domains.map((d) => (
          <li key={d.key}>
            <div className="flex justify-between items-center gap-3 mb-1 text-sm">
              <span className="font-medium flex items-center gap-2">
                {d.label}
                <span className="text-[10px] text-slate-400">{Math.round(d.weight * 100)}% of exam</span>
              </span>
              <span className="text-slate-500 shrink-0">{d.acc == null ? 'Not tested' : `${d.acc}%`}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${d.acc || 0}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {r.weakest && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          <span className="font-semibold">Focus area:</span> {r.weakest.label} is your lowest content area
          {r.weakest.acc != null ? ` (${r.weakest.acc}%)` : ''} — the fastest place to lift your score.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/exam" className="btn-primary inline-flex items-center text-white font-bold rounded-full text-sm">
          {r.hasExam ? 'Retake the mock exam →' : 'Take a mock exam →'}
        </Link>
        <Link to="/practice" className="inline-flex items-center rounded-full border border-slate-300 dark:border-white/15 font-bold text-sm px-5 py-3 hover:border-orange-500 transition-colors">
          Practice more
        </Link>
        <ShareButton score={r.score} />
      </div>

      {!isPremium && (
        <p className="text-xs text-slate-500 mt-5 border-t border-slate-200 dark:border-white/10 pt-4">
          This estimate is based on the free questions.{' '}
          <Link to="/pricing" className="text-orange-500 font-semibold hover:underline">Unlock all 720</Link>{' '}
          for an accurate, blueprint-weighted readiness score.
        </p>
      )}
    </section>
  );
}
