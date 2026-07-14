import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Banknote, Truck, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { SHOP_NAME, BRANDS, CATEGORY_META, FREE_SHIPPING_ABOVE, SHOP_YEARS } from '../lib/config';
import BrandMarquee from '../components/BrandMarquee';
import ProductCard from '../components/ProductCard';
import { Spinner } from '../components/Spinner';

const TrustChip = ({ icon: Icon, children }) => (
  <span className="chip">
    <Icon size={14} className="text-sage" />
    {children}
  </span>
);

const Home = () => {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api
      .get('/products', { params: { featured: 'true', limit: 8 } })
      .then(({ data }) => setFeatured(data.products))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="eyebrow">Authorised multi-brand beauty store</p>
          <h1 className="font-display mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Genuine beauty,
            <br />
            <em className="text-mulberry">below MRP.</em>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Skincare, haircare and makeup from {BRANDS.length} trusted brands —
            the same counter you know, now delivered to your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-primary">
              Shop bestsellers <ArrowRight size={16} />
            </Link>
            <Link to="/shop?sort=newest" className="btn-ghost">
              New arrivals
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <TrustChip icon={BadgeCheck}>100% genuine products</TrustChip>
            <TrustChip icon={Banknote}>Cash on delivery</TrustChip>
            <TrustChip icon={Truck}>Free shipping over ₹{FREE_SHIPPING_ABOVE}</TrustChip>
          </div>
        </div>

        {/* Swatch composition -- looks great with zero product photos */}
        <div className="relative mx-auto h-80 w-full max-w-md sm:h-96" aria-hidden="true">
          <div
            className="absolute left-0 top-6 h-64 w-52 rotate-[-6deg] rounded-3xl shadow-xl shadow-blush sm:h-72 sm:w-60"
            style={{ background: CATEGORY_META.Makeup.gradient }}
          />
          <div
            className="absolute right-0 top-0 h-64 w-52 rotate-[5deg] rounded-3xl shadow-xl shadow-blush sm:h-72 sm:w-60"
            style={{ background: CATEGORY_META.Skincare.gradient }}
          />
          <div className="card absolute bottom-2 left-1/2 w-64 -translate-x-1/2 p-4 shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Pilgrim</p>
            <p className="text-sm font-semibold">10% Niacinamide Face Serum</p>
            <p className="mt-1 text-lg font-extrabold">
              ₹476 <s className="text-sm font-normal text-muted">₹595</s>{' '}
              <span className="text-xs font-bold text-sage">Save 20%</span>
            </p>
          </div>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-4 py-1.5 text-xs font-bold text-white shadow">
            Below MRP, always
          </span>
        </div>
      </section>

      <BrandMarquee />

      {/* Categories */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Shop by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(CATEGORY_META).map(([name, meta]) => (
            <Link
              key={name}
              to={`/shop?category=${encodeURIComponent(name)}`}
              className="group relative flex h-28 items-end overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              style={{ background: meta.gradient }}
            >
              <span className="font-display text-lg italic text-ink/80 transition-colors group-hover:text-ink">
                {name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Counter favourites</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-mulberry hover:text-mulberry-deep">
            View all →
          </Link>
        </div>
        {featured === null ? (
          <Spinner label="Loading favourites" />
        ) : featured.length === 0 ? (
          <p className="text-sm text-muted">
            No featured products yet — mark some as featured from the admin panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Story + trust */}
      <section className="border-y border-line bg-white">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">{SHOP_YEARS} years of trust</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight">
              From our counter <em className="text-mulberry">to your doorstep.</em>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              {SHOP_NAME} is run by the same family that has served customers
              at our Meerut counter for {SHOP_YEARS} successful years. We buy
              directly from authorised brand distributors, which is how every
              product here is 100% genuine and still priced below MRP. If
              anything ever feels off, call us — a real person picks up.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BadgeCheck, title: 'Genuine, guaranteed', text: 'Sourced only from authorised distributors.' },
              { icon: Banknote, title: 'Pay how you like', text: 'UPI, cards, netbanking or cash on delivery.' },
              { icon: Truck, title: 'Pan-India shipping', text: `Free delivery on orders over ₹${FREE_SHIPPING_ABOVE}.` },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-porcelain p-5">
                <Icon size={22} className="text-mulberry" />
                <p className="mt-3 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
