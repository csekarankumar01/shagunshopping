import { inr, discountPct } from '../lib/format';

const Price = ({ mrp, price, size = 'md' }) => {
  const pct = discountPct(mrp, price);
  const priceCls = size === 'lg' ? 'text-3xl' : 'text-lg';
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-extrabold text-ink ${priceCls}`}>{inr(price)}</span>
      {pct > 0 && (
        <>
          <s className="text-sm text-muted">{inr(mrp)}</s>
          <span className="rounded-full bg-sage-soft px-2 py-0.5 text-xs font-bold text-sage">
            {pct}% off
          </span>
        </>
      )}
    </div>
  );
};

export default Price;
