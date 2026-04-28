import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import { formatDateTime } from '../../lib/utils';

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, action],
    queryFn: () => api.get(`/admin/audit-logs?page=${page}&limit=25${action ? `&action=${action}` : ''}`).then((r) => r.data),
  });

  return (
    <>
      <Helmet><title>Audit Logs — Admin</title></Helmet>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>

        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Filter by action..." className="input-field w-64 text-sm" />

        {isLoading ? (
          <div className="card animate-pulse h-40" />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Time</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Admin</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Action</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Entity</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="p-3">
                      <p className="text-sm font-medium">{log.admin?.name}</p>
                      <p className="text-xs text-gray-400">{log.admin?.email}</p>
                    </td>
                    <td className="p-3"><span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.action}</span></td>
                    <td className="p-3 text-xs text-gray-500">{log.entityType}{log.entityId && ` #${log.entityId.slice(-8).toUpperCase()}`}</td>
                    <td className="p-3 text-xs text-gray-500 max-w-xs truncate">{log.metadata ? JSON.stringify(log.metadata) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">←</button>
                <span className="text-sm text-gray-600 py-1 px-2">Page {page} of {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">→</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
