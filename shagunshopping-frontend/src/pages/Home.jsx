import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Banknote, Truck, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import {
  getCachedData,
  setCachedData,
  fetchSWR,
  cacheSingleProduct,
  INITIAL_FEATURED_PRODUCTS,
} from '../lib/cache';
import { SHOP_NAME, BRANDS, FREE_SHIPPING_ABOVE, SHOP_YEARS } from '../lib/config';
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
  // Initialize synchronously with cached products or curated instant snapshot (0ms)
  const [featured, setFeatured] = useState(() => {
    const cached = getCachedData('products:featured_home');
    return cached?.products || INITIAL_FEATURED_PRODUCTS;
  });

  useEffect(() => {
    fetchSWR(
      '/products',
      { featured: 'true', limit: 8 },
      {
        onData: (data) => {
          if (data?.products?.length) {
            setFeatured(data.products);
            setCachedData('products:featured_home', data);
            data.products.forEach(cacheSingleProduct);
          }
        },
      }
    ).catch(() => {
      // If error or offline, already showing cached/instant products
    });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden bg-ink text-white flex items-center">
        <img
          src="/shagun_storefront.jpg"
          alt="Shagun Storefront"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-ink/85 via-ink/35 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="container-page relative z-10">
          <p className="eyebrow text-porcelain mb-4">India's leading MULTI-BRAND store</p>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-[90px]">
            Unleash your
            <br />
            <span className="text-gradient">boldest</span> self.
          </h1>
          <div className="mt-10">
            <Link to="/shop" className="btn-primary text-base px-10 py-4">
              Shop bestsellers <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <BrandMarquee />

      {/* Featured products */}
      <section className="container-page pt-14 pb-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">Trending Now</h2>
          <Link to="/shop" className="mt-3 inline-block text-xs font-extrabold uppercase tracking-widest text-mulberry hover:text-mulberry-deep">
            View all →
          </Link>
        </div>
        {featured === null ? (
          <div className="flex min-h-[380px] w-full items-center justify-center">
            <Spinner label="Loading favourites" />
          </div>
        ) : featured.length === 0 ? (
          <div className="flex min-h-[380px] w-full items-center justify-center">
            <p className="text-sm text-muted">
              No featured products yet — mark some as featured from the admin panel.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <div key={p._id} className="min-w-[80vw] snap-center sm:min-w-[300px] md:min-w-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Story + trust */}
      <section className="border-t border-line bg-white">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">{SHOP_YEARS} years of trust</p>
            <h2 className="font-display mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
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
              { icon: Truck, title: 'NCR Delivery', text: `Free delivery on orders over ₹${FREE_SHIPPING_ABOVE}.` },
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
