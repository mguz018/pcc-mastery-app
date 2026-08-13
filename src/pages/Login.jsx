import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { user, login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || '/dashboard';
  const buying = from === '/pricing'; // arrived here from a buy click

  const [mode, setMode] = useState(buying ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const friendly = (code) => ({
    'auth/invalid-credential': 'That email and password don\u2019t match an account.',
    'auth/user-not-found': 'No account with that email yet.',
    'auth/wrong-password': 'That password isn\u2019t right.',
    'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/weak-password': 'Use at least 6 characters.',
    'auth/invalid-email': 'That email address doesn\u2019t look right.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.'
  }[code] || 'Something went wrong. Please try again.');

  const submit = async () => {
    setError(''); setNotice('');
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(email.trim(), password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(friendly(e.code));
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(''); setNotice('');
    if (!email) { setError('Enter your email first, then tap reset.'); return; }
    try {
      await resetPassword(email.trim());
      setNotice('Password reset email sent. Check your inbox.');
    } catch (e) {
      setError(friendly(e.code));
    }
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-20">
      <Seo
        title={mode === 'login' ? 'Sign in' : 'Create account'}
        description="Sign in to your PCC Mastery account."
        path="/login"
        noindex
      />

      <h1 className="font-display text-3xl font-bold mb-2">
        {buying ? 'Almost there' : mode === 'login' ? 'Sign in' : 'Create your account'}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
        {buying
          ? 'Create your account and we’ll take you straight to secure checkout.'
          : mode === 'login' ? 'Your progress and access live here.' : 'Free to start — no card needed.'}
      </p>

      <div className="space-y-3">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoComplete="email"
          className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-4 py-3"
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-4 py-3"
        />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-rose-500">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-500">{notice}</p>}

      <button onClick={submit} disabled={busy} className="btn-primary w-full mt-5 text-white font-bold rounded-full disabled:opacity-60">
        {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <div className="mt-6 flex flex-col gap-3 text-sm text-center">
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-orange-500 font-semibold">
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
        {mode === 'login' && (
          <button onClick={forgot} className="text-slate-500 hover:text-orange-500">Forgot your password?</button>
        )}
        <Link to="/" className="text-slate-500 hover:text-orange-500">← Back to home</Link>
      </div>
    </div>
  );
}
