import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { inr, formatDate, shortId, STATUS_META } from '../../lib/format';
import { Spinner } from '../../components/Spinner';

const StatCard = ({ label, value, accent }) => (
  <div className="card p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
    <p className={`mt-2 text-3xl font-extrabold ${accent || 'text-ink'}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/orders/stats/summary')
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ revenue: 0, totalOrders: 0, processing: 0, productsCount: 0, lowStock: 0, recent: [] }));
  }, []);

  if (!stats) return <Spinner label="Loading dashboard" />;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Revenue (paid)" value={inr(stats.revenue)} accent="text-mulberry" />
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard label="To pack" value={stats.processing} accent={stats.processing > 0 ? 'text-gold' : ''} />
        <StatCard label="Live products" value={stats.productsCount} />
        <StatCard label="Low stock (≤5)" value={stats.lowStock} accent={stats.lowStock > 0 ? 'text-mulberry' : 'text-sage'} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-bold text-mulberry">View all →</Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-muted">No orders yet. Share the store link to get your first one!</p>
        ) : (
          <ul className="card divide-y divide-line">
            {stats.recent.map((o) => {
              const meta = STATUS_META[o.status] || STATUS_META.processing;
              return (
                <li key={o._id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <span className="w-20 font-extrabold">{shortId(o._id)}</span>
                  <span className="flex-1 truncate text-muted">
                    {o.user?.name || 'Customer'} · {formatDate(o.createdAt)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                  <span className="w-20 text-right font-extrabold">{inr(o.totalPrice)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
