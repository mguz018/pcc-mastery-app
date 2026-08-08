// Turns on-device practice + mock-exam data into a single "are you ready?" score.
// Blueprint-weighted across the three exam content areas, blended with the best
// full mock-exam result, and scaled by how much has actually been practiced — so
// a handful of questions can't read as "exam ready."
import { getProgress } from './progress';

const KEY_EXAM_BEST = 'pcc_exam_best';

// Real ICF PCC exam blueprint weighting (matches the Exam Simulator).
export const BLUEPRINT = { ethics: 0.30, boundaries: 0.30, competency: 0.40 };
export const DOMAIN_LABEL = {
  ethics: 'Coaching Ethics',
  boundaries: 'Definition & Boundaries',
  competency: 'Competencies & Techniques'
};
const DOMAIN_ORDER = ['ethics', 'boundaries', 'competency'];

const PASS_LINE = 76; // ICF PCC passing is roughly 76%
const MIN_TO_SCORE = 20; // minimum practice questions before we show a score
const TARGET_PER_DOMAIN = 15; // per-area volume that counts as full confidence

function readExamBest() {
  try { return JSON.parse(localStorage.getItem(KEY_EXAM_BEST)) || null; } catch { return null; }
}

function bandFor(score) {
  if (score >= 85) return { label: 'Exam ready', tone: 'emerald' };
  if (score >= PASS_LINE) return { label: 'On track to pass', tone: 'emerald' };
  if (score >= 65) return { label: 'Almost there', tone: 'amber' };
  return { label: 'Keep building', tone: 'rose' };
}

export function computeReadiness(progress = getProgress(), examBest = readExamBest()) {
  const byDomain = progress.byDomain || {};
  const answered = progress.answered || 0;

  const domains = DOMAIN_ORDER.map((key) => {
    const s = byDomain[key] || { answered: 0, correct: 0 };
    const acc = s.answered ? Math.round((100 * s.correct) / s.answered) : null;
    const confidence = Math.min(1, s.answered / TARGET_PER_DOMAIN);
    return { key, label: DOMAIN_LABEL[key], answered: s.answered, acc, confidence, weight: BLUEPRINT[key] };
  });

  if (answered < MIN_TO_SCORE) {
    return { enoughData: false, answered, needed: MIN_TO_SCORE - answered, domains };
  }

  // Blueprint-weighted practice accuracy over areas that actually have data
  // (renormalized so an untested area doesn't unfairly drag the score down).
  const tested = domains.filter((d) => d.acc != null);
  let practiceScore;
  if (tested.length) {
    const wsum = tested.reduce((n, d) => n + d.weight, 0);
    practiceScore = Math.round(tested.reduce((n, d) => n + d.acc * (d.weight / wsum), 0));
  } else {
    // Fallback for progress recorded before domain tracking existed.
    practiceScore = Math.round((100 * (progress.correct || 0)) / answered);
  }

  // A full timed mock is the strongest single signal — blend it 50/50 when present.
  const hasExam = !!(examBest && typeof examBest.pct === 'number');
  const score = hasExam ? Math.round((practiceScore + examBest.pct) / 2) : practiceScore;

  let coverage = domains.reduce((n, d) => n + d.confidence * d.weight, 0); // 0..1
  if (hasExam) coverage = Math.min(1, coverage + 0.15);

  const weakest = [...tested].sort((a, b) => a.acc - b.acc)[0] || null;

  return {
    enoughData: true,
    score,
    band: bandFor(score),
    passLine: PASS_LINE,
    hasExam,
    coverage: Math.round(coverage * 100),
    domains,
    weakest,
    answered
  };
}
