import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';

function KPICard({ label, value, icon, sub }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    staleTime: 1000 * 30,
  });

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse h-24 bg-gray-50" />)}</div>;

  const kpis = data?.kpis || {};

  return (
    <>
      <Helmet><title>Dashboard — Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Revenue" value={formatCurrency(kpis.totalRevenue || 0)} icon="💰" sub="All time" />
          <KPICard label="Today's Revenue" value={formatCurrency(kpis.todayRevenue || 0)} icon="📈" sub="Today" />
          <KPICard label="Total Orders" value={kpis.totalOrders || 0} icon="📦" />
          <KPICard label="Pending Orders" value={kpis.pendingOrders || 0} icon="⏳" />
          <KPICard label="Total Products" value={kpis.totalProducts || 0} icon="📱" />
          <KPICard label="Low Stock" value={kpis.lowStockProducts || 0} icon="⚠️" />
          <KPICard label="Total Customers" value={kpis.totalCustomers || 0} icon="👥" />
          <KPICard label="Pending Returns" value={kpis.pendingReturns || 0} icon="↩️" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-2">
              {data?.recentOrders?.slice(0, 5).map((order) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 hover:bg-gray-50 px-2 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{order.user?.name} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(order.status)} text-xs`}>{order.status}</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </Link>
              ))}
              {!data?.recentOrders?.length && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
            </div>
            <Link to="/admin/orders" className="block text-center text-xs text-primary-600 mt-3 hover:underline">View all orders →</Link>
          </div>

          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Low Stock Alert</h2>
            <div className="space-y-2">
              {data?.lowStockItems?.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <p className="text-sm text-gray-900 truncate flex-1">{product.name}</p>
                  <span className="badge badge-yellow text-xs ml-2">{product.stockQuantity} left</span>
                </div>
              ))}
              {!data?.lowStockItems?.length && <p className="text-sm text-gray-400 text-center py-4">All products stocked well ✓</p>}
            </div>
            <Link to="/admin/inventory" className="block text-center text-xs text-primary-600 mt-3 hover:underline">Manage inventory →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
