import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => api.get(`/products/admin/all?page=${page}&limit=20`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted'); },
    onError: () => toast.error('Error deleting product'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <Helmet><title>Products — Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <Link to="/admin/products/new" className="btn-primary text-sm">+ Add Product</Link>
        </div>

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
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Stock</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {product.primaryImage && <img src={product.primaryImage} alt="" className="w-8 h-8 object-contain rounded" />}
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-48">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{product.category}</td>
                    <td className="p-3">
                      <p className="font-semibold">{formatCurrency(product.discountPrice || product.price)}</p>
                      {product.discountPrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>}
                    </td>
                    <td className="p-3">
                      <span className={`badge ${product.stockQuantity <= 5 ? 'badge-yellow' : product.stockQuantity === 0 ? 'badge-red' : 'badge-green'} text-xs`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`badge text-xs ${product.availability === 'PUBLISHED' ? 'badge-green' : 'badge-gray'}`}>
                        {product.availability}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/products/${product.id}/edit`} className="text-xs text-primary-600 hover:underline">Edit</Link>
                        <button onClick={() => handleDelete(product.id, product.name)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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
