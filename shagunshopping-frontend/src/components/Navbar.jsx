import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, LogOut, Shield, Package, UserRound, Menu, X } from 'lucide-react';
import { SHOP_NAME } from '../lib/config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/75 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-3 sm:gap-6">
        <Link to="/" className="font-display text-[24px] sm:text-[26px] font-black tracking-tight text-ink flex items-center gap-2.5">

          <span className="flex items-baseline">
            Shagun Shopping<span className="text-mulberry ml-[2px] text-2xl leading-none">.</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block" role="search">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products or brands"
              aria-label="Search products or brands"
              className="input rounded-full pl-10"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex sm:gap-2">
          <NavLink
            to="/about"
            className="hidden px-2 text-xs font-extrabold uppercase tracking-widest text-muted transition-colors hover:text-mulberry lg:inline-flex"
          >
            Our story
          </NavLink>
          <NavLink to="/shop" className="hidden px-2 text-xs font-extrabold uppercase tracking-widest text-muted transition-colors hover:text-mulberry sm:inline-flex">
            Shop All
          </NavLink>
          <Link
            to="/shop"
            aria-label="Search"
            className="rounded-full p-2.5 text-ink hover:text-mulberry md:hidden"
          >
            <Search size={20} />
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              aria-label="Admin panel"
              title="Admin panel"
              className="rounded-full p-2.5 text-ink hover:text-mulberry"
            >
              <Shield size={20} />
            </Link>
          )}

          {user && (
            <Link
              to="/orders"
              aria-label="My orders"
              title="My orders"
              className="rounded-full p-2.5 text-ink hover:text-mulberry"
            >
              <Package size={20} />
            </Link>
          )}

          {user && (
            <Link
              to="/account"
              aria-label="My account"
              title="My account"
              className="rounded-full p-2.5 text-ink hover:text-mulberry"
            >
              <UserRound size={20} />
            </Link>
          )}

          <Link to="/cart" aria-label="Shopping bag" className="relative rounded-full p-2.5 text-ink hover:text-mulberry">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mulberry px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden max-w-24 truncate text-sm font-bold sm:block">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="rounded-full p-2.5 text-ink hover:text-mulberry"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">
              Log in
            </Link>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Link to="/cart" aria-label="Shopping bag" className="relative rounded-full p-2.5 text-ink hover:text-mulberry">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mulberry px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            aria-label="Toggle menu"
            className="rounded-full p-2.5 text-ink hover:bg-blush hover:text-mulberry"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-line/70 bg-white/95 p-4 shadow-lg backdrop-blur-xl md:hidden">
          <form onSubmit={submitSearch} className="mb-5" role="search">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products or brands"
                className="input w-full rounded-2xl pl-10"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-4 px-2 pb-2">
            <Link to="/about" onClick={() => setMenuOpen(false)} className="text-sm font-extrabold uppercase tracking-widest text-ink hover:text-mulberry">Our story</Link>
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="text-sm font-extrabold uppercase tracking-widest text-ink hover:text-mulberry">Shop All</Link>
            {user && (
              <Link to="/orders" onClick={() => setMenuOpen(false)} className="text-sm font-extrabold uppercase tracking-widest text-ink hover:text-mulberry">My Orders</Link>
            )}
            {user ? (
              <>
                <Link to="/account" onClick={() => setMenuOpen(false)} className="text-sm font-extrabold uppercase tracking-widest text-ink hover:text-mulberry">My Account</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-sm font-extrabold uppercase tracking-widest text-mulberry hover:text-mulberry-deep">Log out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-extrabold uppercase tracking-widest text-mulberry hover:text-mulberry-deep">Log in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
