import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, EyeOff } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { inr } from '../../lib/format';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

const AdminProducts = () => {
  const [products, setProducts] = useState(null);
  const toast = useToast();

  const load = () => {
    api
      .get('/products/admin/all')
      .then(({ data }) => setProducts(data.products))
      .catch(() => setProducts([]));
  };

  useEffect(load, []);

  const hide = async (p) => {
    if (!window.confirm(`Hide "${p.name}" from the store?`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast('Product hidden');
      load();
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  if (!products) return <Spinner label="Loading products" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">{products.length} products</p>
        <Link to="/admin/products/new" className="btn-primary btn-sm">
          <Plus size={14} /> Add product
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p._id} className={!p.isActive ? 'opacity-50' : ''}>
                <td className="p-4">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted">{p.brand}{p.featured ? ' · Featured' : ''}</p>
                </td>
                <td className="p-4 text-muted">{p.category}</td>
                <td className="p-4">
                  <span className="font-bold">{inr(p.price)}</span>{' '}
                  <s className="text-xs text-muted">{inr(p.mrp)}</s>
                </td>
                <td className={`p-4 font-bold ${p.stock <= 5 ? 'text-mulberry' : ''}`}>{p.stock}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.isActive ? 'bg-sage-soft text-sage' : 'bg-line text-muted'}`}>
                    {p.isActive ? 'Live' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/admin/products/${p._id}/edit`}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-full p-2 text-muted hover:text-mulberry"
                    >
                      <Pencil size={16} />
                    </Link>
                    {p.isActive && (
                      <button
                        onClick={() => hide(p)}
                        aria-label={`Hide ${p.name}`}
                        className="rounded-full p-2 text-muted hover:text-mulberry"
                      >
                        <EyeOff size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
