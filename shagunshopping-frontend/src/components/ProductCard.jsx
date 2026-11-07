import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2 } from 'lucide-react';
import Swatch from './Swatch';
import Price from './Price';
import RatingStars from './RatingStars';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { cacheSingleProduct } from '../lib/cache';

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
      state={{ product }}
      onClick={() => cacheSingleProduct(product)}
      className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-mulberry/10"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden">
        <Swatch product={product} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {out && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="truncate text-[11px] font-bold uppercase tracking-widest text-muted">
          {product.brand}
        </span>
        <h3 className="mt-1 h-10 text-sm font-semibold leading-snug text-ink line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-1 flex h-4 items-center">
          {product.numReviews > 0 && (
            <RatingStars rating={product.rating} count={product.numReviews} />
          )}
        </div>
        <div className="mt-auto flex flex-col pt-3">
          <div className="flex min-h-[28px] items-baseline">
            <Price mrp={product.mrp} price={product.price} />
          </div>
          <div className="mt-3">
            {cartItem ? (
              <div className="flex h-[42px] w-full items-center justify-between border border-line bg-white px-2">
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
                className="flex h-[42px] w-full items-center justify-center bg-mulberry px-3 text-[11px] font-extrabold uppercase tracking-widest text-white transition-all duration-200 hover:bg-mulberry-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {out ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
