import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const ROLE_COLORS = { CUSTOMER: 'badge-gray', ADMIN: 'badge-red', SALESPERSON: 'badge-blue', DELIVERY_AGENT: 'badge-yellow' };

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALESPERSON' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get(`/admin/users?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then((r) => r.data),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setShowForm(false); setForm({ name: '', email: '', password: '', role: 'SALESPERSON' }); toast.success('User created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/users/${id}`, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Updated'); },
  });

  return (
    <>
      <Helmet><title>Users — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Staff</button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <h2 className="font-bold">Create Staff Account</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input value={form.name} onChange={set('name')} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={set('email')} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={set('password')} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={set('role')} className="input-field w-full text-sm">
                  <option value="SALESPERSON">Salesperson</option>
                  <option value="DELIVERY_AGENT">Delivery Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary text-sm disabled:opacity-50">Create</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="input-field w-72 text-sm" />

        {isLoading ? (
          <div className="card animate-pulse h-40" />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">User</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Role</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Joined</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Orders</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="p-3"><span className={`badge text-xs ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td className="p-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="p-3 text-gray-600">{u._count?.orders ?? 0}</td>
                    <td className="p-3"><span className={`badge text-xs ${u.isActive !== false ? 'badge-green' : 'badge-red'}`}>{u.isActive !== false ? 'Active' : 'Blocked'}</span></td>
                    <td className="p-3">
                      <button onClick={() => toggleMutation.mutate({ id: u.id, isActive: u.isActive === false })}
                        className={`text-xs hover:underline ${u.isActive !== false ? 'text-red-500' : 'text-green-600'}`}>
                        {u.isActive !== false ? 'Block' : 'Activate'}
                      </button>
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
