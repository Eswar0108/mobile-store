import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wishlist'] }); toast.success('Removed from wishlist'); },
  });

  const addCartMutation = useMutation({
    mutationFn: (productId) => api.post('/cart', { productId, quantity: 1 }),
    onSuccess: () => toast.success('Added to cart'),
    onError: () => toast.error('Error adding to cart'),
  });

  return (
    <>
      <Helmet><title>Wishlist — MobileStore</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-48 bg-gray-50" />
            ))}
          </div>
        ) : !(data || []).length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">♥</p>
            <p className="text-gray-500 mb-4">Your wishlist is empty</p>
            <Link to="/products" className="btn-primary">Discover Phones</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(data || []).map(({ product }) => (
              <div key={product.id} className="card group relative">
                <button
                  onClick={() => removeMutation.mutate(product.id)}
                  className="absolute top-2 right-2 z-10 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                    <img src={product.primaryImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f3f4f6' width='300' height='300'/%3E%3C/svg%3E"} alt={product.name}
                      className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-gray-400">{product.brand}</p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                  <p className="text-base font-bold text-primary-600 mt-1">{formatCurrency(product.discountPrice || product.price)}</p>
                </Link>
                <button
                  onClick={() => addCartMutation.mutate(product.id)}
                  className="btn-primary w-full text-xs py-2 mt-2"
                >Add to Cart</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
