import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import { formatCurrency } from '../lib/utils';

function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  if (!banners?.length) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[21/7] md:aspect-[21/6]">
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {banner.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-8 md:px-16">
            <div className="text-white max-w-xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h2>
              {banner.subtitle && <p className="text-sm md:text-lg opacity-90 mb-4">{banner.subtitle}</p>}
              {banner.ctaText && banner.ctaLink && (
                <Link to={banner.ctaLink} className="btn-primary inline-block">
                  {banner.ctaText}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${idx === current ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c === 0 ? banners.length - 1 : c - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center"
          >‹</button>
          <button
            onClick={() => setCurrent((c) => (c === banners.length - 1 ? 0 : c + 1))}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center"
          >›</button>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.get('/banners').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: newArrivals } = useQuery({
    queryKey: ['home-new-arrivals'],
    queryFn: () => api.get('/products?sort=newest&limit=8').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: saleProducts } = useQuery({
    queryKey: ['home-sale'],
    queryFn: () => api.get('/products?onSale=true&limit=8').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const categories = [
    { label: 'Flagship', icon: '🏆', color: 'bg-purple-50 text-purple-700' },
    { label: 'Budget', icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Camera Phone', icon: '📸', color: 'bg-blue-50 text-blue-700' },
    { label: 'Gaming', icon: '🎮', color: 'bg-red-50 text-red-700' },
    { label: '5G', icon: '⚡', color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <>
      <Helmet>
        <title>MobileStore — India's Best Smartphone Store</title>
        <meta name="description" content="Buy the latest smartphones at the best prices in India. Genuine products, easy EMI, fast delivery." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Hero Banner */}
        <BannerCarousel banners={banners} />

        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={`/products?category=${cat.label}`}
                className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm whitespace-nowrap ${cat.color} hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        {newArrivals?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Arrivals</h2>
              <Link to="/products?sort=newest" className="text-sm text-primary-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Sale */}
        {saleProducts?.length > 0 && (
          <section className="bg-red-50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">🔥 Hot Deals</h2>
              <Link to="/products?onSale=true" className="text-sm text-red-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹999' },
            { icon: '✅', title: '100% Genuine', desc: 'All products verified' },
            { icon: '↩️', title: '7-Day Returns', desc: 'Hassle-free returns' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay & COD' },
          ].map((badge) => (
            <div key={badge.title} className="card text-center">
              <div className="text-3xl mb-2">{badge.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{badge.title}</h3>
              <p className="text-xs text-gray-500">{badge.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
