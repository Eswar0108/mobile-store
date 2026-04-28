import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const EMPTY = { code: '', discountType: 'PERCENTAGE', discountValue: '', maxDiscountAmount: '', minOrderValue: '', usageLimit: '', perUserLimit: '', startDate: '', expiresAt: '', isActive: true, scope: 'ALL' };

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const { data } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.get('/coupons/admin').then((r) => r.data) });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const mutation = useMutation({
    mutationFn: () => editId ? api.put(`/coupons/admin/${editId}`, form) : api.post('/coupons/admin', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); setShowForm(false); setForm(EMPTY); setEditId(null); toast.success(editId ? 'Coupon updated' : 'Coupon created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupons/admin/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Coupon deleted'); },
  });

  const openEdit = (coupon) => {
    setForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, maxDiscountAmount: coupon.maxDiscountAmount || '', minOrderValue: coupon.minOrderValue || '', usageLimit: coupon.usageLimit || '', perUserLimit: coupon.perUserLimit || '', startDate: coupon.startDate?.slice(0, 10) || '', expiresAt: coupon.expiresAt?.slice(0, 10) || '', isActive: coupon.isActive, scope: coupon.scope });
    setEditId(coupon.id);
    setShowForm(true);
  };

  return (
    <>
      <Helmet><title>Coupons — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} className="btn-primary text-sm">+ New Coupon</button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <h2 className="font-bold">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                <input value={form.code} onChange={set('code')} className="input-field w-full uppercase text-sm" placeholder="SAVE20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={form.discountType} onChange={set('discountType')} className="input-field w-full text-sm">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat Amount</option>
                  <option value="FIRST_ORDER">First Order</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Value *</label>
                <input type="number" value={form.discountValue} onChange={set('discountValue')} className="input-field w-full text-sm" placeholder={form.discountType === 'PERCENTAGE' ? '20 (%)' : '500 (₹)'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
                <input type="number" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} className="input-field w-full text-sm" placeholder="2000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Order (₹)</label>
                <input type="number" value={form.minOrderValue} onChange={set('minOrderValue')} className="input-field w-full text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={set('usageLimit')} className="input-field w-full text-sm" placeholder="Unlimited" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={set('startDate')} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={set('expiresAt')} className="input-field w-full text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active
            </label>
            <div className="flex gap-2">
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary text-sm disabled:opacity-50">Save</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Value</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Usage</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Expires</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.coupons?.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-semibold text-gray-900">{coupon.code}</td>
                  <td className="p-3 text-gray-600">{coupon.discountType}</td>
                  <td className="p-3">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td className="p-3 text-gray-600">{coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</td>
                  <td className="p-3 text-gray-500 text-xs">{coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}</td>
                  <td className="p-3"><span className={`badge text-xs ${coupon.isActive ? 'badge-green' : 'badge-gray'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(coupon)} className="text-xs text-primary-600 hover:underline">Edit</button>
                      <button onClick={() => deleteMutation.mutate(coupon.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
