import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { inr, formatDate, shortId, STATUS_META } from '../lib/format';
import { Spinner, Empty } from '../components/Spinner';

const Orders = () => {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) return <Spinner label="Loading your orders" />;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8">
          <Empty
            title="No orders yet"
            hint="Your first order will show up here."
            action={<Link to="/shop" className="btn-primary mt-2">Start shopping</Link>}
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => {
            const meta = STATUS_META[o.status] || STATUS_META.processing;
            return (
              <li key={o._id}>
                <Link to={`/orders/${o._id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-40">
                    <p className="text-sm font-extrabold">{shortId(o._id)}</p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <p className="flex-1 truncate text-sm text-muted">
                    {o.orderItems.map((i) => i.name).join(', ')}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <p className="w-24 text-right text-sm font-extrabold">{inr(o.totalPrice)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Orders;
