import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminReturns() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-returns', status],
    queryFn: () => api.get(`/returns/admin${status ? `?status=${status}` : ''}`).then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, adminNotes }) => api.patch(`/returns/admin/${id}`, { action, adminNotes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Return updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const refundMutation = useMutation({
    mutationFn: (id) => api.post(`/returns/admin/${id}/refund`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Refund initiated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <>
      <Helmet><title>Returns — Admin</title></Helmet>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Returns</h1>

        <div className="flex gap-2 flex-wrap">
          {['', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REFUND_COMPLETED'].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${status === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {data?.data?.map((ret) => (
            <div key={ret.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ret.user?.name}</p>
                  <p className="text-xs text-gray-400">{ret.product?.name} · {formatDate(ret.createdAt)}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong>Reason:</strong> {ret.reason}</p>
                  {ret.description && <p className="text-sm text-gray-600">{ret.description}</p>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`badge ${getStatusColor(ret.status)} text-xs`}>{ret.status}</span>
                  {ret.status === 'REQUESTED' && (
                    <div className="flex gap-2">
                      <button onClick={() => actionMutation.mutate({ id: ret.id, action: 'approve' })} className="text-xs text-green-600 hover:underline">Approve</button>
                      <button onClick={() => actionMutation.mutate({ id: ret.id, action: 'reject' })} className="text-xs text-red-500 hover:underline">Reject</button>
                    </div>
                  )}
                  {ret.status === 'ITEM_RECEIVED' && (
                    <button onClick={() => refundMutation.mutate(ret.id)} className="text-xs text-primary-600 hover:underline">Initiate Refund</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.data?.length === 0 && <p className="text-center text-gray-400 py-8">No returns found</p>}
        </div>
      </div>
    </>
  );
}
