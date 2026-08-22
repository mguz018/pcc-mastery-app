import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Spinner from '../components/Spinner';
import LeadCapture from '../components/LeadCapture';
import ShareButton from '../components/ShareButton';
import { loadQuestions, shuffle } from '../lib/questions';
import { trackViewPricing } from '../lib/analytics';

const QUIZ_LENGTH = 7;

// A free, public top-of-funnel quiz. Low friction on purpose: pick the single
// BEST response (the full BEST/WORST rigor lives in the paid product). Scores
// a rough readiness signal, captures an email, and points to full access.
const band = (score) => {
  if (score >= 71) {
    return {
      key: 'strong', tone: 'emerald', label: "You're on track",
      msg: "You've got a strong feel for the exam's judgment calls. Lock it in with full-length, timed practice so it holds up on exam day."
    };
  }
  if (score >= 43) {
    return {
      key: 'mid', tone: 'amber', label: 'Getting there',
      msg: "You know the competencies — the gap is exam-day judgment under the real format. A focused stretch of scenarios closes it fast."
    };
  }
  return {
    key: 'low', tone: 'rose', label: 'Worth some focused prep',
    msg: "The Best/Worst format takes reps to get comfortable with. The good news: it moves quickly once you practice the real thing."
  };
};

const TONES = {
  emerald: 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400',
  amber: 'border-amber-500/40 bg-amber-500/[0.06] text-amber-600 dark:text-amber-400',
  rose: 'border-rose-500/40 bg-rose-500/[0.06] text-rose-600 dark:text-rose-400'
};

export default function Quiz() {
  const [all, setAll] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState([]); // chosen "best" index per question
  const [selecting, setSelecting] = useState(null); // highlight before advancing

  useEffect(() => { loadQuestions().then(setAll); }, []);

  // Seven free questions, fixed for this attempt (reshuffled on retake).
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => {
    if (!all) return [];
    return shuffle(all.filter((q) => !q.isPremium)).slice(0, QUIZ_LENGTH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, seed]);

  if (!all) return <Spinner label="Loading your quiz" />;

  const q = qs[index];
  const correct = qs.reduce((n, item, i) => n + (picks[i] === item.best ? 1 : 0), 0);
  const score = qs.length ? Math.round((100 * correct) / qs.length) : 0;
  const b = band(score);

  const pick = (i) => {
    if (selecting !== null) return;
    setSelecting(i);
    const next = [...picks];
    next[index] = i;
    setTimeout(() => {
      setPicks(next);
      if (index + 1 < qs.length) {
        setIndex(index + 1);
        setSelecting(null);
      } else {
        setPhase('result');
      }
    }, 220);
  };

  const restart = () => {
    setPicks([]); setIndex(0); setSelecting(null); setSeed((s) => s + 1); setPhase('quiz');
  };

  // ---------- Intro ----------
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <Seo
          title="Are You Ready for the ICF PCC Exam? Free Quiz"
          description="Take a free 7-question quiz in the real ICF PCC Best/Worst format and get an instant readiness read — no signup to start."
          path="/quiz"
        />
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Free · 2 minutes · no signup to start</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-5 leading-tight">
          Are you ready for the<br />ICF PCC exam?
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-9 leading-relaxed">
          Seven quick scenarios in the real Best/Worst format. Pick the best response and get an
          instant read on where you stand — plus exactly where to focus next.
        </p>
        <button
          onClick={() => setPhase('quiz')}
          className="btn-primary inline-flex items-center text-white font-bold rounded-full text-base"
        >
          Start the quiz →
        </button>
      </div>
    );
  }

  // ---------- Result ----------
  if (phase === 'result') {
    return (
      <div className="max-w-2xl mx-auto px-5 py-14">
        <Seo title="Your ICF PCC readiness" description="Your instant readiness read for the ICF PCC exam." path="/quiz" noindex />

        <div className={`rounded-2xl border p-8 text-center mb-8 ${TONES[b.tone]}`}>
          <p className="eyebrow text-xs font-bold uppercase mb-2">Your readiness read</p>
          <p className="font-display text-6xl font-bold mb-1">{score}%</p>
          <p className="font-bold text-xl mb-3">{b.label}</p>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            You picked the best response on <span className="font-semibold">{correct} of {qs.length}</span>. {b.msg}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-orange-500 bg-orange-500/[0.06] p-7 text-center mb-8">
          <p className="text-slate-700 dark:text-slate-200 mb-1 font-bold">Practice the real thing</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            760 scenario questions in the full Best/Worst format, timed mock exams, and a readiness score that tracks your progress.
          </p>
          <Link
            to="/pricing"
            onClick={trackViewPricing}
            className="btn-primary inline-flex items-center text-white font-bold rounded-full"
          >
            Unlock all 760 questions →
          </Link>
          <div className="mt-4">
            <Link to="/practice" className="text-sm text-orange-500 font-semibold hover:underline">
              or keep practicing free →
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <LeadCapture source="quiz" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={restart} className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/15 font-bold text-sm px-5 py-3 hover:border-orange-500 transition-colors">
            ↻ Retake
          </button>
          <ShareButton score={score} />
        </div>
      </div>
    );
  }

  // ---------- Quiz ----------
  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Seo title="ICF PCC readiness quiz" description="A quick ICF PCC readiness quiz in the real exam format." path="/quiz" noindex />

      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-slate-500">Question {index + 1} of {qs.length}</span>
        <Link to="/quiz" onClick={() => setPhase('intro')} className="text-slate-500 hover:text-orange-500">Exit</Link>
      </div>

      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500"
          style={{ width: `${(index / qs.length) * 100}%` }}
        />
      </div>

      <div className="fade-in" key={q.id}>
        <p className="text-lg leading-relaxed mb-6">{q.scenario}</p>
        <p className="font-bold mb-5">{q.question || 'Which is the BEST response?'}</p>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const active = selecting === i;
            const base = 'w-full text-left rounded-xl border p-4 transition-colors';
            const cls = active
              ? `${base} border-orange-500 bg-orange-500/[0.08]`
              : `${base} border-slate-200 dark:border-white/10 hover:border-orange-500/50`;
            return (
              <button key={i} onClick={() => pick(i)} className={cls} disabled={selecting !== null}>
                <span className="flex gap-3">
                  <span className="font-bold text-orange-500 shrink-0">{'ABCD'[i]}</span>
                  <span>{opt}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-5">Pick the response you think is best — you'll get your score at the end.</p>
      </div>
    </div>
  );
}
