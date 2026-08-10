import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import LeadCapture from '../components/LeadCapture';
import { GUIDES, getGuide } from '../data/guides';

export default function Guide() {
  const { slug } = useParams();
  const guide = getGuide(slug);

  if (!guide) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Seo title="Guide not found" description="That guide doesn't exist." path={`/guides/${slug}`} noindex />
        <h1 className="font-display text-3xl font-bold mb-4">That guide doesn't exist</h1>
        <Link to="/guides" className="text-orange-500 font-semibold">Browse all guides →</Link>
      </div>
    );
  }

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className="max-w-2xl mx-auto px-5 py-14">
      <Seo title={guide.metaTitle} description={guide.description} path={`/guides/${guide.slug}`} />

      <Link to="/guides" className="text-sm text-slate-500 hover:text-orange-500">← All guides</Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-4 mb-3 leading-tight">{guide.title}</h1>
      <p className="text-xs text-slate-400 mb-8">Updated {guide.updated} · {guide.readMins} min read</p>

      <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 mb-10">{guide.intro}</p>

      {guide.body.map((section, i) => (
        <section key={i} className="mb-9">
          {section.h && <h2 className="font-display text-xl font-bold mb-3">{section.h}</h2>}
          {section.p && section.p.map((para, k) => (
            <p key={k} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{para}</p>
          ))}
          {section.list && (
            <ul className="space-y-2 mt-2">
              {section.list.map((item, k) => (
                <li key={k} className="flex gap-3 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="text-orange-500 shrink-0" aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* Conversion CTA */}
      <div className="rounded-2xl border-2 border-orange-500 bg-orange-500/[0.06] p-7 text-center my-12">
        <p className="text-slate-700 dark:text-slate-200 mb-5">{guide.cta}</p>
        <Link to="/practice" className="btn-primary inline-flex items-center text-white font-bold rounded-full">
          Start practicing free →
        </Link>
      </div>

      {/* Email capture — guide readers are prime top-of-funnel leads */}
      <div className="my-12">
        <LeadCapture source={`guide:${guide.slug}`} />
      </div>

      {/* Internal links to keep readers (and crawlers) moving */}
      <h2 className="font-bold mb-4">Keep reading</h2>
      <ul className="space-y-3">
        {others.map((g) => (
          <li key={g.slug}>
            <Link to={`/guides/${g.slug}`} className="text-orange-500 font-semibold hover:underline">
              {g.title} →
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
