import { Minus, Plus } from 'lucide-react';

const QtyPicker = ({ value, onChange, max = 10 }) => (
  <div className="inline-flex items-center rounded-full border border-line bg-white">
    <button
      type="button"
      aria-label="Decrease quantity"
      onClick={() => onChange(Math.max(1, value - 1))}
      className="p-2.5 text-ink transition-colors hover:text-mulberry disabled:opacity-30"
      disabled={value <= 1}
    >
      <Minus size={14} />
    </button>
    <span className="w-8 text-center text-sm font-bold">{value}</span>
    <button
      type="button"
      aria-label="Increase quantity"
      onClick={() => onChange(Math.min(max, value + 1))}
      className="p-2.5 text-ink transition-colors hover:text-mulberry disabled:opacity-30"
      disabled={value >= max}
    >
      <Plus size={14} />
    </button>
  </div>
);

export default QtyPicker;
