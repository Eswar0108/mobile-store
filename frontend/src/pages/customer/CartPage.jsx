import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const coupon = useCartStore((s) => s.coupon);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const GST_RATE = 0.18;

  const subtotal = getSubtotal();
  const gst = Math.round(subtotal * GST_RATE);
  const total = getTotal();

  const couponMutation = useMutation({
    mutationFn: (code) => api.post('/coupons/validate', { code, orderAmount: subtotal }),
    onSuccess: ({ data }) => {
      setCoupon(data.coupon, data.discountAmount);
      toast.success(`Coupon applied! You save ${formatCurrency(data.discountAmount)}`);
      setCouponCode('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid coupon'),
  });

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Helmet><title>Cart — MobileStore</title></Helmet>
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some phones to get started!</p>
        <Link to="/products" className="btn-primary">Browse Phones</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Cart ({items.length}) — MobileStore</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Items */}
          <div className="flex-1 space-y-3">
            {items.map((item) => (
              <div key={item.id + item.colorVariant} className="card flex items-center gap-4">
                <Link to={`/products/${item.slug || '#'}`}>
                  <img src={item.primaryImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f3f4f6' width='300' height='300'/%3E%3C/svg%3E"} alt={item.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg bg-gray-50 flex-shrink-0" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                  {item.colorVariant && <p className="text-xs text-gray-400">Color: {item.colorVariant}</p>}
                  <p className="text-sm font-bold text-primary-600 mt-1">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => { if (item.quantity === 1) removeItem(item.id); else updateQuantity(item.id, item.quantity - 1); }}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">−</button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
                  </div>
                  <p className="text-sm font-bold text-gray-900 w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 ml-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="card space-y-4 sticky top-20">
              <h2 className="font-bold text-gray-900">Order Summary</h2>

              {/* Coupon */}
              {coupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-700">{coupon.code} applied ✓</p>
                    <p className="text-xs text-green-600">-{formatCurrency(discountAmount)} saved</p>
                  </div>
                  <button onClick={clearCoupon} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input-field flex-1 text-sm py-2"
                  />
                  <button
                    onClick={() => couponMutation.mutate(couponCode)}
                    disabled={!couponCode || couponMutation.isPending}
                    className="btn-secondary text-sm py-2 px-3 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span><span>{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span><span className="text-green-600">FREE</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>

              {user ? (
                <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3 text-sm">
                  Proceed to Checkout →
                </button>
              ) : (
                <Link to="/login?redirect=/checkout" className="btn-primary w-full py-3 text-sm block text-center">
                  Login to Checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
