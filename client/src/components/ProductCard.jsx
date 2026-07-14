import { Link } from 'react-router-dom';
import Swatch from './Swatch';
import Price from './Price';
import RatingStars from './RatingStars';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const toast = useToast();
  const out = product.stock <= 0;

  const add = (e) => {
    e.preventDefault();
    addItem(product, 1);
    toast('Added to bag');
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-mulberry/10"
    >
      <div className="relative aspect-square overflow-hidden">
        <Swatch product={product} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {out && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {product.brand}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        {product.numReviews > 0 && (
          <RatingStars rating={product.rating} count={product.numReviews} />
        )}
        <div className="mt-auto pt-2">
          <Price mrp={product.mrp} price={product.price} />
        </div>
        <button
          onClick={add}
          disabled={out}
          className="mt-3 w-full rounded-lg bg-mulberry py-3 text-[11px] font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-mulberry-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {out ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
