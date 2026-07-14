export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const discountPct = (mrp, price) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const shortId = (id = '') => `#${id.slice(-6).toUpperCase()}`;

export const STATUS_META = {
  pending_payment: { label: 'Payment pending', cls: 'bg-blush text-mulberry-deep' },
  processing: { label: 'Processing', cls: 'bg-gold/15 text-gold' },
  shipped: { label: 'Shipped', cls: 'bg-sage-soft text-sage' },
  delivered: { label: 'Delivered', cls: 'bg-sage text-white' },
  cancelled: { label: 'Cancelled', cls: 'bg-line text-muted' },
};
