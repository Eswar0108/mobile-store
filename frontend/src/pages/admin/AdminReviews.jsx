import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [tab, setTab] = useState('pending');
  const queryClient = useQueryClient();

  const { data: pending } = useQuery({
    queryKey: ['admin-reviews-pending'],
    queryFn: () => api.get('/reviews/admin/pending').then((r) => r.data),
    enabled: tab === 'pending',
  });

  const { data: flagged } = useQuery({
    queryKey: ['admin-reviews-flagged'],
    queryFn: () => api.get('/reviews/admin/flagged').then((r) => r.data),
    enabled: tab === 'flagged',
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/reviews/admin/${id}`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-flagged'] });
      toast.success('Review updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reviews/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-flagged'] });
      toast.success('Review deleted');
    },
  });

  const reviews = tab === 'pending' ? pending?.reviews : flagged?.reviews;

  return (
    <>
      <Helmet><title>Reviews — Admin</title></Helmet>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <div className="flex gap-2 border-b">
          {['pending', 'flagged'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {reviews?.map((review) => (
            <div key={review.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{review.user?.name}</p>
                  <p className="text-xs text-gray-400">{review.product?.name} · {formatDate(review.createdAt)}</p>
                  <div className="flex gap-0.5 my-1">{[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
                  {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                  {review.flagCount > 0 && <p className="text-xs text-red-500 mt-1">Flagged {review.flagCount} time(s)</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => actionMutation.mutate({ id: review.id, action: 'approve' })}
                    className="text-xs text-green-600 hover:underline">Approve</button>
                  <button onClick={() => deleteMutation.mutate(review.id)}
                    className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {reviews?.length === 0 && <p className="text-center text-gray-400 py-8">No {tab} reviews</p>}
        </div>
      </div>
    </>
  );
}
