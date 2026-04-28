import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function NotificationDrawer({ onClose }) {
  const drawerRef = useRef();
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications, data.unreadCount);
      return data;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => markAllRead(),
  });

  useEffect(() => {
    const handler = (e) => { if (!drawerRef.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={drawerRef} className="relative w-80 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => markAllMutation.mutate()} className="text-xs text-primary-600 hover:underline">Mark all read</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 ${!notif.isRead ? 'bg-primary-50' : ''}`}>
                <p className="text-sm text-gray-900">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
