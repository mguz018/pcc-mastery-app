import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-5 py-28 text-center">
      <Seo title="Page not found" description="That page doesn't exist." path="/404" noindex />
      <p className="font-display text-7xl font-bold accent-text mb-4">404</p>
      <h1 className="font-display text-2xl font-bold mb-3">That page doesn't exist</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        The link may be out of date, or the address may have a typo.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-primary text-white font-bold rounded-full flex items-center justify-center px-8">
          Go home
        </Link>
        <Link to="/practice" className="border border-slate-300 dark:border-white/15 rounded-full font-bold py-3.5 px-8 hover:border-orange-500 transition-colors">
          Start practicing
        </Link>
      </div>
    </div>
  );
}
