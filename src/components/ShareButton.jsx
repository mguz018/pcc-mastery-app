import { useState } from 'react';

// Word-of-mouth hook. Uses the native share sheet on mobile (where ~92% of
// users are) and falls back to copying the link on desktop.
export default function ShareButton({ score, className = '' }) {
  const [copied, setCopied] = useState(false);
  const url = 'https://pccmastery.com';
  const text =
    typeof score === 'number'
      ? `I'm at ${score}% readiness for the ICF PCC exam with PCC Mastery. Practice the real BEST/WORST format:`
      : 'Prepping for the ICF PCC exam? PCC Mastery has 520 questions in the real BEST/WORST format:';

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PCC Mastery', text, url });
        return;
      } catch {
        /* user cancelled the share sheet — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — nothing more we can do */
    }
  };

  return (
    <button
      onClick={share}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/15 font-bold text-sm px-5 py-3 hover:border-orange-500 transition-colors ${className}`}
    >
      <span aria-hidden="true">{copied ? '✓' : '↗'}</span> {copied ? 'Copied link' : 'Share'}
    </button>
  );
}
