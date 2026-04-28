import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency, formatDateTime, getStatusColor, ORDER_STATUS_STEPS } from '../../lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const stepIdx = ORDER_STATUS_STEPS.indexOf(order.status);

  return (
    <>
      <Helmet><title>Order #{id.slice(-8).toUpperCase()} — MobileStore</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <span className={`badge ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
        </div>

        {/* Progress */}
        {stepIdx >= 0 && (
          <div className="card">
            <div className="flex items-center justify-between overflow-x-auto gap-1">
              {ORDER_STATUS_STEPS.map((s, idx) => (
                <div key={s} className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${idx <= stepIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {idx < stepIdx ? '✓' : idx + 1}
                  </div>
                  <p className="text-xs text-center text-gray-500 truncate w-full px-1">{s.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-900">Items</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product?.images?.[0]?.url && (
                <img src={item.product.images[0].url} alt={item.product.name} className="w-14 h-14 object-contain rounded-lg bg-gray-50" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.product?.name}</p>
                {item.colorVariant && <p className="text-xs text-gray-400">Color: {item.colorVariant}</p>}
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
              </div>
              {order.status === 'DELIVERED' && (
                <Link to={`/orders/${order.id}/return?itemId=${item.id}`} className="text-xs text-primary-600 hover:underline ml-2">Return</Link>
              )}
            </div>
          ))}
        </div>

        {/* Payment & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-2">Payment Details</h2>
            <p className="text-sm text-gray-600">Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)'}</p>
            {order.discountAmount > 0 && <p className="text-sm text-green-600">Discount: -{formatCurrency(order.discountAmount)}</p>}
            {order.couponCode && <p className="text-sm text-gray-500">Coupon: {order.couponCode}</p>}
            <p className="text-sm font-bold text-gray-900 mt-2">Total: {formatCurrency(order.totalAmount)}</p>
          </div>
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
        </div>

        {/* Invoice */}
        <div className="flex gap-3">
          <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4">
            📄 Download Invoice
          </a>
          {order.status === 'DELIVERED' && (
            <Link to={`/orders/${order.id}/return`} className="btn-secondary text-sm py-2 px-4">↩️ Request Return</Link>
          )}
        </div>
      </div>
    </>
  );
}
