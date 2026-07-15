import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-line bg-white pb-safe pt-1 md:hidden">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 ${
            isActive ? 'text-mulberry' : 'text-muted hover:text-ink'
          } active:scale-95 transition-all`
        }
      >
        <Home size={22} strokeWidth={2.5} />
        <span className="text-[10px] font-bold">Home</span>
      </NavLink>

      <NavLink
        to="/shop"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 ${
            isActive ? 'text-mulberry' : 'text-muted hover:text-ink'
          } active:scale-95 transition-all`
        }
      >
        <Search size={22} strokeWidth={2.5} />
        <span className="text-[10px] font-bold">Shop</span>
      </NavLink>

      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-1 p-2 ${
            isActive ? 'text-mulberry' : 'text-muted hover:text-ink'
          } active:scale-95 transition-all`
        }
      >
        <div className="relative">
          <ShoppingBag size={22} strokeWidth={2.5} />
          {count > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-mulberry px-1 text-[9px] font-bold text-white shadow-sm">
              {count}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">Cart</span>
      </NavLink>

      <NavLink
        to={user ? '/account' : '/login'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 ${
            isActive ? 'text-mulberry' : 'text-muted hover:text-ink'
          } active:scale-95 transition-all`
        }
      >
        <User size={22} strokeWidth={2.5} />
        <span className="text-[10px] font-bold">Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
