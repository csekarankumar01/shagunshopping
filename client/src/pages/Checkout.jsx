import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../lib/format';
import { Empty } from '../components/Spinner';

/** Load Razorpay's checkout script once. */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Field = ({ label, name, value, onChange, ...rest }) => (
  <div>
    <label className="label" htmlFor={name}>{label}</label>
    <input id={name} name={name} value={value} onChange={onChange} className="input" {...rest} />
  </div>
);

const Checkout = () => {
  const { items, subtotal, savings, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <Empty
          title="Nothing to check out"
          hint="Your bag is empty."
          action={<Link to="/shop" className="btn-primary mt-2">Browse products</Link>}
        />
      </div>
    );
  }

  const onChange = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));

  const openRazorpay = (order, rzp) =>
    new Promise((resolve) => {
      const checkout = new window.Razorpay({
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency,
        name: rzp.name,
        description: `Order ${order._id.slice(-6).toUpperCase()}`,
        order_id: rzp.orderId,
        prefill: {
          name: address.fullName,
          email: user?.email || '',
          contact: address.phone,
        },
        theme: { color: '#8a2d52' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve({ ok: true });
          } catch (err) {
            resolve({ ok: false, message: getErrorMessage(err) });
          }
        },
        modal: {
          ondismiss: () => resolve({ ok: false, dismissed: true }),
        },
      });
      checkout.open();
    });

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ product: i.id, qty: i.qty })),
        shippingAddress: address,
        paymentMethod,
      };
      const { data } = await api.post('/orders', payload);

      if (paymentMethod === 'cod') {
        clearCart();
        navigate(`/orders/${data.order._id}?placed=1`);
        return;
      }

      // Razorpay flow
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast('Could not load the payment window. Check your connection.', 'error');
        return;
      }
      const result = await openRazorpay(data.order, data.razorpay);
      if (result.ok) {
        clearCart();
        navigate(`/orders/${data.order._id}?placed=1`);
      } else if (result.dismissed) {
        toast('Payment cancelled. Your order is saved under My Orders.', 'error');
        navigate(`/orders/${data.order._id}`);
      } else {
        toast(result.message || 'Payment verification failed', 'error');
      }
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="card p-5">
            <p className="font-bold">Delivery address</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" value={address.fullName} onChange={onChange} required autoComplete="name" />
              <Field label="Phone" name="phone" value={address.phone} onChange={onChange} required inputMode="numeric" pattern="[0-9]{10}" title="10-digit mobile number" autoComplete="tel" />
              <div className="sm:col-span-2">
                <Field label="Address line 1" name="line1" value={address.line1} onChange={onChange} required autoComplete="address-line1" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2 (optional)" name="line2" value={address.line2} onChange={onChange} autoComplete="address-line2" />
              </div>
              <Field label="City" name="city" value={address.city} onChange={onChange} required autoComplete="address-level2" />
              <Field label="State" name="state" value={address.state} onChange={onChange} required autoComplete="address-level1" />
              <Field label="PIN code" name="pincode" value={address.pincode} onChange={onChange} required inputMode="numeric" pattern="[0-9]{6}" title="6-digit PIN code" autoComplete="postal-code" />
            </div>
          </section>

          <section className="card p-5">
            <p className="font-bold">Payment method</p>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === 'razorpay' ? 'border-mulberry bg-blush/40' : 'border-line'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 accent-mulberry"
                />
                <span>
                  <span className="block text-sm font-bold">Pay online</span>
                  <span className="text-xs text-muted">UPI, cards, netbanking and wallets via Razorpay</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === 'cod' ? 'border-mulberry bg-blush/40' : 'border-line'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-mulberry"
                />
                <span>
                  <span className="block text-sm font-bold">Cash on delivery</span>
                  <span className="text-xs text-muted">Pay when your order arrives</span>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="card h-fit p-5">
          <p className="font-bold">Order summary</p>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted">
                  {i.name} <span className="font-bold text-ink">× {i.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
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
          <button className="btn-primary mt-5 w-full" disabled={placing}>
            {placing
              ? 'Placing order…'
              : paymentMethod === 'cod'
                ? `Place order — ${inr(total)}`
                : `Pay ${inr(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">
            The final amount is verified on our server before payment. All sales
            are final — for any inconvenience, call us and we'll sort it out.
          </p>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
