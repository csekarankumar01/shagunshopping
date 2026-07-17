import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/format';
import { FREE_SHIPPING_ABOVE_PREPAID, CATEGORY_META } from '../lib/config';
import QtyPicker from '../components/QtyPicker';
import { Empty } from '../components/Spinner';

const Thumb = ({ item }) => {
  if (item.image) {
    return <img src={item.image} alt="" className="h-full w-full object-cover" />;
  }
  const meta = CATEGORY_META[item.category] || CATEGORY_META.Skincare;
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: meta.gradient }}>
      <span className="font-display text-xs italic text-ink/60">{item.brand}</span>
    </div>
  );
};

const Cart = () => {
  const { items, setQty, removeItem, subtotal, savings, shipping, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <Empty
          title="Your bag is empty"
          hint="Everything at the counter is priced below MRP — go take a look."
          action={<Link to="/shop" className="btn-primary mt-2">Start shopping</Link>}
        />
      </div>
    );
  }

  const toFreeShipping = FREE_SHIPPING_ABOVE_PREPAID - subtotal;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold">Your bag</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card flex gap-4 p-4">
              <Link to={`/product/${item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                <Thumb item={item} />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{item.brand}</p>
                    <Link to={`/product/${item.id}`} className="text-sm font-semibold hover:text-mulberry">
                      {item.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-muted hover:text-mulberry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QtyPicker
                    value={item.qty}
                    onChange={(q) => setQty(item.id, q)}
                    max={Math.min(10, item.stock ?? 10)}
                  />
                  <p className="text-sm font-extrabold">{inr(item.price * item.qty)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-5">
          <p className="font-bold">Order summary</p>
          <dl className="mt-4 space-y-2 text-sm">
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">MRP total</dt>
                <dd className="text-muted line-through">{inr(subtotal + savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold">{inr(subtotal)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-sage">
                <dt>You save vs MRP</dt>
                <dd className="font-bold">− {inr(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-semibold">{shipping === 0 ? 'Free' : inr(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold">{inr(total)}</dd>
            </div>
          </dl>
          {toFreeShipping > 0 && (
            <p className="mt-3 rounded-xl bg-blush px-3 py-2 text-xs font-semibold text-mulberry-deep">
              Add {inr(toFreeShipping)} more for free shipping on online payment
            </p>
          )}
          <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full">
            Proceed to checkout
          </button>
          <Link to="/shop" className="mt-3 block text-center text-xs font-bold text-mulberry">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
