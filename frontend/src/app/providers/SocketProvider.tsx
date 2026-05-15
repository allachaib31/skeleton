import { ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { socket } from '@/shared/lib/socket/socket.client';
import { SOCKET_EVENTS } from '@/shared/lib/socket/socket.events';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useSocketStore } from '@/app/stores/socket.store';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { queryKeys } from '@/shared/constants/queryKeys';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { setConnected, addOnlineUser, removeOnlineUser } = useSocketStore();
  const { addNotification, incrementUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();
    } else {
      socket.disconnect();
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => console.warn('Socket connection error:', err.message);

    const onNewNotification = (notif: any) => {
      addNotification(notif);
      incrementUnreadCount();
      toast(notif.title, {
        description: notif.message,
        icon: <Bell size={18} className="text-primary" />,
      });
    };

    const onUserOnline = ({ userId }: { userId: string }) => addOnlineUser(userId);
    const onUserOffline = ({ userId }: { userId: string }) => removeOnlineUser(userId);

    const onAdminAuditLog = () => {
      if (user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN') {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.auditLogs });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNewNotification);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(SOCKET_EVENTS.ADMIN_AUDIT_LOG, onAdminAuditLog);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNewNotification);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(SOCKET_EVENTS.ADMIN_AUDIT_LOG, onAdminAuditLog);
    };
  }, [isAuthenticated, user, queryClient, setConnected, addOnlineUser, removeOnlineUser, addNotification, incrementUnreadCount]);

  return <>{children}</>;
};
