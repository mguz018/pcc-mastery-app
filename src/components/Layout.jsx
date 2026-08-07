import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import ThemeToggle from './ThemeToggle';

function Header({ theme }) {
  const { user, isPremium, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-[#020617]/70 border-b border-slate-200/60 dark:border-white/5">
      <nav className="max-w-6xl mx-auto px-5 h-[72px] flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          PCC <span className="accent-text">Mastery</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <NavLink
            to="/prep-guide"
            className={({ isActive }) =>
              `hidden md:block font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'}`
            }
          >
            Prep Guide
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `hidden md:block font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'}`
            }
          >
            About
          </NavLink>

          <ThemeToggle {...theme} />

          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:block font-medium text-slate-600 dark:text-slate-300 hover:text-orange-500">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-orange-500 px-2">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden sm:block font-medium text-slate-600 dark:text-slate-300 hover:text-orange-500">
              Sign in
            </Link>
          )}

          {!isPremium && (
            <Link to="/pricing" className="btn-primary text-white px-5 rounded-full font-bold text-sm shadow-lg flex items-center">
              Get Started
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-lg font-bold mb-2">PCC Mastery</p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Scenario-based practice in the authentic ICF BEST/WORST format.
          </p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Footer">
          <Link to="/pricing" className="text-slate-600 dark:text-slate-300 hover:text-orange-500">Pricing</Link>
          <Link to="/prep-guide" className="text-slate-600 dark:text-slate-300 hover:text-orange-500">Prep Guide</Link>
          <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-orange-500">About & Mentoring</Link>
          <a href="mailto:mcsguzman1@gmail.com" className="text-slate-600 dark:text-slate-300 hover:text-orange-500">Support</a>
        </nav>
        <div className="text-slate-500 dark:text-slate-400">
          <p>
            Need help? Email{' '}
            <a href="mailto:mcsguzman1@gmail.com" className="text-orange-500 hover:underline">mcsguzman1@gmail.com</a>
          </p>
          <p className="mt-3">Not affiliated with or endorsed by the International Coaching Federation.</p>
          <p className="mt-3">© {new Date().getFullYear()} PCC Mastery</p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ theme }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header theme={theme} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
