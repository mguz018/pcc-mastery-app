import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo
        title="About & Mentoring"
        description="About PCC Mastery — built by a working coach to simulate the real ICF PCC exam format."
        path="/about"
      />
      <h1 className="font-display text-4xl font-bold mb-6">About PCC Mastery</h1>
      <div className="space-y-5 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          PCC Mastery exists because the gap between studying the ICF Core Competencies
          and recognizing them under exam conditions is wider than most candidates expect.
        </p>
        <p>
          The exam doesn't ask you to define a competency. It hands you a scenario where
          every option sounds professionally reasonable, and asks which one a PCC-level
          coach would choose — and which they'd avoid. That's a different skill, and it
          responds to practice.
        </p>
        <p>
          All 215 questions here use that format, with explanations for both the best and
          worst choices, because understanding why an appealing answer is wrong is where
          most of the learning happens.
        </p>
      </div>

      <h2 className="font-display text-2xl font-bold mt-12 mb-4">Mentor coaching</h2>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
        ICF credentialing requires mentor coaching hours alongside your exam preparation.
        Reach out if you'd like to discuss availability.
      </p>

      <Link to="/pricing" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
        See plans →
      </Link>
    </div>
  );
}
