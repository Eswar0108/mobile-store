import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const profileMutation = useMutation({
    mutationFn: () => api.patch('/auth/me', form),
    onSuccess: ({ data }) => { updateUser(data); toast.success('Profile updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const pwMutation = useMutation({
    mutationFn: () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error('Passwords do not match');
      return api.patch('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
    },
    onSuccess: () => { toast.success('Password changed'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (err) => toast.error(err.message || err.response?.data?.message || 'Error'),
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/auth/addresses').then((r) => r.data),
  });

  const deleteAddress = useMutation({
    mutationFn: (id) => api.delete(`/auth/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  return (
    <>
      <Helmet><title>Profile — MobileStore</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        <div className="flex gap-2 mb-6 border-b">
          {['profile', 'password', 'addresses'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="card space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-lg">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field w-full" placeholder="+91 9876543210" />
            </div>
            <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} className="btn-primary text-sm disabled:opacity-50">
              {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'password' && (
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} className="input-field w-full" />
            </div>
            <button onClick={() => pwMutation.mutate()} disabled={pwMutation.isPending} className="btn-primary text-sm disabled:opacity-50">
              {pwMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {tab === 'addresses' && (
          <div className="space-y-3">
            {addresses?.map((addr) => (
              <div key={addr.id} className="card flex justify-between items-start">
                <div className="text-sm">
                  <p className="font-semibold">{addr.name} {addr.isDefault && <span className="badge badge-blue ml-1 text-xs">Default</span>}</p>
                  <p className="text-gray-600">{addr.line1}</p>
                  <p className="text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-gray-500">{addr.phone}</p>
                </div>
                <button onClick={() => deleteAddress.mutate(addr.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            ))}
            {!addresses?.length && <p className="text-center text-gray-400 py-8">No addresses saved</p>}
          </div>
        )}
      </div>
    </>
  );
}
