import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

const AdminLayout = () => (
  <div className="container-page py-10">
    <p className="eyebrow">Store manager</p>
    <h1 className="font-display mt-1 text-4xl font-semibold">Admin panel</h1>

    <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-px" aria-label="Admin sections">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              isActive
                ? 'border-mulberry text-mulberry'
                : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          <Icon size={16} /> {label}
        </NavLink>
      ))}
    </nav>

    <div className="pt-8">
      <Outlet />
    </div>
  </div>
);

export default AdminLayout;
