import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Spinner from '../components/Spinner';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, loadQuestions, shuffle } from '../lib/questions';
import { recordSession } from '../lib/progress';
import { trackPaywallHit, trackPracticeComplete } from '../lib/analytics';

const SECONDS_PER_Q = 90;
const PRESETS = [
  { n: 15, label: 'Quick check' },
  { n: 30, label: 'Standard' },
  { n: 60, label: 'Full simulation' }
];
const FREE_PREVIEW_N = 5; // free users get a short taster of the timed experience
const BEST_KEY = 'pcc_exam_best';

// Real ICF exam content weighting.
const DOMAIN_LABEL = {
  ethics: 'Coaching Ethics',
  boundaries: 'Definition & Boundaries',
  competency: 'Competencies & Techniques'
};
const DOMAIN_ORDER = ['ethics', 'boundaries', 'competency'];

// Sample n questions to mirror the exam blueprint: 30% ethics, 30% boundaries,
// 40% competencies — falling back to fill any shortfall from the rest of the pool.
function blueprintSample(pool, n) {
  const buckets = { ethics: [], boundaries: [], competency: [] };
  pool.forEach((q) => { (buckets[q.domain] || buckets.competency).push(q); });
  const want = { ethics: Math.round(n * 0.3), boundaries: Math.round(n * 0.3) };
  want.competency = n - want.ethics - want.boundaries;
  const picked = [];
  const leftover = [];
  DOMAIN_ORDER.forEach((d) => {
    const s = shuffle(buckets[d]);
    const take = Math.min(want[d], s.length);
    picked.push(...s.slice(0, take));
    leftover.push(...s.slice(take));
  });
  if (picked.length < n) picked.push(...shuffle(leftover).slice(0, n - picked.length));
  return shuffle(picked).slice(0, n);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const verdictFor = (pct) => (pct >= 80 ? 'Exam ready' : pct >= 65 ? 'Nearly there' : 'Keep practicing');

function readBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || null; } catch { return null; }
}

