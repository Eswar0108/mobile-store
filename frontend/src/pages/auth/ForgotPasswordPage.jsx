import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // email → otp → done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const forgotMutation = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
    onSuccess: () => { toast.success('OTP sent to your email'); setStep('otp'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { email, otp, newPassword }),
    onSuccess: () => { toast.success('Password reset! You can now login.'); setStep('done'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <>
      <Helmet><title>Forgot Password — MobileStore</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 text-sm mt-1">We'll send you a one-time password</p>
          </div>

          <div className="card">
            {step === 'email' && (
              <form onSubmit={(e) => { e.preventDefault(); forgotMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@example.com" className="input-field w-full" autoFocus />
                </div>
                <button type="submit" disabled={forgotMutation.isPending} className="btn-primary w-full py-3 disabled:opacity-50">
                  {forgotMutation.isPending ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OTP (check your email)</label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required
                    placeholder="6-digit code" className="input-field w-full" autoFocus maxLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    placeholder="Min 8 characters" className="input-field w-full" />
                </div>
                <button type="submit" disabled={resetMutation.isPending} className="btn-primary w-full py-3 disabled:opacity-50">
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => forgotMutation.mutate()} className="text-xs text-primary-600 hover:underline w-full text-center">
                  Resend OTP
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="text-center py-4 space-y-3">
                <p className="text-3xl">✅</p>
                <p className="font-semibold text-gray-900">Password reset successfully!</p>
                <Link to="/login" className="btn-primary inline-block">Sign In Now</Link>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-primary-600 hover:underline">← Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
