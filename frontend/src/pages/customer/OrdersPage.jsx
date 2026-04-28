import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  return (
    <>
      <Helmet><title>My Orders — MobileStore</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-24 bg-gray-50" />
            ))}
          </div>
        ) : !data?.orders?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500 mb-4">No orders yet</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="card block hover:border-primary-200 border border-transparent transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Order #{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-700 mt-1">{order.items?.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(order.status)} text-xs`}>{order.status.replace('_', ' ')}</span>
                    <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-400">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online'}</p>
                  </div>
                </div>
                {order.items?.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 mt-2">
                    {item.product?.primaryImage && (
                      <img src={item.product.primaryImage} alt={item.product.name} className="w-8 h-8 object-contain rounded" />
                    )}
                    <p className="text-xs text-gray-600 truncate">{item.product?.name}</p>
                  </div>
                ))}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
