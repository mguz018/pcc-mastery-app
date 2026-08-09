import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { GUIDES } from '../data/guides';

export default function Guides() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <Seo
        title="ICF PCC Exam Guides"
        description="Free guides to the ICF PCC credentialing exam — the BEST/WORST question format, how to prepare, credential levels, and test-day tips."
        path="/guides"
      />

      <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Free guides</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">ICF PCC Exam Guides</h1>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
        Straight answers to what coaches actually ask about the ICF PCC credentialing exam — the
        question format, how to study, and what to expect on test day. Written by the team behind
        PCC Mastery.
      </p>

      <ul className="space-y-4 mb-14">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              to={`/guides/${g.slug}`}
              className="lift block rounded-2xl border border-slate-200 dark:border-white/10 p-6 hover:border-orange-500/50 transition-colors"
            >
              <h2 className="font-bold text-lg mb-1">{g.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{g.description}</p>
              <span className="text-xs text-slate-400">{g.readMins} min read</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border-2 border-orange-500 bg-orange-500/[0.06] p-7 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">Ready to practice the real format?</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-5">
          Try ten free BEST/WORST questions — no card required.
        </p>
        <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          Start practicing free →
        </Link>
      </div>
    </div>
  );
}
