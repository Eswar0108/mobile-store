import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Payment', 'Confirm'];

function AddressStep({ addresses, selected, onSelect, onAddNew }) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900 text-lg">Select Delivery Address</h2>
      {addresses?.map((addr) => (
        <label key={addr.id} className={`card cursor-pointer border-2 ${selected === addr.id ? 'border-primary-600' : 'border-transparent'}`}>
          <div className="flex items-start gap-3">
            <input type="radio" name="address" checked={selected === addr.id} onChange={() => onSelect(addr.id)} className="mt-1 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900">{addr.name} {addr.isDefault && <span className="badge badge-blue ml-2 text-xs">Default</span>}</p>
              <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}</p>
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
            </div>
          </div>
        </label>
      ))}
      <button onClick={onAddNew} className="btn-secondary text-sm py-2 w-full">+ Add New Address</button>
    </div>
  );
}

function AddressForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/addresses', form),
    onSuccess: () => { toast.success('Address saved'); onSave(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="card space-y-3">
      <h3 className="font-bold">New Address</h3>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Full Name *" value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field" />
        <input placeholder="Phone *" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" />
        <input placeholder="Address Line 1 *" value={form.line1} onChange={(e) => set('line1', e.target.value)} className="input-field col-span-2" />
        <input placeholder="Address Line 2" value={form.line2} onChange={(e) => set('line2', e.target.value)} className="input-field col-span-2" />
        <input placeholder="City *" value={form.city} onChange={(e) => set('city', e.target.value)} className="input-field" />
        <input placeholder="State *" value={form.state} onChange={(e) => set('state', e.target.value)} className="input-field" />
        <input placeholder="Pincode *" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className="input-field" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        Set as default address
      </label>
      <div className="flex gap-2">
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary text-sm disabled:opacity-50">Save Address</button>
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [addingAddress, setAddingAddress] = useState(false);
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const { data: addresses, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/auth/addresses').then((r) => r.data),
  });

  const total = getTotal();

  const orderMutation = useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess: async (res) => {
      const order = res.data;
      if (paymentMethod === 'COD') {
        clearCart();
        clearCoupon();
        navigate(`/orders/${order.id}?success=1`);
        return;
      }
      // Razorpay
      const { data: rpOrder } = await api.post('/payments/create-order', { orderId: order.id });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: 'INR',
        name: 'MobileStore',
        order_id: rpOrder.razorpayOrderId,
        handler: async (response) => {
          await api.post('/payments/verify', {
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          clearCart();
          clearCoupon();
          navigate(`/orders/${order.id}?success=1`);
        },
        prefill: { name: order.shippingAddress?.name, contact: order.shippingAddress?.phone },
        theme: { color: '#2563eb' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      rzp.open();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Order failed'),
  });

  const handlePlaceOrder = () => {
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    orderMutation.mutate({
      addressId: selectedAddress,
      paymentMethod,
      couponCode: coupon?.code,
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity, colorVariant: i.colorVariant })),
    });
  };

  return (
    <>
      <Helmet><title>Checkout — MobileStore</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {idx < step ? '✓' : idx + 1}
              </div>
              <span className={`text-sm font-medium ${idx === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              {idx < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {step === 0 && (
              addingAddress ? (
                <AddressForm onSave={() => { setAddingAddress(false); refetch(); }} onCancel={() => setAddingAddress(false)} />
              ) : (
                <AddressStep addresses={addresses} selected={selectedAddress} onSelect={setSelectedAddress} onAddNew={() => setAddingAddress(true)} />
              )
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Payment Method</h2>
                {[
                  { value: 'RAZORPAY', label: '💳 Pay Online (Cards, UPI, NetBanking)', desc: 'Secure payment via Razorpay' },
                  { value: 'COD', label: '💵 Cash on Delivery', desc: 'Pay when your order arrives' },
                ].map((method) => (
                  <label key={method.value} className={`card cursor-pointer border-2 ${paymentMethod === method.value ? 'border-primary-600' : 'border-transparent'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="mt-1 text-primary-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Review & Confirm</h2>
                <div className="card space-y-2">
                  <p className="font-semibold text-gray-700">Items ({items.length})</p>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Payment: {paymentMethod === 'RAZORPAY' ? 'Online' : 'Cash on Delivery'}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-secondary py-2 px-4 text-sm">← Back</button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => {
                    if (step === 0 && !selectedAddress && !addingAddress) { toast.error('Select an address'); return; }
                    setStep(step + 1);
                  }}
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Continue →
                </button>
              ) : (
                <button onClick={handlePlaceOrder} disabled={orderMutation.isPending} className="btn-primary py-2 px-6 text-sm disabled:opacity-50">
                  {orderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="card space-y-3 sticky top-20">
              <h3 className="font-bold text-gray-900">Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600"><span>{items.length} item(s)</span><span>{formatCurrency(items.reduce((sum, i) => sum + i.price * i.quantity, 0))}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
                <div className="flex justify-between text-gray-600"><span>GST</span><span>{formatCurrency(Math.round(total * 0.18 / 1.18))}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-green-600">FREE</span></div>
                <div className="border-t pt-2 flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
