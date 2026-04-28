import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../../store/cartStore';
import { useCompareStore } from '../../store/compareStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, savingPercent } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const { addItem: addCompare, removeItem: removeCompare, isInCompare, isFull } = useCompareStore();
  const queryClient = useQueryClient();

  const saving = savingPercent(product.price, product.discountPrice);
  const displayPrice = product.discountPrice || product.price;
  const inCompare = isInCompare(product.id);

  const wishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlist', { productId: product.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Added to wishlist');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: displayPrice, primaryImage: product.primaryImage });
    toast.success('Added to cart');
  };

  const handleCompare = () => {
    if (inCompare) {
      removeCompare(product.id);
    } else if (isFull()) {
      toast.error('Compare limit is 3 products');
    } else {
      addCompare(product);
      toast.success('Added to compare');
    }
  };

  return (
    <div className="card group relative">
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {saving > 0 && <span className="badge badge-red text-xs">-{saving}%</span>}
        {product.isLowStock && <span className="badge badge-yellow text-xs">Low Stock</span>}
        {product.availability === 'OUT_OF_STOCK' && <span className="badge badge-gray text-xs">Out of Stock</span>}
      </div>

      {/* Wishlist */}
      {user && (
        <button
          onClick={() => wishlistMutation.mutate()}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ♥
        </button>
      )}

      {/* Image */}
      <Link to={`/products/${product.slug}`}>
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
          <img
            src={product.primaryImage || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 font-medium">{product.brand}</p>
        <Link to={`/products/${product.slug}`} className="block font-semibold text-gray-900 text-sm hover:text-primary-600 line-clamp-2 leading-snug">
          {product.name}
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-xs ${star <= Math.round(product.avgRating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(displayPrice)}</span>
          {product.discountPrice && product.price > product.discountPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAddToCart}
            disabled={product.availability === 'OUT_OF_STOCK'}
            className="btn-primary flex-1 text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
          <button
            onClick={handleCompare}
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
              inCompare ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-400'
            }`}
          >
            ⚖
          </button>
        </div>
      </div>
    </div>
  );
}
