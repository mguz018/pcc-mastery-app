export default function ThemeToggle({ isDark, toggle }) {
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-11 h-11 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur hover:border-orange-500/50 transition-colors"
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
}
