import { useState } from 'react';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

const LINKEDIN = 'https://www.linkedin.com/in/markguzman01/';
const CAREER_LAB = 'https://www.mgcareerlab.com';

export default function About() {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo
        title="About & Coaching"
        description="PCC Mastery is continuously researched and updated to mirror the current ICF Credentialing Exam and Core Competency model — built by Mark Guzman, PCC."
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
          This platform is continuously researched and refined against the current ICF
          Credentialing Exam and the latest Core Competency model. As the standards evolve,
          so does the preparation here — so what you practice always reflects the exam as it
          is today, not an outdated version of it.
        </p>
      </div>

      {/* Meet your coach */}
      <div className="mt-14 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            {photoOk ? (
              <img
                src="/mark-guzman.jpg"
                alt="Mark Guzman, PCC"
                onError={() => setPhotoOk(false)}
                className="w-28 h-28 rounded-full object-cover ring-2 ring-orange-500/60"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-display text-3xl font-bold"
                aria-hidden="true"
              >
                MG
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-display text-2xl font-bold">Meet your coach</h2>
            <p className="accent-text font-semibold mb-3">Mark Guzman, PCC</p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Coaching is my passion. As an ICF PCC-certified coach — and a recognized
              Leadership Coach of the Year — I've seen how the right conversation at the right
              moment can change the whole trajectory of someone's career. Helping other
              coaches reach their PCC is some of the most rewarding work I do.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <span className="font-semibold text-slate-900 dark:text-white">Want a coaching session?</span>{' '}
            Reach out to me directly on{' '}
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="accent-text font-semibold hover:underline">
              LinkedIn
            </a>
            {' '}— I'd love to connect.
          </p>
          <p>
            <span className="font-semibold text-slate-900 dark:text-white">Need help with your career or getting ICF certified?</span>{' '}
            Visit{' '}
            <a href={CAREER_LAB} target="_blank" rel="noopener noreferrer" className="accent-text font-semibold hover:underline">
              MG Career Lab
            </a>
            {' '}for coaching and certification support.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <Link to="/pricing" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          See plans →
        </Link>
      </div>
    </div>
  );
}
