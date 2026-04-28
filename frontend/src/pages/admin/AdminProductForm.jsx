import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const INITIAL = {
  name: '', brand: '', category: '', price: '', discountPrice: '', stock: '',
  description: '', shortDescription: '', availability: 'PUBLISHED',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(INITIAL);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [imageFiles, setImageFiles] = useState([]);

  const { data: existing } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/products/admin/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        brand: existing.brand || '',
        category: existing.category || '',
        price: existing.price || '',
        discountPrice: existing.discountPrice || '',
        stock: existing.stock || '',
        description: existing.description || '',
        shortDescription: existing.shortDescription || '',
        availability: existing.availability || 'PUBLISHED',
      });
      if (existing.specs?.length) setSpecs(existing.specs.map(s => ({ key: s.key, value: s.value })));
    }
  }, [existing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, specs, price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : null, stock: Number(form.stock) };
      let product;
      if (isEdit) {
        const res = await api.put(`/products/${id}`, payload);
        product = res.data;
      } else {
        const res = await api.post('/products', payload);
        product = res.data;
      }
      // Upload images if any
      if (imageFiles.length > 0) {
        const fd = new FormData();
        imageFiles.forEach((f) => fd.append('images', f));
        await api.post(`/products/${product.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return product;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const addSpec = () => setSpecs((s) => [...s, { key: '', value: '' }]);
  const updateSpec = (idx, field, val) => setSpecs((s) => s.map((sp, i) => i === idx ? { ...sp, [field]: val } : sp));
  const removeSpec = (idx) => setSpecs((s) => s.filter((_, i) => i !== idx));

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Product' : 'Add Product'} — Admin</title></Helmet>
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <button onClick={() => navigate('/admin/products')} className="btn-secondary text-sm">← Back</button>
        </div>

        <div className="card space-y-4">
          <h2 className="font-bold text-gray-800">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input value={form.name} onChange={set('name')} className="input-field w-full" placeholder="Samsung Galaxy S24 Ultra" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
              <input value={form.brand} onChange={set('brand')} className="input-field w-full" placeholder="Samsung" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={set('category')} className="input-field w-full">
                <option value="">Select category</option>
                {['Flagship', 'Budget', 'Camera Phone', 'Gaming', '5G'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={set('price')} className="input-field w-full" placeholder="49999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
              <input type="number" value={form.discountPrice} onChange={set('discountPrice')} className="input-field w-full" placeholder="44999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input type="number" value={form.stock} onChange={set('stock')} className="input-field w-full" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select value={form.availability} onChange={set('availability')} className="input-field w-full">
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input value={form.shortDescription} onChange={set('shortDescription')} className="input-field w-full" placeholder="Flagship killer with 200MP camera" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4} className="input-field w-full" />
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Specifications</h2>
            <button onClick={addSpec} className="text-xs text-primary-600 hover:underline">+ Add row</button>
          </div>
          {specs.map((spec, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input value={spec.key} onChange={(e) => updateSpec(idx, 'key', e.target.value)} placeholder="e.g. RAM" className="input-field flex-1 text-sm" />
              <input value={spec.value} onChange={(e) => updateSpec(idx, 'value', e.target.value)} placeholder="e.g. 12 GB" className="input-field flex-1 text-sm" />
              <button onClick={() => removeSpec(idx)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
          ))}
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold text-gray-800">Product Images</h2>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles([...e.target.files])}
            className="text-sm text-gray-500" />
          {imageFiles.length > 0 && <p className="text-xs text-gray-400">{imageFiles.length} file(s) selected</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary text-sm disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button onClick={() => navigate('/admin/products')} className="btn-secondary text-sm">Cancel</button>
        </div>
      </div>
    </>
  );
}
