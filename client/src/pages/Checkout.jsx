import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../lib/format';
import {
  FREE_SHIPPING_ABOVE,
  FREE_SHIPPING_ABOVE_PREPAID,
  SHIPPING_FEE,
  COD_FEE,
  COD_MAX,
} from '../lib/config';
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
  const { user, applyUser } = useAuth();
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
  const [paymentMethod, setPaymentMethod] = useState(user?.preferredPayment === 'cod' ? 'cod' : 'razorpay');

  // These totals are display-only; the server recomputes everything from DB
  // prices when the order is placed (see server/src/utils/pricing.js).
  const codBlocked = subtotal > COD_MAX;
  const threshold = paymentMethod === 'cod' ? FREE_SHIPPING_ABOVE : FREE_SHIPPING_ABOVE_PREPAID;
  const shippingDisplay = subtotal >= threshold ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
  const payable = subtotal + shippingDisplay + codFee;
  const prepaidShipping = subtotal >= FREE_SHIPPING_ABOVE_PREPAID ? 0 : SHIPPING_FEE;
  const prepaidSaving = subtotal + shippingDisplay + COD_FEE - (subtotal + prepaidShipping);
  const isMeerut = /^2500\d{2}$/.test(address.pincode);

  // If the cart grows past the COD cap, fall back to online payment.
  useEffect(() => {
    if (codBlocked && paymentMethod === 'cod') setPaymentMethod('razorpay');
  }, [codBlocked, paymentMethod]);
  const [placing, setPlacing] = useState(false);
  const savedAddresses = user?.addresses || [];
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(true);

  const fillFrom = (a) => {
    setAddress({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode });
    setSelectedAddrId(a._id);
  };

  // Autofill the default saved address once
  useEffect(() => {
    if (savedAddresses.length && !selectedAddrId && !address.line1) {
      fillFrom(savedAddresses.find((a) => a.isDefault) || savedAddresses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onChange = (e) => {
    setSelectedAddrId(null);
    setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));
  };

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

      // quietly save the address for next time — if this call fails the
      // order itself is unaffected, so no await / no error toast
      if (saveAddress && !selectedAddrId) {
        api.post('/auth/addresses', { ...address, isDefault: savedAddresses.length === 0 })
          .then((res) => applyUser(res.data.user))
          .catch(() => {});
      }

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
              {savedAddresses.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="label">Deliver to a saved address</p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => fillFrom(a)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${selectedAddrId === a._id ? 'border-mulberry bg-blush/40' : 'border-line hover:border-mulberry'}`}
                      >
                        <span className="block font-bold">{a.fullName}{a.isDefault ? ' · Default' : ''}</span>
                        <span className="text-muted">{a.line1}, {a.city} — {a.pincode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              {user && !selectedAddrId && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted sm:col-span-2">
                  <input type="checkbox" className="accent-mulberry" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  Save this address to my account for faster checkout
                </label>
              )}
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
                  <span className="text-xs text-muted">
                    UPI, cards, netbanking and wallets via Razorpay · free shipping above {inr(FREE_SHIPPING_ABOVE_PREPAID)}
                  </span>
                </span>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 ${codBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${paymentMethod === 'cod' ? 'border-mulberry bg-blush/40' : 'border-line'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  disabled={codBlocked}
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-mulberry"
                />
                <span>
                  <span className="block text-sm font-bold">Cash on delivery</span>
                  <span className="text-xs text-muted">
                    {codBlocked
                      ? `Available up to ${inr(COD_MAX)} — please pay online for larger orders`
                      : `Pay when your order arrives${COD_FEE > 0 ? ` · ${inr(COD_FEE)} COD fee` : ''}`}
                  </span>
                </span>
              </label>
              {paymentMethod === 'cod' && prepaidSaving > 0 && (
                <p className="rounded-xl bg-sage-soft px-3 py-2 text-xs font-bold text-sage">
                  Pay online instead and save {inr(prepaidSaving)} on this order
                </p>
              )}
              {isMeerut && (
                <p className="rounded-xl bg-blush px-3 py-2 text-xs font-bold text-mulberry-deep">
                  Meerut address detected — we deliver in Meerut the same day!
                </p>
              )}
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
              <dd className="font-semibold">{shippingDisplay === 0 ? 'Free' : inr(shippingDisplay)}</dd>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">COD fee</dt>
                <dd className="font-semibold">{inr(codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold">{inr(payable)}</dd>
            </div>
          </dl>
          <button className="btn-primary mt-5 w-full" disabled={placing}>
            {placing
              ? 'Placing order…'
              : paymentMethod === 'cod'
                ? `Place order — ${inr(payable)}`
                : `Pay ${inr(payable)}`}
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
