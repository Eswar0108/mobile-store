import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [updates, setUpdates] = useState({});
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', search],
    queryFn: () => api.get(`/admin/inventory${search ? `?search=${search}` : ''}`).then((r) => r.data),
  });

  const bulkMutation = useMutation({
    mutationFn: () => api.post('/admin/inventory/bulk-update', {
      updates: Object.entries(updates).map(([id, qty]) => ({ id, stockQuantity: Number(qty) })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setUpdates({});
      toast.success('Inventory updated');
    },
    onError: () => toast.error('Error updating inventory'),
  });

  const hasUpdates = Object.keys(updates).length > 0;

  return (
    <>
      <Helmet><title>Inventory — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          {hasUpdates && (
            <button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending} className="btn-primary text-sm disabled:opacity-50">
              Save Changes ({Object.keys(updates).length})
            </button>
          )}
        </div>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input-field w-64 text-sm" />

        {isLoading ? (
          <div className="card animate-pulse h-40" />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Product</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Category</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Price</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Current Stock</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Update Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.products?.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${product.stockQuantity <= 5 ? 'bg-red-50' : ''}`}>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.brand}</p>
                    </td>
                    <td className="p-3 text-gray-600">{product.category}</td>
                    <td className="p-3 font-semibold">{formatCurrency(product.discountPrice || product.price)}</td>
                    <td className="p-3">
                      <span className={`badge text-xs ${product.stockQuantity === 0 ? 'badge-red' : product.stockQuantity <= 5 ? 'badge-yellow' : 'badge-green'}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        placeholder={product.stockQuantity}
                        value={updates[product.id] ?? ''}
                        onChange={(e) => setUpdates((u) => ({ ...u, [product.id]: e.target.value }))}
                        className="input-field text-sm w-24 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
