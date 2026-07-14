import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2 } from 'lucide-react';
import Swatch from './Swatch';
import Price from './Price';
import RatingStars from './RatingStars';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
  const { addItem, items, setQty, removeItem } = useCart();
  const toast = useToast();
  const out = product.stock <= 0;
  
  const id = product._id || product.id;
  const cartItem = items.find(i => i.id === id);

  const add = (e) => {
    e.preventDefault();
    addItem(product, 1);
    toast('Added to bag');
  };

  const updateQty = (e, delta) => {
    e.preventDefault();
    if (!cartItem) return;
    const newQty = cartItem.qty + delta;
    if (newQty <= 0) {
      removeItem(id);
      toast('Removed from bag');
    } else {
      setQty(id, newQty);
    }
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
        {cartItem ? (
          <div className="mt-3 flex h-[42px] w-full items-center justify-between border border-line bg-white px-2">
            <button
              onClick={(e) => updateQty(e, -1)}
              className="flex h-8 w-8 items-center justify-center text-ink hover:bg-blush disabled:opacity-50"
            >
              {cartItem.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
            </button>
            <span className="text-xs font-bold text-ink">{cartItem.qty}</span>
            <button
              onClick={(e) => updateQty(e, 1)}
              disabled={cartItem.qty >= (product.stock || 10)}
              className="flex h-8 w-8 items-center justify-center text-ink hover:bg-blush disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={add}
            disabled={out}
            className="mt-3 w-full bg-mulberry py-3 text-[11px] font-extrabold uppercase tracking-widest text-white transition-all duration-200 hover:bg-mulberry-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {out ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