export default function ExamSimulator() {
  const { isPremium } = useAuth();
  const [all, setAll] = useState(null);
  const [phase, setPhase] = useState('config'); // config | running | done
  const [length, setLength] = useState(30);
  const [mode, setMode] = useState('blueprint'); // blueprint | even

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]); // [{best, worst} | null]
  const [best, setBest] = useState(null);
  const [worst, setWorst] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [best_, setBest_] = useState(readBest());

  const timer = useRef(null);
  const isPreview = !isPremium;

  useEffect(() => { loadQuestions().then(setAll); }, []);

  // Free users preview the timed experience on the free question pool; premium
  // users get the full bank.
  const pool = useMemo(() => {
    if (!all) return [];
    return isPremium ? all : all.filter((q) => !q.isPremium);
  }, [all, isPremium]);

  const finish = useCallback((finalResponses, qs) => {
    if (timer.current) clearInterval(timer.current);
    const scored = qs.map((q, i) => {
      const r = finalResponses[i];
      const correct = !!r && r.best === q.best && r.worst === q.worst;
      return { id: q.id, competency: q.competency, domain: q.domain, correct, answered: !!r };
    });
    const score = scored.filter((s) => s.correct).length;
    const pct = Math.round((score / qs.length) * 100);
    recordSession(scored);
    trackPracticeComplete(score, qs.length);

    // Only full-length premium exams count toward the personal best.
    if (isPremium) {
      const prev = readBest();
      if (!prev || pct > prev.pct) {
        const rec = { pct, total: qs.length };
        try { localStorage.setItem(BEST_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
        setBest_(rec);
      }
    }
    setResponses(finalResponses);
    setPhase('done');
  }, [isPremium]);

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'running') return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          // Commit the in-progress selection before auto-submitting.
          setResponses((prev) => {
            const snapshot = [...prev];
            snapshot[indexRef.current] = curRef.current;
            finish(snapshot, questions);
            return snapshot;
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [phase, questions, finish]);

  // Refs so the timer's stale closure can read the latest index/selection.
  const indexRef = useRef(0);
  const curRef = useRef(null);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { curRef.current = best !== null && worst !== null ? { best, worst } : null; }, [best, worst]);

  if (!all) return <Spinner label="Loading exam" />;

  // ---- CONFIG ----
  if (phase === 'config') {
    const startExam = (qs) => {
      setQuestions(qs);
      setResponses(new Array(qs.length).fill(null));
      setIndex(0); setBest(null); setWorst(null);
      setSecondsLeft(qs.length * SECONDS_PER_Q);
      setPhase('running');
    };

    // Free users: a short, timed preview drawn from the free question pool.
    if (isPreview) {
      trackPaywallHit();
      const startPreview = () =>
        startExam(shuffle(pool).slice(0, Math.min(FREE_PREVIEW_N, pool.length)));
      return (
        <div className="max-w-2xl mx-auto px-5 py-16">
          <Seo title="Exam Simulator" description="Try a timed ICF PCC mock-exam preview free." path="/exam" noindex />
          <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Free preview</p>
          <h1 className="font-display text-4xl font-bold mb-4">Try the timed exam experience</h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Get a feel for real test conditions: a countdown clock and{' '}
            <span className="font-semibold">no feedback until you finish</span>. This free preview is{' '}
            {FREE_PREVIEW_N} questions. Unlocking any plan opens full-length exams up to 60 questions,
            the real blueprint mix, and your readiness score.
          </p>
          <button onClick={startPreview} className="btn-primary w-full text-white font-bold rounded-full text-lg">
            Start {FREE_PREVIEW_N}-question preview →
          </button>
          <Link to="/pricing" className="block text-center text-sm text-orange-600 dark:text-orange-400 font-semibold mt-5 hover:underline">
            Or see plans — full exams from $10.99 →
          </Link>
        </div>
      );
    }

    const start = () => {
      const qs = mode === 'blueprint'
        ? blueprintSample(pool, length)
        : shuffle(pool).slice(0, length);
      startExam(qs);
    };
    return (
      <div className="max-w-2xl mx-auto px-5 py-16">
        <Seo title="Exam Simulator" description="Simulate the real timed ICF PCC exam experience." path="/exam" noindex />
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Exam Simulator</p>
        <h1 className="font-display text-4xl font-bold mb-4">Sit a timed mock exam</h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
          This mirrors real test conditions: a countdown clock, questions weighted to match the real
          exam blueprint, and <span className="font-semibold">no feedback until you finish</span>.
          You'll get a readiness score plus content-area and competency breakdowns at the end.
        </p>

        {best_ && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 mb-8 flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">🏆</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Personal best: <span className="font-bold accent-text">{best_.pct}%</span>
            </span>
          </div>
        )}

        <h2 className="font-bold mb-3">Choose your length</h2>
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          {PRESETS.map((p) => {
            const active = length === p.n;
            return (
              <button
                key={p.n}
                onClick={() => setLength(p.n)}
                aria-pressed={active}
                className={`rounded-2xl border-2 p-5 text-center transition-all ${
                  active ? 'border-orange-500 bg-orange-500/[0.06]' : 'border-slate-200 dark:border-white/10 hover:border-orange-500/40'
                }`}
              >
                <p className="font-display text-3xl font-bold">{p.n}</p>
                <p className="text-sm font-semibold mt-1">{p.label}</p>
                <p className="text-xs text-slate-500 mt-1">≈ {Math.round((p.n * SECONDS_PER_Q) / 60)} min</p>
              </button>
            );
          })}
        </div>

        <h2 className="font-bold mb-3">Choose your mix</h2>
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          {[
            { key: 'blueprint', label: 'Real exam blueprint', desc: '30% ethics · 30% definition & boundaries · 40% competencies — mirrors how the ICF exam is weighted.' },
            { key: 'even', label: 'Even mix', desc: 'Questions drawn evenly from across the eight core competencies.' }
          ].map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                aria-pressed={active}
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
                  active ? 'border-orange-500 bg-orange-500/[0.06]' : 'border-slate-200 dark:border-white/10 hover:border-orange-500/40'
                }`}
              >
                <p className="font-bold mb-1">
                  {m.label}
                  {m.key === 'blueprint' && <span className="ml-2 align-middle text-[10px] font-bold uppercase text-orange-500">Recommended</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
              </button>
            );
          })}
        </div>

        <button onClick={start} className="btn-primary w-full text-white font-bold rounded-full text-lg">
          Start {length}-question exam →
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
    const answered = responses.filter(Boolean).length;
    const low = secondsLeft <= 60;

    const pick = (i) => {
      if (best === i) { setBest(null); return; }
      if (worst === i) { setWorst(null); return; }
      if (best === null) setBest(i);
      else if (worst === null) setWorst(i);
    };

    const commitAndAdvance = () => {
      const nextResponses = [...responses];
      nextResponses[index] = { best, worst };
      if (index + 1 >= questions.length) {
        finish(nextResponses, questions);
        return;
      }
      setResponses(nextResponses);
      setIndex((i) => i + 1);
      setBest(null); setWorst(null);
    };

    const endNow = () => {
      const nextResponses = [...responses];
      if (best !== null && worst !== null) nextResponses[index] = { best, worst };
      finish(nextResponses, questions);
    };

    const optionClass = (i) => {
      const base = 'w-full text-left p-4 rounded-xl border-2 transition-all min-h-[56px]';
      if (i === best) return `${base} border-emerald-500 bg-emerald-500/10`;
      if (i === worst) return `${base} border-rose-500 bg-rose-500/10`;
      return `${base} border-slate-200 dark:border-white/10 hover:border-orange-500/50`;
    };

    return (
      <div className="max-w-3xl mx-auto px-5 py-8">
        <Seo title="Exam in progress" description="Timed PCC mock exam." path="/exam" noindex />

        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-slate-500">Question {index + 1} of {questions.length}</span>
          <span
            className={`font-mono font-bold tabular-nums px-3 py-1 rounded-full ${
              low ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-slate-200/70 dark:bg-white/10'
            }`}
            role="timer"
            aria-live="off"
          >
            ⏱ {fmt(secondsLeft)}
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
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
            {best === null ? 'Tap your BEST choice first.' : worst === null ? 'Now tap your WORST choice.' : 'Locked in — no feedback until you finish.'}
          </p>

          <button
            onClick={commitAndAdvance}
            disabled={best === null || worst === null}
            className="btn-primary w-full mt-4 text-white font-bold rounded-full disabled:opacity-40"
          >
            {index + 1 >= questions.length ? 'Finish exam →' : 'Next question →'}
          </button>

          <div className="flex justify-between items-center mt-5 text-sm">
            <span className="text-slate-500">{answered} answered</span>
            <button onClick={endNow} className="text-slate-500 hover:text-rose-500">End &amp; score now</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- DONE ----
  const scored = questions.map((q, i) => {
    const r = responses[i];
    return { q, r, correct: !!r && r.best === q.best && r.worst === q.worst, answered: !!r };
  });
  const score = scored.filter((s) => s.correct).length;
  const pct = Math.round((score / questions.length) * 100);
  const byComp = scored.reduce((acc, s) => {
    const c = s.q.competency;
    acc[c] = acc[c] || { right: 0, total: 0 };
    acc[c].total += 1;
    if (s.correct) acc[c].right += 1;
    return acc;
  }, {});
  const byDomain = scored.reduce((acc, s) => {
    const d = s.q.domain || 'competency';
    acc[d] = acc[d] || { right: 0, total: 0 };
    acc[d].total += 1;
    if (s.correct) acc[d].right += 1;
    return acc;
  }, {});
  const weakest = Object.entries(byComp).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0];

  const restart = () => {
    setPhase('config'); setQuestions([]); setResponses([]); setIndex(0); setBest(null); setWorst(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo title="Exam results" description="Your PCC mock exam results." path="/exam" noindex />

      <div className="text-center mb-12">
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Exam complete</p>
        <p className="font-display text-7xl font-bold accent-text mb-2">{pct}%</p>
        <p className="text-slate-600 dark:text-slate-400">
          {score} of {questions.length} correct — {verdictFor(pct)}
        </p>
        <p className="text-xs text-slate-400 mt-2">On the real ICF exam, passing is roughly 76%.</p>
        {best_ && best_.pct === pct && (
          <p className="text-sm accent-text font-semibold mt-2">🏆 New personal best!</p>
        )}
      </div>

      {isPreview && (
        <div className="rounded-2xl border-2 border-orange-500 bg-orange-500/[0.06] p-6 mb-10 text-center">
          <p className="font-bold text-lg mb-2">That was a {questions.length}-question preview</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            Unlock full-length timed exams (up to 60 questions), the real exam blueprint mix, and a
            saved readiness score — plus all 760 practice questions across every competency.
          </p>
          <Link to="/pricing" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
            See plans — from $10.99 →
          </Link>
        </div>
      )}

      <h2 className="font-bold mb-4">By content area</h2>
      <ul className="space-y-3 mb-8">
        {DOMAIN_ORDER.filter((d) => byDomain[d]).map((d) => {
          const s = byDomain[d];
          const pct2 = Math.round((100 * s.right) / s.total);
          return (
            <li key={d} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <div className="flex justify-between items-center gap-4 mb-2">
                <span className="text-sm font-semibold">{DOMAIN_LABEL[d]}</span>
                <span className="text-sm text-slate-500 shrink-0">{s.right}/{s.total} · {pct2}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${pct2}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="font-bold mb-4">By competency</h2>
      <ul className="space-y-3 mb-8">
        {Object.entries(byComp).map(([id, s]) => (
          <li key={id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-sm font-semibold">{COMPETENCIES[id]}</span>
              <span className="text-sm text-slate-500 shrink-0">{s.right}/{s.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${(s.right / s.total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {weakest && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.06] p-6 mb-10">
          <p className="font-bold mb-1">Focus area</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your lowest competency was <span className="font-semibold">{COMPETENCIES[weakest[0]]}</span>. Targeted
            practice there is the fastest way to lift your score.
          </p>
        </div>
      )}

      <details className="mb-10 rounded-xl border border-slate-200 dark:border-white/10 p-5">
        <summary className="font-bold cursor-pointer">Review all answers</summary>
        <ul className="mt-5 space-y-6">
          {scored.map(({ q, r, correct, answered }, n) => (
            <li key={q.id} className="border-t border-slate-200 dark:border-white/10 pt-5 first:border-0 first:pt-0">
              <div className="flex items-start gap-2 mb-2">
                <span className={`shrink-0 font-bold ${correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {correct ? '✓' : '✗'}
                </span>
                <p className="text-sm font-semibold">{n + 1}. {q.scenario}</p>
              </div>
              <div className="text-sm space-y-1 pl-6">
                <p><span className="text-emerald-600 dark:text-emerald-400 font-semibold">BEST:</span> {q.options[q.best]}</p>
                <p><span className="text-rose-600 dark:text-rose-400 font-semibold">WORST:</span> {q.options[q.worst]}</p>
                <p className="text-slate-500">
                  {answered
                    ? `You chose BEST: ${q.options[r.best]} · WORST: ${q.options[r.worst]}`
                    : 'Not answered (ran out of time).'}
                </p>
                {q.explanation?.best && <p className="text-slate-600 dark:text-slate-400 mt-1">{q.explanation.best}</p>}
              </div>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={restart} className="btn-primary flex-1 text-white font-bold rounded-full">
          Take another exam
        </button>
        <Link to="/dashboard" className="flex-1 border border-slate-300 dark:border-white/15 rounded-full font-bold py-3.5 text-center hover:border-orange-500 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
