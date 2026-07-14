import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, count }) => (
  <div className="flex items-center gap-1" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= Math.round(rating) ? 'fill-gold text-gold' : 'text-line'}
        />
      ))}
    </div>
    {count !== undefined && (
      <span className="text-xs text-muted">({count})</span>
    )}
  </div>
);

export default RatingStars;
