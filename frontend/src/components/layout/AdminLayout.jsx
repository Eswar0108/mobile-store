import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true, roles: ['ADMIN', 'SALESPERSON', 'DELIVERY_AGENT'] },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈', roles: ['ADMIN', 'SALESPERSON'] },
  { path: '/admin/orders', label: 'Orders', icon: '📦', roles: ['ADMIN', 'DELIVERY_AGENT'] },
  { path: '/admin/products', label: 'Products', icon: '📱', roles: ['ADMIN'] },
  { path: '/admin/inventory', label: 'Inventory', icon: '🏪', roles: ['ADMIN'] },
  { path: '/admin/coupons', label: 'Coupons', icon: '🏷️', roles: ['ADMIN'] },
  { path: '/admin/banners', label: 'Banners', icon: '🖼️', roles: ['ADMIN'] },
  { path: '/admin/reviews', label: 'Reviews', icon: '⭐', roles: ['ADMIN'] },
  { path: '/admin/returns', label: 'Returns', icon: '↩️', roles: ['ADMIN'] },
  { path: '/admin/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
  { path: '/admin/help', label: 'Help Centre', icon: '❓', roles: ['ADMIN'] },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍', roles: ['ADMIN'] },
];

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out.');
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">M</span>
            </div>
            <div>
              <p className="font-bold text-sm">MobileStore</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2 truncate">{user?.email}</div>
          <div className="flex gap-2">
            <NavLink to="/" className="text-xs text-gray-400 hover:text-white">← Store</NavLink>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 ml-auto">Sign Out</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
