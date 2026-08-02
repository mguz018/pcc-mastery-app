import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    h: 'How the format works',
    p: 'Each item gives a short coaching scenario and four plausible actions. You select the one that best demonstrates PCC-level coaching and the one that least demonstrates it. Both selections are scored.'
  },
  {
    h: 'Why every option sounds reasonable',
    p: 'This is deliberate. The exam distinguishes candidates who recognize competency in context from those who recall definitions. If one option looked obviously wrong, the item would test reading rather than judgment.'
  },
  {
    h: 'What the worst answer usually is',
    p: 'Most often it is advice-giving, leading the client toward a conclusion, or shifting into consulting or therapy. Watch for options where the coach supplies the insight instead of evoking it.'
  },
  {
    h: 'What the best answer usually does',
    p: 'It stays with the client, partners rather than directs, and follows what the client has actually raised rather than what the coach finds interesting. Timing matters — the right move at the wrong moment is not the best answer.'
  },
  {
    h: 'Pacing on exam day',
    p: 'Read the scenario once, decide your worst answer first if the best is unclear. Eliminating the clearly misaligned option often makes the best choice obvious.'
  }
];

export default function PrepGuide() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo
        title="PCC Exam Prep Guide"
        description="How the ICF PCC exam BEST/WORST format works, what examiners look for, and how to pace yourself on exam day."
        path="/prep-guide"
      />
      <h1 className="font-display text-4xl font-bold mb-4">PCC exam prep guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-12">
        What the format actually tests, and how to approach it.
      </p>

      <div className="space-y-10">
        {SECTIONS.map((s, i) => (
          <section key={s.h}>
            <p className="font-display text-2xl font-bold text-orange-500/40 mb-1">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h2 className="font-bold text-lg mb-2">{s.h}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>

      <div className="mt-14">
        <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          Try it on a real question →
        </Link>
      </div>
    </div>
  );
}
