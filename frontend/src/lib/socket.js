import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import toast from 'react-hot-toast';

let socket = null;

export const useSocket = () => {
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!user) return;

    socket = io('/', { withCredentials: true, transports: ['websocket'] });

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('notification', (notification) => {
      addNotification(notification);
      toast(notification.message, { icon: '🔔' });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user, addNotification]);

  return socket;
};
