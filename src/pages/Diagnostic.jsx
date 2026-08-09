import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Spinner from '../components/Spinner';
import ReadinessCard from '../components/ReadinessCard';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, loadQuestions, shuffle } from '../lib/questions';
import { getProgress, recordSession } from '../lib/progress';
import { trackPaywallHit } from '../lib/analytics';

const LENGTH = 20; // enough to unlock the blueprint-weighted Readiness Score
const DOMAIN_ORDER = ['ethics', 'boundaries', 'competency'];

// Blueprint-weighted sample (30% ethics / 30% boundaries / 40% competency),
// filling any shortfall from the rest of the pool.
function blueprintSample(pool, n) {
  const buckets = { ethics: [], boundaries: [], competency: [] };
  pool.forEach((q) => { (buckets[q.domain] || buckets.competency).push(q); });
  const want = { ethics: Math.round(n * 0.3), boundaries: Math.round(n * 0.3) };
  want.competency = n - want.ethics - want.boundaries;
  const picked = [];
  const leftover = [];
  DOMAIN_ORDER.forEach((d) => {
    const s = shuffle(buckets[d]);
    picked.push(...s.slice(0, want[d]));
    leftover.push(...s.slice(want[d]));
  });
  if (picked.length < n) picked.push(...shuffle(leftover).slice(0, n - picked.length));
  return shuffle(picked).slice(0, n);
}

export default function Diagnostic() {
  const { isPremium } = useAuth();
  const [all, setAll] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | running | done
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [best, setBest] = useState(null);
  const [worst, setWorst] = useState(null);
  const [answers, setAnswers] = useState([]); // scored responses so far
  const [prog, setProg] = useState(null); // progress snapshot after finishing

  useEffect(() => { loadQuestions().then(setAll); }, []);

  const pool = useMemo(() => (all && isPremium ? all : []), [all, isPremium]);

  if (!all) return <Spinner label="Loading diagnostic" />;

  // Free users: the diagnostic needs the full bank, so it's a premium feature.
  if (!isPremium) {
    trackPaywallHit();
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Diagnostic" description="Find your ICF PCC starting point with a quick diagnostic." path="/diagnostic" noindex />
        <span className="text-5xl block mb-5" aria-hidden="true">🧭</span>
        <h1 className="font-display text-3xl font-bold mb-4">Find your starting point</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Unlock the full bank to take a {LENGTH}-question diagnostic that pinpoints your weakest
          content area and sets your readiness score — so you know exactly where to focus.
        </p>
        <Link to="/pricing" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          See plans — from $10.99 →
        </Link>
      </div>
    );
  }

  // ---- INTRO ----
  if (phase === 'intro') {
    const start = () => {
      setQuestions(blueprintSample(pool, LENGTH));
      setIndex(0); setBest(null); setWorst(null); setAnswers([]);
      setPhase('running');
    };
    return (
      <div className="max-w-2xl mx-auto px-5 py-16">
        <Seo title="Diagnostic" description="Find your ICF PCC starting point with a quick diagnostic." path="/diagnostic" noindex />
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Start here</p>
        <h1 className="font-display text-4xl font-bold mb-4">Find your starting point</h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
          Answer {LENGTH} questions across all three exam content areas — no timer, no pressure. When you
          finish, you'll get your <span className="font-semibold">readiness score</span> and a clear
          recommendation on where to focus first. Takes about 10 minutes.
        </p>
        <button onClick={start} className="btn-primary w-full text-white font-bold rounded-full text-lg">
          Start the {LENGTH}-question diagnostic →
        </button>
        <Link to="/dashboard" className="block text-center text-sm text-slate-500 hover:text-orange-500 mt-5">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  // ---- RUNNING ----
  if (phase === 'running') {
    const q = questions[index];

    const pick = (i) => {
      if (best === i) { setBest(null); return; }
      if (worst === i) { setWorst(null); return; }
      if (best === null) setBest(i);
      else if (worst === null) setWorst(i);
    };

    const next = () => {
      const scored = { id: q.id, competency: q.competency, domain: q.domain, correct: best === q.best && worst === q.worst };
      const nextAnswers = [...answers, scored];
      if (index + 1 >= questions.length) {
        recordSession(nextAnswers);
        setProg(getProgress());
        setPhase('done');
        return;
      }
      setAnswers(nextAnswers);
      setIndex((i) => i + 1);
      setBest(null); setWorst(null);
    };

    const optionClass = (i) => {
      const base = 'w-full text-left p-4 rounded-xl border-2 transition-all min-h-[56px]';
      if (i === best) return `${base} border-emerald-500 bg-emerald-500/10`;
      if (i === worst) return `${base} border-rose-500 bg-rose-500/10`;
      return `${base} border-slate-200 dark:border-white/10 hover:border-orange-500/50`;
    };

    return (
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Seo title="Diagnostic in progress" description="Your ICF PCC diagnostic." path="/diagnostic" noindex />

        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-slate-500">Diagnostic</span>
          <span className="text-slate-500">{index + 1} of {questions.length}</span>
        </div>

        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500"
            style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>

        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">{COMPETENCIES[q.competency]}</p>

        <div className="fade-in" key={q.id}>
          <p className="text-lg leading-relaxed mb-6">{q.scenario}</p>
          <p className="font-bold mb-5">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => pick(i)} className={optionClass(i)}>
                <span className="flex gap-3">
                  <span className="font-bold text-orange-500 shrink-0">{'ABCD'[i]}</span>
                  <span>{opt}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500 mt-5">
            {best === null ? 'Tap your BEST choice first.' : worst === null ? 'Now tap your WORST choice.' : 'Locked in — no feedback until the end.'}
          </p>
          <button
            onClick={next}
            disabled={best === null || worst === null}
            className="btn-primary w-full mt-4 text-white font-bold rounded-full disabled:opacity-40"
          >
            {index + 1 >= questions.length ? 'See your results →' : 'Next question →'}
          </button>
        </div>
      </div>
    );
  }

  // ---- DONE ----
  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo title="Your diagnostic results" description="Your ICF PCC readiness and where to focus." path="/diagnostic" noindex />
      <div className="text-center mb-8">
        <span className="text-5xl block mb-4" aria-hidden="true">🧭</span>
        <h1 className="font-display text-4xl font-bold mb-3">Here's your starting point</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Based on your diagnostic — use the focus area below to decide what to practice first.
        </p>
      </div>

      <ReadinessCard progress={prog || getProgress()} isPremium={isPremium} />

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/practice" className="btn-primary flex-1 text-white font-bold rounded-full text-center">
          Start practicing →
        </Link>
        <Link to="/dashboard" className="flex-1 border border-slate-300 dark:border-white/15 rounded-full font-bold py-3.5 text-center hover:border-orange-500 transition-colors">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
