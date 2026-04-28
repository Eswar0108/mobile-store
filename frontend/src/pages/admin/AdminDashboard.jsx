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

  const revenue = data?.revenue || {};
  const orders = data?.orders || {};

  return (
    <>
      <Helmet><title>Dashboard — Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Month Revenue" value={formatCurrency(revenue.month || 0)} icon="💰" sub="Last 30 days" />
          <KPICard label="Today's Revenue" value={formatCurrency(revenue.today || 0)} icon="📈" sub="Today" />
          <KPICard label="Month Orders" value={orders.month || 0} icon="📦" sub="Last 30 days" />
          <KPICard label="Pending Orders" value={orders.pending || 0} icon="⏳" />
          <KPICard label="Week Orders" value={orders.week || 0} icon="📱" sub="Last 7 days" />
          <KPICard label="Low Stock" value={data?.lowStockCount || 0} icon="⚠️" />
          <KPICard label="Pending Reviews" value={data?.pendingReviews || 0} icon="⭐" />
          <KPICard label="Open Returns" value={data?.openReturns || 0} icon="↩️" />
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
              {(data?.lowStockCount || 0) > 0 ? (
                <p className="text-sm text-amber-600 text-center py-4">⚠️ {data.lowStockCount} product(s) running low</p>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">All products stocked well ✓</p>
              )}
            </div>
            <Link to="/admin/inventory" className="block text-center text-xs text-primary-600 mt-3 hover:underline">Manage inventory →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
