import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => api.get(`/orders/admin/all?page=${page}&limit=20${status ? `&status=${status}` : ''}`).then((r) => r.data),
  });

  return (
    <>
      <Helmet><title>Orders — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <a href="/api/orders/admin/export?format=csv" className="btn-secondary text-sm py-1.5">⬇ Export CSV</a>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStatus('')} className={`text-xs px-3 py-1.5 rounded-lg border ${!status ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${status === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="card animate-pulse h-40" />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Order</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Customer</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Amount</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Payment</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="p-3">
                      <p className="text-gray-900 font-medium">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="p-3 text-gray-600 text-xs">{formatDate(order.createdAt)}</td>
                    <td className="p-3 font-semibold">{formatCurrency(order.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`badge text-xs ${order.paymentMethod === 'COD' ? 'badge-yellow' : 'badge-blue'}`}>{order.paymentMethod}</span>
                    </td>
                    <td className="p-3">
                      <span className={`badge ${getStatusColor(order.status)} text-xs`}>{order.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="p-3">
                      <Link to={`/admin/orders/${order.id}`} className="text-xs text-primary-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">←</button>
                <span className="text-sm text-gray-600 py-1 px-2">Page {page} of {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">→</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
