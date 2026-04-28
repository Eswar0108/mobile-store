import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const RETURN_REASONS = ['Defective product', 'Wrong item delivered', 'Not as described', 'Changed my mind', 'Better price elsewhere', 'Other'];

export default function ReturnRequestPage() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const orderItemId = searchParams.get('itemId') || '';

  const mutation = useMutation({
    mutationFn: (formData) => api.post('/returns', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      toast.success('Return request submitted!');
      navigate(`/orders/${orderId}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error submitting return'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderItemId) {
      toast.error('Please click Return on a specific item from the order details page.');
      return;
    }
    const fd = new FormData(e.target);
    fd.append('orderId', orderId);
    fd.append('orderItemId', orderItemId);
    mutation.mutate(fd);
  };

  return (
    <>
      <Helmet><title>Return Request — MobileStore</title></Helmet>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Request a Return</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <select name="reason" value={reason} onChange={(e) => setReason(e.target.value)} required className="input-field w-full">
              <option value="">Select a reason</option>
              {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Please describe the issue in detail..."
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photos (optional, max 3)</label>
            <input name="images" type="file" multiple accept="image/*" className="text-sm text-gray-500 file:btn-secondary file:text-sm file:py-1 file:px-3 file:mr-3 file:border-0 file:rounded-lg" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="btn-primary text-sm disabled:opacity-50">
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
