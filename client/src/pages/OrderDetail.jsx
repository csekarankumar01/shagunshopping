import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, FileText } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { inr, formatDate, shortId, STATUS_META } from '../lib/format';
import { Spinner, Empty } from '../components/Spinner';
import { useToast } from '../context/ToastContext';

const OrderDetail = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const justPlaced = params.get('placed') === '1';
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) {
    return (
      <div className="container-page py-16">
        <Empty title="Order not found" hint={error} action={<Link to="/orders" className="btn-primary btn-sm mt-2">My orders</Link>} />
      </div>
    );
  }
  if (!order) return <Spinner label="Loading order" />;

  const meta = STATUS_META[order.status] || STATUS_META.processing;
  const canCancel = ['pending_payment', 'processing'].includes(order.status);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data.order);
      toast('Order cancelled');
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-10">
      {justPlaced && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-sage px-5 py-4 text-white">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">Order placed — thank you!</p>
            <p className="text-sm text-white/85">
              {order.paymentMethod === 'cod'
                ? 'Pay in cash when your order arrives.'
                : 'Your payment was verified successfully.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Order {shortId(order._id)}</h1>
            <Link to={`/orders/${order._id}/invoice`} className="btn-ghost btn-sm mt-3 inline-flex"><FileText size={14} /> Invoice</Link>
          <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
      </div>

      {order.trackingUrl && order.status === 'shipped' && (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 inline-flex"
        >
          Track your parcel
        </a>
      )}

      <section className="card mt-6 divide-y divide-line">
        {order.orderItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-muted">{item.brand} · Qty {item.qty}</p>
            </div>
            <p className="font-extrabold">{inr(item.price * item.qty)}</p>
          </div>
        ))}
        <div className="space-y-1.5 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Items</span>
            <span className="font-semibold">{inr(order.itemsPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span className="font-semibold">{order.shippingPrice === 0 ? 'Free' : inr(order.shippingPrice)}</span>
          </div>
          {order.codFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">COD fee</span>
              <span className="font-semibold">{inr(order.codFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-base">
            <span className="font-bold">Total</span>
            <span className="font-extrabold">{inr(order.totalPrice)}</span>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="card p-4 text-sm">
          <p className="eyebrow mb-2">Deliver to</p>
          <p className="font-bold">{order.shippingAddress.fullName}</p>
          <p className="text-muted">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            <br />
            {order.shippingAddress.phone}
          </p>
        </section>
        <section className="card p-4 text-sm">
          <p className="eyebrow mb-2">Payment</p>
          <p className="font-bold">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online (Razorpay)'}</p>
          <p className="text-muted">
            {order.isPaid ? `Paid on ${formatDate(order.paidAt)}` : 'Not paid yet'}
          </p>
        </section>
      </div>

      {canCancel && (
        <button onClick={cancel} disabled={cancelling} className="btn-ghost btn-sm mt-6">
          {cancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  );
};

export default OrderDetail;
