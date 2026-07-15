import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../lib/api';
import { inr, formatDate, shortId, STATUS_META } from '../../lib/format';
import { Spinner, Empty } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();

  const load = () => {
    api
      .get('/orders', { params: { status: status || undefined, page } })
      .then(({ data }) => setData(data))
      .catch(() => setData({ orders: [], pages: 0 }));
  };

  useEffect(load, [status, page]);

  const updateStatus = async (order, next) => {
    try {
      await api.put(`/orders/${order._id}/status`, { status: next });
      toast(`Order ${shortId(order._id)} marked ${STATUS_META[next].label.toLowerCase()}`);
      load();
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['', ...STATUS_OPTIONS, 'pending_payment'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`chip ${status === s ? 'border-mulberry text-mulberry' : ''}`}
          >
            {s ? STATUS_META[s].label : 'All'}
          </button>
        ))}
      </div>

      {!data ? (
        <Spinner label="Loading orders" />
      ) : data.orders.length === 0 ? (
        <Empty title="No orders here" hint="Orders matching this filter will appear in this list." />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td className="p-4">
                      <Link to={`/orders/${o._id}`} className="font-extrabold text-mulberry hover:text-mulberry-deep">
                        {shortId(o._id)}
                      </Link>
                      <Link to={`/orders/${o._id}/invoice`} className="ml-2 text-xs font-bold text-muted underline hover:text-mulberry">
                        invoice
                      </Link>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{o.user?.name || o.shippingAddress.fullName}</p>
                      <p className="text-xs text-muted">{o.shippingAddress.city}, {o.shippingAddress.state}</p>
                    </td>
                    <td className="p-4 text-muted">{o.orderItems.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="p-4 font-extrabold">{inr(o.totalPrice)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${o.isPaid ? 'bg-sage-soft text-sage' : 'bg-blush text-mulberry-deep'}`}>
                        {o.paymentMethod === 'cod' ? (o.isPaid ? 'COD · collected' : 'COD') : o.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="p-4">
                      {o.status === 'pending_payment' ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_META.pending_payment.cls}`}>
                          {STATUS_META.pending_payment.label}
                        </span>
                      ) : (
                        <select
                          aria-label={`Status for order ${shortId(o._id)}`}
                          className="input w-auto py-1.5 text-xs font-bold"
                          value={o.status}
                          onChange={(e) => updateStatus(o, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="text-sm font-bold">Page {data.page} of {data.pages}</span>
              <button className="btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;
