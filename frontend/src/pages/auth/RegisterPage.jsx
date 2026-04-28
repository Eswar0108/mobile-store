import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutation = useMutation({
    mutationFn: () => {
      if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
      return api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
    },
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    },
    onError: (err) => toast.error(err.message || err.response?.data?.message || 'Registration failed'),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <Helmet><title>Register — MobileStore</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-bold text-xl text-gray-900">MobileStore</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Create account</h1>
            <p className="text-gray-500 text-sm">Start shopping in seconds</p>
          </div>

          <div className="card">
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={set('name')} required placeholder="Ravi Kumar" className="input-field w-full" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={set('password')} required placeholder="Min 8 characters" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="••••••••" className="input-field w-full" />
              </div>
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 disabled:opacity-50">
                {mutation.isPending ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
