import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const onSale = searchParams.get('onSale') === 'true';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const queryParams = new URLSearchParams({
    ...(category && { category }),
    ...(brand && { brand }),
    sort,
    ...(onSale && { onSale: 'true' }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    page,
    limit: 12,
    inStock: 'true',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, brand, sort, onSale, minPrice, maxPrice, page],
    queryFn: () => api.get(`/products?${queryParams}`).then((r) => r.data),
    keepPreviousData: true,
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
    setPage(1);
  };

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <Helmet>
        <title>{category ? `${category} Phones` : 'All Phones'} — MobileStore</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-56 shrink-0 space-y-4">
            <h2 className="font-bold text-gray-900">Filters</h2>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
              {['Flagship', 'Budget', 'Camera Phone', 'Gaming', '5G'].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer mb-1">
                  <input type="radio" name="category" checked={category === cat} onChange={() => setParam('category', cat)} className="text-primary-600" />
                  <span className="text-sm text-gray-700">{cat}</span>
                </label>
              ))}
              {category && (
                <button onClick={() => setParam('category', '')} className="text-xs text-primary-600 mt-1 hover:underline">Clear</button>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Price Range</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setParam('minPrice', e.target.value)}
                  className="input-field text-xs py-1 w-full" />
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="input-field text-xs py-1 w-full" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={onSale} onChange={(e) => setParam('onSale', e.target.checked ? 'true' : '')} className="text-primary-600 rounded" />
                <span className="text-sm font-medium text-red-600">🔥 On Sale Only</span>
              </label>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{total} products found</p>
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input-field text-sm py-1.5 w-44">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📱</p>
                <p className="text-gray-500">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">← Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
