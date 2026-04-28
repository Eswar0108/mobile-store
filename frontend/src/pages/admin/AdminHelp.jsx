import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const EMPTY_ARTICLE = { title: '', category: '', content: '', published: true };

export default function AdminHelp() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ARTICLE);
  const [editId, setEditId] = useState(null);

  const { data } = useQuery({ queryKey: ['admin-help'], queryFn: () => api.get('/help/admin').then((r) => r.data) });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const mutation = useMutation({
    mutationFn: () => editId ? api.put(`/help/admin/${editId}`, form) : api.post('/help/admin', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-help'] }); setShowForm(false); setForm(EMPTY_ARTICLE); setEditId(null); toast.success('Article saved'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/help/admin/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-help'] }); toast.success('Deleted'); },
  });

  return (
    <>
      <Helmet><title>Help Articles — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Help Articles</h1>
          <button onClick={() => { setForm(EMPTY_ARTICLE); setEditId(null); setShowForm(true); }} className="btn-primary text-sm">+ New Article</button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <h2 className="font-bold">{editId ? 'Edit' : 'New'} Article</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <input value={form.category} onChange={set('category')} className="input-field w-full text-sm" placeholder="e.g. Orders, Payments, Returns" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content *</label>
              <textarea value={form.content} onChange={set('content')} rows={8} className="input-field w-full text-sm font-mono" />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={set('published')} /> Published</label>
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
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Title</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Category</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Helpful</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Published</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Updated</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.articles?.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{article.title}</td>
                  <td className="p-3 text-gray-500">{article.category}</td>
                  <td className="p-3 text-gray-500 text-xs">{article.helpfulYes}/{article.helpfulNo ? article.helpfulYes + article.helpfulNo : '—'}</td>
                  <td className="p-3"><span className={`badge text-xs ${article.published ? 'badge-green' : 'badge-gray'}`}>{article.published ? 'Yes' : 'No'}</span></td>
                  <td className="p-3 text-xs text-gray-400">{formatDate(article.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setForm({ title: article.title, category: article.category, content: article.content, published: article.published }); setEditId(article.id); setShowForm(true); }}
                        className="text-xs text-primary-600 hover:underline">Edit</button>
                      <button onClick={() => deleteMutation.mutate(article.id)} className="text-xs text-red-500 hover:underline">Delete</button>
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
