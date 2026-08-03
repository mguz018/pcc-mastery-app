import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import Spinner from '../components/Spinner';
import { useAuth } from '../lib/AuthContext';
import { COMPETENCIES, COMPETENCY_SLUGS, loadQuestions, shuffle } from '../lib/questions';
import { trackPaywallHit, trackPracticeComplete, trackQuestionAnswered } from '../lib/analytics';

const SESSION_LENGTH = 10;

export default function Practice() {
  const { competency: slug } = useParams();
  const navigate = useNavigate();
  const { isPremium } = useAuth();

  const [all, setAll] = useState(null);
  const [index, setIndex] = useState(0);
  const [best, setBest] = useState(null);
  const [worst, setWorst] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);

  const competencyId = slug ? COMPETENCY_SLUGS[slug] : null;
  const invalidSlug = Boolean(slug && !competencyId);

  useEffect(() => { loadQuestions().then(setAll); }, []);

  const questions = useMemo(() => {
    if (!all) return [];
    let pool = all;
    if (competencyId) pool = pool.filter((q) => q.competency === competencyId);
    if (!isPremium) pool = pool.filter((q) => !q.isPremium);
    return shuffle(pool).slice(0, SESSION_LENGTH);
  }, [all, competencyId, isPremium]);

  // Reset the session whenever the route changes.
  useEffect(() => {
    setIndex(0); setBest(null); setWorst(null); setSubmitted(false); setAnswers([]);
  }, [slug, isPremium]);

  if (invalidSlug) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Competency not found" description="That competency doesn't exist." path={`/practice/${slug}`} noindex />
        <h1 className="font-display text-3xl font-bold mb-4">That competency doesn't exist</h1>
        <Link to="/practice" className="text-orange-500 font-semibold">Browse all questions →</Link>
      </div>
    );
  }

  if (!all) return <Spinner label="Loading questions" />;

  if (questions.length === 0) {
    trackPaywallHit();
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Unlock full access" description="Unlock all 240 PCC practice questions." path="/practice" noindex />
        <h1 className="font-display text-3xl font-bold mb-4">You've used the free questions</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Unlock all 240 questions across every competency.
        </p>
        <Link to="/pricing" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          See plans →
        </Link>
      </div>
    );
  }

  const q = questions[index];
  const title = competencyId ? COMPETENCIES[competencyId] : 'Mixed practice';

  const pick = (i) => {
    if (submitted) return;
    if (best === i) { setBest(null); return; }
    if (worst === i) { setWorst(null); return; }
    if (best === null) setBest(i);
    else if (worst === null) setWorst(i);
  };

  const submit = () => {
    if (best === null || worst === null) return;
    const correct = best === q.best && worst === q.worst;
    trackQuestionAnswered(q.id, correct);
    setAnswers((a) => [...a, { id: q.id, competency: q.competency, correct }]);
    setSubmitted(true);
  };

  const next = () => {
    const done = [...answers];
    if (index + 1 >= questions.length) {
      const score = done.filter((a) => a.correct).length;
      trackPracticeComplete(score, done.length);
      navigate('/results', { state: { answers: done, competency: competencyId } });
      return;
    }
    setIndex((i) => i + 1);
    setBest(null); setWorst(null); setSubmitted(false);
  };

  const optionClass = (i) => {
    const base = 'w-full text-left p-4 rounded-xl border-2 transition-all min-h-[56px]';
    if (submitted) {
      if (i === q.best) return `${base} border-emerald-500 bg-emerald-500/10`;
      if (i === q.worst) return `${base} border-rose-500 bg-rose-500/10`;
      return `${base} border-slate-200 dark:border-white/10 opacity-60`;
    }
    if (i === best) return `${base} border-emerald-500 bg-emerald-500/10`;
    if (i === worst) return `${base} border-rose-500 bg-rose-500/10`;
    return `${base} border-slate-200 dark:border-white/10 hover:border-orange-500/50`;
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Seo
        title={`Practice — ${title}`}
        description={`Practice ICF ${title} scenarios in the authentic BEST/WORST exam format.`}
        path={slug ? `/practice/${slug}` : '/practice'}
        noindex
      />

      <div className="flex items-center justify-between mb-3 text-sm">
        <Link to="/dashboard" className="text-slate-500 hover:text-orange-500">← Dashboard</Link>
        <span className="text-slate-500">{index + 1} of {questions.length}</span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500"
          style={{ width: `${((index + (submitted ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">
        {COMPETENCIES[q.competency]}
      </p>

      <div className="fade-in" key={q.id}>
        <p className="text-lg leading-relaxed mb-6">{q.scenario}</p>
        <p className="font-bold mb-5">{q.question}</p>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => pick(i)} className={optionClass(i)} disabled={submitted}>
              <span className="flex gap-3">
                <span className="font-bold text-orange-500 shrink-0">{'ABCD'[i]}</span>
                <span>{opt}</span>
              </span>
            </button>
          ))}
        </div>

        {!submitted && (
          <>
            <p className="text-sm text-slate-500 mt-5">
              {best === null ? 'Tap your BEST choice first.' : worst === null ? 'Now tap your WORST choice.' : 'Ready to submit.'}
            </p>
            <button
              onClick={submit}
              disabled={best === null || worst === null}
              className="btn-primary w-full mt-4 text-white font-bold rounded-full disabled:opacity-40"
            >
              Submit answer
            </button>
          </>
        )}

        {submitted && (
          <div className="mt-8 space-y-4 fade-in">
            <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 p-5">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">BEST</p>
              <p className="text-sm leading-relaxed">{q.explanation.best}</p>
            </div>
            <div className="rounded-xl border-l-4 border-rose-500 bg-rose-500/5 p-5">
              <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">WORST</p>
              <p className="text-sm leading-relaxed">{q.explanation.worst}</p>
            </div>
            {q.deeperInsight && (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-5">
                <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-2">PCC-level insight</p>
                <p className="text-sm leading-relaxed">{q.deeperInsight}</p>
              </div>
            )}
            <button onClick={next} className="btn-primary w-full text-white font-bold rounded-full">
              {index + 1 >= questions.length ? 'See your results →' : 'Next question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
