import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { COMPETENCIES, slugFor } from '../lib/questions';

const DIFFERENCES = [
  { them: 'Study guides that summarize the competencies', us: 'The actual BEST/WORST format you face on test day' },
  { them: 'Generic multiple-choice quizzes', us: 'Scenario-based items with PCC-level nuance' },
  { them: 'One correct answer, no reasoning', us: 'Explanations for both the best and the worst choice' },
  { them: 'No sense of where you stand', us: 'Score breakdown by individual competency' }
];

export default function Landing() {
  return (
    <>
      <Seo
        path="/"
        description="The only PCC exam prep that simulates the actual ICF BEST/WORST question format. 410 scenario-based questions across all 8 Core Competencies."
      />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-20 pb-28">
        <div className="glow w-[520px] h-[520px] bg-orange-500/20 -top-40 -left-32" aria-hidden="true" />
        <div className="glow w-[420px] h-[420px] bg-rose-500/15 top-20 -right-24" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="eyebrow reveal text-xs font-bold uppercase text-orange-500 mb-6" style={{ animationDelay: '.05s' }}>
            The only real PCC exam simulator
          </p>

          <h1 className="hero-display font-display font-bold reveal mb-7" style={{ animationDelay: '.15s' }}>
            Pass your PCC exam<br />
            <span className="accent-text">with confidence</span>
          </h1>

          <p className="reveal text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10" style={{ animationDelay: '.25s' }}>
            Every other resource explains the competencies. This one puts you in the
            BEST/WORST format you'll actually sit for — 410 scenarios, all eight competencies.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationDelay: '.35s' }}>
            <Link to="/pricing" className="btn-primary text-white font-bold rounded-full text-base shadow-xl shadow-orange-500/25 flex items-center justify-center w-full sm:w-auto">
              Start preparing now →
            </Link>
            <Link to="/practice" className="lift border border-slate-300 dark:border-white/15 px-8 py-3.5 rounded-full font-bold hover:border-orange-500 transition-colors w-full sm:w-auto text-center">
              Try 10 free questions
            </Link>
          </div>

          <dl className="reveal mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto" style={{ animationDelay: '.45s' }}>
            {[['410', 'Questions'], ['8', 'Competencies'], ['100%', 'Exam format']].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold accent-text">{n}</span>
                  <span className="block text-xs uppercase tracking-wider text-slate-500 mt-1">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Why different */}
      <section className="px-5 py-20 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
            Why this is different
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-14 max-w-xl mx-auto">
            Knowing the competencies and recognizing them under exam conditions are two different skills.
          </p>

          <ul className="grid gap-4 sm:grid-cols-2">
            {DIFFERENCES.map((d) => (
              <li key={d.us} className="lift rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
                <p className="text-sm text-slate-400 dark:text-slate-500 line-through mb-3">{d.them}</p>
                <p className="font-semibold flex gap-2">
                  <span className="text-orange-500" aria-hidden="true">✓</span>
                  <span>{d.us}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Competencies — each links to a real, shareable URL */}
      <section className="px-5 py-20 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-14">
            Practice by competency
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(COMPETENCIES).map(([id, name]) => (
              <li key={id}>
                <Link
                  to={`/practice/${slugFor(Number(id))}`}
                  className="lift block h-full rounded-xl border border-slate-200 dark:border-white/10 p-5 hover:border-orange-500/50 transition-colors"
                >
                  <span className="block font-display text-2xl font-bold text-orange-500/40 mb-2">
                    {String(id).padStart(2, '0')}
                  </span>
                  <span className="font-semibold text-sm leading-snug">{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Close */}
      <section className="px-5 py-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 p-10 sm:p-14 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to sit the real thing?
          </h2>
          <p className="text-white/90 mb-8 max-w-lg mx-auto">
            Start with ten free questions. Unlock all 410 when you're ready.
          </p>
          <Link to="/pricing" className="lift inline-flex items-center bg-white text-orange-600 font-bold py-4 px-10 rounded-full text-lg shadow-xl">
            See plans →
          </Link>
        </div>
      </section>
    </>
  );
}
