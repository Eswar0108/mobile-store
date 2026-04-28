import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency, formatDateTime, getStatusColor, ORDER_STATUS_STEPS } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-order', id] }); toast.success('Status updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const assignMutation = useMutation({
    mutationFn: (agentId) => api.post(`/orders/admin/${id}/assign-agent`, { agentId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-order', id] }); toast.success('Agent assigned'); },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'DELIVERY_AGENT';
  const agentStatuses = ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'];
  const adminStatuses = ORDER_STATUS_STEPS.concat(['CANCELLED']);

  return (
    <>
      <Helmet><title>Order #{id.slice(-8).toUpperCase()} — Admin</title></Helmet>
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order #{id.slice(-8).toUpperCase()}</h1>
          <span className={`badge ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
        </div>

        {/* Status Update */}
        <div className="card flex items-center gap-3">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field text-sm flex-1">
            <option value="">Change status...</option>
            {(isAgent ? agentStatuses : adminStatuses).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button onClick={() => statusMutation.mutate()} disabled={!newStatus || statusMutation.isPending}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50">Update</button>
          <a href={`/api/orders/${id}/invoice`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4">📄 Invoice</a>
        </div>

        {/* Customer */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">Customer</h2>
          <p className="text-sm font-semibold">{order.user?.name}</p>
          <p className="text-sm text-gray-500">{order.user?.email}</p>
        </div>

        {/* Items */}
        <div className="card space-y-2">
          <h2 className="font-bold text-gray-900 mb-2">Items</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              {item.product?.images?.[0]?.url && (
                <img src={item.product.images[0].url} alt="" className="w-12 h-12 object-contain rounded bg-gray-50" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product?.name}</p>
                {item.colorVariant && <p className="text-xs text-gray-400">Color: {item.colorVariant}</p>}
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
          <div className="pt-2 space-y-1 text-sm">
            {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div>}
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
          </div>
        </div>

        {/* Shipping */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">Delivery Address</h2>
          {order.shippingAddress && (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {order.statusHistory?.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-3">Status Timeline</h2>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{h.status.replace(/_/g, ' ')}</p>
                    {h.comment && <p className="text-xs text-gray-500">{h.comment}</p>}
                    <p className="text-xs text-gray-400">{formatDateTime(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
