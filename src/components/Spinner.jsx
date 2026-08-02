export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" role="status">
      <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{label}…</p>
    </div>
  );
}
