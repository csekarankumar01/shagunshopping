import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Banknote, Truck, ArrowRight, Sparkles, X } from 'lucide-react';
import api from '../lib/api';
import {
  getPromotionalBanners,
  getEditorialArticles,
  DEFAULT_BANNERS,
  DEFAULT_ARTICLES,
} from '../services/cms';
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
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    getPromotionalBanners().then((res) => {
      if (res && res.length) setBanners(res);
    });
    getEditorialArticles().then((res) => {
      if (res && res.length) setArticles(res);
    });
  }, []);

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

      {/* Dynamic Strapi CMS Promotional Drops */}
      {banners.length > 0 && (
        <section className="container-page pt-12 pb-4">
          <div className="grid gap-6 md:grid-cols-2">
            {banners.slice(0, 2).map((banner) => (
              <Link
                key={banner.id}
                to={banner.link || '/shop'}
                className="group relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
                <div className="relative z-10 flex h-full min-h-[180px] flex-col justify-end">
                  {banner.badge && (
                    <span className="mb-2.5 inline-flex items-center gap-1.5 self-start rounded-full bg-mulberry/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                      <Sparkles size={12} />
                      {banner.badge}
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="mt-1.5 text-sm text-porcelain/90 line-clamp-1">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300 transition-transform group-hover:translate-x-1">
                    Shop collection <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {featured.map((p) => (
              <div key={p._id} className="min-w-[80vw] snap-center sm:min-w-[300px] md:min-w-0 h-full flex flex-col">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Strapi CMS Editorial Articles */}
      {articles.length > 0 && (
        <section className="container-page pb-20">
          <div className="mb-10 text-center">
            <p className="eyebrow text-mulberry mb-2">Beauty & Skincare Journal</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
              Editorial Guides & Rituals
            </h2>
            <p className="mt-2 text-sm text-muted max-w-lg mx-auto">
              Expert beauty insights, seasonal regimens, and Ayurvedic rituals crafted by the Shagun editorial team.
            </p>
          </div>

          <div className={`grid gap-6 ${articles.length === 1 ? 'grid-cols-1' : articles.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {articles.map((article) => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="card group flex flex-col overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-porcelain">
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3.5 left-3.5 rounded-full bg-ink/80 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {article.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-muted mb-2.5">
                    <span className="truncate">{article.author}</span>
                    <span>•</span>
                    <span className="shrink-0">{article.readingTimeMinutes} min read</span>
                  </div>
                  <h3 className="font-display text-lg font-black leading-snug tracking-tight text-ink group-hover:text-mulberry transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="mt-auto pt-4 flex items-center text-xs font-bold text-mulberry gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Read full guide</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Article Reader Modal */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/75 backdrop-blur-md transition-opacity"
          onClick={() => setSelectedArticle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 text-ink hover:bg-white hover:text-mulberry shadow-md transition cursor-pointer"
              aria-label="Close article"
            >
              <X size={20} />
            </button>

            {/* Hero Image */}
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-porcelain">
              <img
                src={selectedArticle.coverImageUrl}
                alt={selectedArticle.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80';
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-6 rounded-full bg-mulberry px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                {selectedArticle.category}
              </span>
            </div>

            {/* Article Body */}
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <div className="flex items-center gap-3 text-xs font-semibold text-muted mb-3">
                <span>By {selectedArticle.author}</span>
                <span>•</span>
                <span>{selectedArticle.readingTimeMinutes} min read</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black text-ink tracking-tight leading-tight mb-4">
                {selectedArticle.title}
              </h2>

              <div className="p-4 rounded-2xl bg-porcelain/80 border-l-4 border-mulberry text-xs sm:text-sm text-ink/80 italic leading-relaxed mb-6">
                "{selectedArticle.summary}"
              </div>

              <div className="text-ink/90 leading-relaxed whitespace-pre-line text-sm">
                {selectedArticle.content}
              </div>

              {/* Footer Action Bar */}
              <div className="mt-8 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={selectedArticle.categoryLink || '/shop'}
                  onClick={() => setSelectedArticle(null)}
                  className="btn-primary text-xs px-6 py-3"
                >
                  Shop Recommended Collection <ArrowRight size={14} className="ml-1.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="btn-ghost text-xs"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
