import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, BadgeCheck } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import Swatch from '../components/Swatch';
import Price from '../components/Price';
import RatingStars from '../components/RatingStars';
import QtyPicker from '../components/QtyPicker';
import { Spinner, Empty } from '../components/Spinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadProduct = () => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch((e) => setError(getErrorMessage(e)));
  };

  useEffect(() => {
    setProduct(null);
    setError('');
    setQty(1);
    setImgIdx(0);
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="container-page py-16">
        <Empty
          title="Product not found"
          hint={error}
          action={<Link to="/shop" className="btn-primary btn-sm mt-2">Back to shop</Link>}
        />
      </div>
    );
  }
  if (!product) return <Spinner label="Loading product" />;

  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;
  const maxQty = Math.min(10, product.stock);
  const alreadyReviewed = user && product.reviews.some((r) => r.user === user._id);

  const addToBag = () => {
    addItem(product, qty);
    toast('Added to bag');
  };
  const buyNow = () => {
    addItem(product, qty);
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, review);
      toast('Thanks for your review');
      setReview({ rating: 5, comment: '' });
      loadProduct();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const gallery = product.images.length > 0 ? product.images : [null];

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-xs font-semibold text-muted" aria-label="Breadcrumb">
        <Link to="/shop" className="hover:text-mulberry">Shop</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-mulberry">
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card aspect-square overflow-hidden">
            {gallery[imgIdx] ? (
              <img src={gallery[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Swatch product={product} />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                    i === imgIdx ? 'border-mulberry' : 'border-line'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link
            to={`/shop?brand=${encodeURIComponent(product.brand)}`}
            className="eyebrow hover:text-mulberry-deep"
          >
            {product.brand}
          </Link>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-tight">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            {product.size && (
              <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-mulberry-deep">{product.size}</span>
            )}
            {product.numReviews > 0 ? (
              <RatingStars rating={product.rating} count={product.numReviews} />
            ) : (
              <span className="text-xs text-muted">No reviews yet</span>
            )}
          </div>

          <div className="mt-5">
            <Price mrp={product.mrp} price={product.price} size="lg" />
            <p className="mt-1 text-xs text-muted">MRP inclusive of all taxes</p>
          </div>

          <p className="mt-3 text-sm font-bold">
            {out ? (
              <span className="text-muted">Out of stock</span>
            ) : low ? (
              <span className="text-gold">Only {product.stock} left</span>
            ) : (
              <span className="text-sage">In stock</span>
            )}
          </p>

          {!out && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QtyPicker value={qty} onChange={setQty} max={maxQty} />
              <button onClick={addToBag} className="btn-primary">
                <ShoppingBag size={16} /> Add to bag
              </button>
              <button onClick={buyNow} className="btn-ghost">
                Buy now
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-sage-soft px-4 py-3 text-xs font-semibold text-sage">
            <BadgeCheck size={16} />
            100% genuine — sourced from authorised distributors
          </div>

          {product.description && (
            <div className="mt-8">
              <p className="eyebrow mb-2">About this product</p>
              <p className="text-sm leading-relaxed text-muted">{product.description}</p>
            </div>
          )}

          {product.ingredients && (
            <div className="mt-6">
              <p className="eyebrow mb-2">Key ingredients</p>
              <p className="text-sm leading-relaxed text-muted">{product.ingredients}</p>
            </div>
          )}

          {product.howToUse && (
            <div className="mt-6">
              <p className="eyebrow mb-2">How to use</p>
              <p className="text-sm leading-relaxed text-muted">{product.howToUse}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-3xl font-semibold">Reviews</h2>

        {product.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Be the first to review this product.</p>
        ) : (
          <ul className="mt-6 space-y-5">
            {product.reviews.map((r) => (
              <li key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{r.name}</p>
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-1">
                  <RatingStars rating={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}

        {user ? (
          alreadyReviewed ? (
            <p className="mt-6 text-sm font-semibold text-sage">You've reviewed this product. Thank you!</p>
          ) : (
            <form onSubmit={submitReview} className="card mt-8 space-y-4 p-5">
              <p className="font-bold">Write a review</p>
              <div>
                <label className="label" htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  className="input w-32"
                  value={review.rating}
                  onChange={(e) => setReview((r) => ({ ...r, rating: Number(e.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="comment">Comment (optional)</label>
                <textarea
                  id="comment"
                  rows={3}
                  className="input"
                  placeholder="How did it work for you?"
                  value={review.comment}
                  onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                />
              </div>
              <button className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post review'}
              </button>
            </form>
          )
        ) : (
          <p className="mt-6 text-sm text-muted">
            <Link to={`/login?next=/product/${id}`} className="font-bold text-mulberry">Log in</Link>{' '}
            to write a review.
          </p>
        )}
      </section>
    </div>
  );
};

export default ProductDetail;
