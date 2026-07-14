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
      <section className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden bg-ink text-white flex items-center">
        <img
          src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=2000"
          alt="Campaign makeup"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="container-page relative z-10">
          <p className="eyebrow text-porcelain mb-4">India's leading makeup brand</p>
          <h1 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-[100px]">
            Unleash your
            <br />
            <span className="text-mulberry">boldest</span> self.
          </h1>
          <div className="mt-10">
            <Link to="/shop" className="btn-primary text-base px-10 py-4">
              Shop bestsellers <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <BrandMarquee />

      {/* Categories */}
      <section className="container-page py-16">
        <h2 className="font-display text-center text-4xl font-black uppercase tracking-tight mb-10">Shop by category</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(CATEGORY_META).map(([name, meta]) => (
            <Link
              key={name}
              to={`/shop?category=${encodeURIComponent(name)}`}
              className="group flex flex-col items-center gap-4 transition-transform hover:-translate-y-1"
            >
              <div
                className="flex w-32 h-32 md:w-36 md:h-36 items-center justify-center rounded-full shadow-lg border border-line"
                style={{ background: meta.gradient }}
              >
              </div>
              <span className="font-display text-sm font-black uppercase tracking-widest text-ink text-center group-hover:text-mulberry transition-colors">
                {name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page pb-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight">Trending Now</h2>
          <Link to="/shop" className="mt-3 inline-block text-xs font-extrabold uppercase tracking-widest text-mulberry hover:text-mulberry-deep">
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
            <h2 className="font-display mt-3 text-5xl font-black uppercase tracking-tight leading-[0.95]">
              From our store <br /><span className="text-mulberry">to your door.</span>
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
