import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '../lib/api';
import { BRANDS, CATEGORIES } from '../lib/config';
import ProductCard from '../components/ProductCard';
import { Spinner, Empty } from '../components/Spinner';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ brands: BRANDS, categories: CATEGORIES });
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    api
      .get('/products/filters')
      .then(({ data }) => {
        if (data.brands?.length) setFilters(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    api
      .get('/products', { params: { q, brand, category, sort, page, limit: 12 } })
      .then(({ data }) => setData(data))
      .catch(() => setData({ products: [], pages: 0, total: 0 }));
  }, [q, brand, category, sort, page]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const activeFilters = [
    q && { label: `"${q}"`, clear: () => update({ q: '' }) },
    brand && { label: brand, clear: () => update({ brand: '' }) },
    category && { label: category, clear: () => update({ category: '' }) },
  ].filter(Boolean);

  const FilterPanel = () => (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-5">Category</p>
        <div className="flex flex-wrap gap-3 lg:flex-col lg:items-start lg:gap-3">
          {filters.categories.map((c) => (
            <button
              key={c}
              onClick={() => update({ category: category === c ? '' : c })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                category === c
                  ? 'border-mulberry bg-blush text-mulberry'
                  : 'border-line bg-white text-muted hover:border-mulberry/40 hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow mb-5">Brand</p>
        <div className="flex max-h-80 flex-wrap gap-3 overflow-y-auto pr-1 lg:flex-col lg:items-start lg:gap-3">
          {filters.brands.map((b) => (
            <button
              key={b}
              onClick={() => update({ brand: brand === b ? '' : b })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                brand === b
                  ? 'border-mulberry bg-blush text-mulberry'
                  : 'border-line bg-white text-muted hover:border-mulberry/40 hover:text-ink'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="font-display mt-1 text-4xl font-semibold">
            {category || brand || 'All products'}
          </h1>
          {data && <p className="mt-1 text-sm text-muted">{data.total} products</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="btn-ghost btn-sm lg:hidden"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <label className="sr-only" htmlFor="sort">Sort products</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="input w-auto rounded-full py-2 text-xs font-bold"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button key={f.label} onClick={f.clear} className="chip hover:border-mulberry">
              {f.label} <X size={12} />
            </button>
          ))}
          <Link to="/shop" className="text-xs font-bold text-mulberry">Clear all</Link>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} card self-start p-6 lg:block`}>
          <FilterPanel />
        </aside>

        <div>
          {data === null ? (
            <Spinner label="Finding products" />
          ) : data.products.length === 0 ? (
            <Empty
              title="Nothing here yet"
              hint="Try a different search or clear the filters."
              action={<Link to="/shop" className="btn-primary btn-sm mt-2">Browse everything</Link>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
                {data.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {data.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    className="btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) })}
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold">
                    Page {data.page} of {data.pages}
                  </span>
                  <button
                    className="btn-ghost btn-sm"
                    disabled={page >= data.pages}
                    onClick={() => update({ page: String(page + 1) })}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
