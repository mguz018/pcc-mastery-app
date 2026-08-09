// Persistent practice progress, stored on-device. Kept in localStorage (like
// theme and the exam personal-best) so it works for free and signed-in users
// alike with no backend. Cross-device sync via Firestore is a future upgrade.
const KEY = 'pcc_progress';

const empty = () => ({
  answered: 0,
  correct: 0,
  byComp: {}, // { [competencyId]: { answered, correct } }
  byDomain: {}, // { [domain]: { answered, correct } } — for blueprint-weighted readiness
  missed: {}, // { [questionId]: true } — questions to re-drill, cleared once answered right
  bookmarks: {}, // { [questionId]: true } — user-flagged questions to revisit
  sessions: 0,
  streak: { current: 0, longest: 0, lastDay: null },
  updatedAt: null
});

function read() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    return p && typeof p === 'object' ? { ...empty(), ...p } : empty();
  } catch {
    return empty();
  }
}

// Optional hook the sync layer registers so every local change can be pushed to
// Firestore. Best-effort: sync failures never break local persistence.
let onWrite = null;
export function setWriteHook(fn) { onWrite = fn; }

function write(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
  if (onWrite) { try { onWrite(p); } catch { /* sync is best-effort */ } }
}

// Overwrite local storage WITHOUT firing the write hook — used to apply data
// pulled from the cloud so it doesn't immediately echo back.
export function replaceLocal(blob) {
  try { localStorage.setItem(KEY, JSON.stringify(blob)); } catch { /* ignore */ }
}

// Local calendar-day key, so streaks follow the user's own days.
const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

function bumpStreak(streak) {
  const s = streak || { current: 0, longest: 0, lastDay: null };
  const today = dayKey();
  if (s.lastDay === today) return s; // already practiced today
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const current = s.lastDay === yesterday ? s.current + 1 : 1;
  return { current, longest: Math.max(s.longest || 0, current), lastDay: today };
}

// answers: array of { id, competency, domain?, correct, answered? }
export function recordSession(answers) {
  if (!answers || !answers.length) return read();
  const p = read();
  if (!p.missed) p.missed = {};
  if (!p.byDomain) p.byDomain = {};
  for (const a of answers) {
    p.answered += 1;
    if (a.correct) p.correct += 1;
    const c = p.byComp[a.competency] || { answered: 0, correct: 0 };
    c.answered += 1;
    if (a.correct) c.correct += 1;
    p.byComp[a.competency] = c;

    // Domain-level tally (ethics / boundaries / competency) for the readiness score.
    if (a.domain) {
      const d = p.byDomain[a.domain] || { answered: 0, correct: 0 };
      d.answered += 1;
      if (a.correct) d.correct += 1;
      p.byDomain[a.domain] = d;
    }

    // Track the re-drill queue: add missed questions, clear ones now answered
    // right. Skip questions left unanswered (e.g. exam ran out of time).
    if (a.id != null && a.answered !== false) {
      if (a.correct) delete p.missed[a.id];
      else p.missed[a.id] = true;
    }
  }
  p.sessions += 1;
  p.streak = bumpStreak(p.streak);
  p.updatedAt = Date.now();
  write(p);
  return p;
}

export function getProgress() {
  return read();
}

export function hasProgress() {
  return read().answered > 0;
}

export function resetProgress() {
  // Write a fresh, timestamped blank so the reset syncs to the cloud too
  // (rather than a silent removeItem that the sync layer wouldn't see).
  const blank = empty();
  blank.updatedAt = Date.now();
  write(blank);
}

// Question ids the user has missed and not yet re-answered correctly.
export function getMissedIds() {
  return Object.keys(read().missed || {});
}

export function missedCount() {
  return Object.keys(read().missed || {}).length;
}

// Bookmarks — user-flagged questions to revisit. Toggled directly and persist
// until the user removes them (unlike the auto-managed re-drill queue).
export function toggleBookmark(id) {
  const p = read();
  if (!p.bookmarks) p.bookmarks = {};
  const key = String(id);
  const on = !p.bookmarks[key];
  if (on) p.bookmarks[key] = true; else delete p.bookmarks[key];
  p.updatedAt = Date.now();
  write(p);
  return on;
}

export function isBookmarked(id) {
  return !!(read().bookmarks || {})[String(id)];
}

export function getBookmarkedIds() {
  return Object.keys(read().bookmarks || {});
}

export function bookmarkCount() {
  return Object.keys(read().bookmarks || {}).length;
}

export function accuracy(stats) {
  return stats && stats.answered ? Math.round((100 * stats.correct) / stats.answered) : 0;
}

// Lowest-accuracy competency with at least `min` attempts (ties broken by fewer attempts).
export function weakestCompetency(min = 1) {
  const p = read();
  const entries = Object.entries(p.byComp).filter(([, s]) => s.answered >= min);
  if (!entries.length) return null;
  entries.sort((a, b) => {
    const accA = a[1].correct / a[1].answered;
    const accB = b[1].correct / b[1].answered;
    if (accA !== accB) return accA - accB;
    return a[1].answered - b[1].answered;
  });
  return Number(entries[0][0]);
}
