import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const EMPTY = { title: '', subtitle: '', ctaText: '', ctaLink: '', isActive: true, startDate: '', endDate: '', displayOrder: 0 };

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const { data } = useQuery({ queryKey: ['admin-banners'], queryFn: () => api.get('/banners/admin').then((r) => r.data) });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (editId) return api.put(`/banners/admin/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return api.post('/banners/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setShowForm(false); setForm(EMPTY); setEditId(null); toast.success('Banner saved'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/banners/admin/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Deleted'); },
  });

  return (
    <>
      <Helmet><title>Banners — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} className="btn-primary text-sm">+ New Banner</button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <h2 className="font-bold">{editId ? 'Edit' : 'New'} Banner</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} className="input-field w-full text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={set('subtitle')} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CTA Text</label>
                <input value={form.ctaText} onChange={set('ctaText')} className="input-field w-full text-sm" placeholder="Shop Now" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CTA Link</label>
                <input value={form.ctaLink} onChange={set('ctaLink')} className="input-field w-full text-sm" placeholder="/products" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={set('displayOrder')} className="input-field w-full text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm text-gray-500" />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active</label>
            <div className="flex gap-2">
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary text-sm disabled:opacity-50">Save</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(data) ? data : []).map((banner) => (
            <div key={banner.id} className="card">
              {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <p className="font-bold text-gray-900">{banner.title}</p>
              {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
              <p className="text-xs text-gray-400 mt-1">Order: {banner.displayOrder}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`badge text-xs ${banner.isActive ? 'badge-green' : 'badge-gray'}`}>{banner.isActive ? 'Active' : 'Inactive'}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setForm({ title: banner.title, subtitle: banner.subtitle || '', ctaText: banner.ctaText || '', ctaLink: banner.ctaLink || '', isActive: banner.isActive, startDate: '', endDate: '', displayOrder: banner.displayOrder }); setEditId(banner.id); setShowForm(true); }}
                    className="text-xs text-primary-600 hover:underline">Edit</button>
                  <button onClick={() => deleteMutation.mutate(banner.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
