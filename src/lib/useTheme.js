import { useEffect, useState } from 'react';

// Theme is the one thing worth persisting locally — it's a display preference,
// not account data, so it belongs on the device rather than in Firestore.
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch { /* private browsing */ }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
