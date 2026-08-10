import { TESTIMONIALS } from '../data/testimonials';

// Renders nothing until real testimonials exist — no fabricated social proof.
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;

  return (
    <section className="max-w-4xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl font-bold text-center mb-10">What coaches say</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <figure key={i} className="rounded-2xl border border-slate-200 dark:border-white/10 p-6">
            <blockquote className="text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
              “{t.quote}”
            </blockquote>
            <figcaption className="text-sm">
              <span className="font-bold">{t.name}</span>
              {t.detail && <span className="text-slate-500"> · {t.detail}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
