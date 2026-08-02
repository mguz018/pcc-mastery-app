// Lazily loaded so the ~340KB question bank never blocks the landing page.
let cache = null;

export async function loadQuestions() {
  if (cache) return cache;
  const mod = await import('../data/questions.json');
  cache = mod.default;
  return cache;
}

export const COMPETENCIES = {
  1: 'Demonstrates Ethical Practice',
  2: 'Embodies a Coaching Mindset',
  3: 'Establishes & Maintains Agreements',
  4: 'Cultivates Trust & Safety',
  5: 'Maintains Presence',
  6: 'Listens Actively',
  7: 'Evokes Awareness',
  8: 'Facilitates Client Growth'
};

// URL-friendly slugs so /practice/ethical-practice beats /practice?c=1
export const COMPETENCY_SLUGS = {
  'ethical-practice': 1,
  'coaching-mindset': 2,
  'agreements': 3,
  'trust-and-safety': 4,
  'presence': 5,
  'active-listening': 6,
  'evokes-awareness': 7,
  'client-growth': 8
};

export const slugFor = (id) =>
  Object.keys(COMPETENCY_SLUGS).find((s) => COMPETENCY_SLUGS[s] === id);

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
