export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-mulberry" />
    <span className="text-sm font-semibold">{label}…</span>
  </div>
);

export const Empty = ({ title, hint, action }) => (
  <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
    <p className="font-display text-2xl italic text-ink">{title}</p>
    {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
    {action}
  </div>
);
