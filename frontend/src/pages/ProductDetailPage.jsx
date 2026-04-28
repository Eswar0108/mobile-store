import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useCompareStore } from '../store/compareStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils';
import toast from 'react-hot-toast';
import ProductCard from '../components/product/ProductCard';

function StarDisplay({ rating, showCount, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-lg ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
      {showCount && <span className="text-sm text-gray-500 ml-1">({count} reviews)</span>}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [activeTab, setActiveTab] = useState('specs');
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addItem);
  const { addItem: addCompare, removeItem: removeCompare, isInCompare, isFull } = useCompareStore();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => api.get(`/reviews/product/${product.id}`).then((r) => r.data),
    enabled: !!product?.id,
  });

  const wishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlist', { productId: product.id }),
    onSuccess: () => toast.success('Added to wishlist'),
    onError: () => toast.error('Login required'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/reviews', { productId: product.id, rating: reviewRating, comment: reviewText }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewText('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', product.id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      primaryImage: product.primaryImage,
      colorVariant: selectedColor,
    });
    toast.success('Added to cart!');
  };

  const handleCompare = () => {
    if (!product) return;
    if (isInCompare(product.id)) { removeCompare(product.id); return; }
    if (isFull()) { toast.error('Compare limit is 3 products'); return; }
    addCompare({ id: product.id, name: product.name, price: product.price, discountPrice: product.discountPrice, primaryImage: product.primaryImage, slug: product.slug });
    toast.success('Added to compare');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>;

  const images = product.images?.length > 0 ? product.images : [{ url: product.primaryImage }];
  const inCompare = isInCompare(product.id);
  const displayPrice = product.discountPrice || product.price;
  const savingAmt = product.price > displayPrice ? product.price - displayPrice : 0;
  const savingPct = savingAmt > 0 ? Math.round((savingAmt / product.price) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>{product.name} — MobileStore</title>
        <meta name="description" content={`Buy ${product.name} at ${formatCurrency(displayPrice)}. ${product.shortDescription || ''}`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex items-center gap-1">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Phones</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Main Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
              <img
                src={images[selectedImage]?.url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext fill='%239ca3af' font-size='24' font-family='sans-serif' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${idx === selectedImage ? 'border-primary-600' : 'border-gray-200'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">{product.brand}</p>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarDisplay rating={product.avgRating} showCount count={product.reviewCount} />
                </div>
              )}
            </div>

            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(displayPrice)}</span>
              {savingAmt > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                  <span className="badge badge-red">-{savingPct}%</span>
                  <span className="text-sm text-green-600 font-medium">Save {formatCurrency(savingAmt)}</span>
                </>
              )}
            </div>

            {/* GST note */}
            <p className="text-xs text-gray-400">Price inclusive of GST</p>

            {/* Color variants */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Color: <span className="font-bold">{selectedColor || 'Select'}</span></p>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.name)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c.name ? 'border-primary-600 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c.hexCode }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stock status */}
            <div>
              {product.availability === 'OUT_OF_STOCK' ? (
                <span className="badge badge-red text-sm">Out of Stock</span>
              ) : product.isLowStock ? (
                <span className="badge badge-yellow text-sm">Only {product.stockQuantity} left!</span>
              ) : (
                <span className="badge badge-green text-sm">In Stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-700">Quantity:</p>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.availability === 'OUT_OF_STOCK'}
                className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={() => wishlistMutation.mutate()}
                className="btn-secondary w-12 h-12 flex items-center justify-center text-lg"
                title="Add to Wishlist"
              >♥</button>
              <button
                onClick={handleCompare}
                className={`w-12 h-12 flex items-center justify-center rounded-xl border text-lg transition-colors ${inCompare ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-400'}`}
                title="Compare"
              >⚖</button>
            </div>

            {/* USPs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {['🚚 Free Delivery', '↩️ 7-Day Returns', '✅ Genuine Product', '🔒 Secure Payment'].map((usp) => (
                <div key={usp} className="text-xs text-gray-500 flex items-center gap-1">{usp}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {['specs', 'description', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'reviews' ? `Reviews (${product.reviewCount || 0})` : tab}
              </button>
            ))}
          </div>

          {activeTab === 'specs' && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {product.specs?.map((spec) => (
                  <div key={spec.id} className="flex gap-4 py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 w-32 shrink-0">{spec.label}</span>
                    <span className="text-sm font-medium text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div className="card prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{product.description || 'No description available.'}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {user && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3">Write a Review</h3>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)} className={`text-2xl ${s <= reviewRating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    placeholder="Share your experience with this product..."
                    className="input-field w-full"
                  />
                  <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}
                    className="btn-primary mt-2 disabled:opacity-50">
                    {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {reviews?.reviews?.length > 0 ? (
                reviews.reviews.map((review) => (
                  <div key={review.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {review.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{review.user.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <div className="card text-center text-gray-400 py-8">No reviews yet. Be the first!</div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {product.related?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {product.related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
