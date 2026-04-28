import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const redirect = searchParams.get('redirect') || '/';

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/login', { email, password }),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      const cartItems = useCartStore.getState().items;
      if (cartItems.length > 0) {
        api.post('/cart/merge', {
          items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity, colorVariant: i.colorVariant })),
        }).catch(() => {});
      }
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(redirect);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <>
      <Helmet><title>Login — MobileStore</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-bold text-xl text-gray-900">MobileStore</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com" className="input-field w-full" autoFocus />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot?</Link>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••" className="input-field w-full" />
              </div>
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 disabled:opacity-50">
                {mutation.isPending ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don't have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
