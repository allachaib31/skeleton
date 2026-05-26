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
import { playNotificationSound } from '@/features/notifications/lib/notification-sounds';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { setConnected, addOnlineUser, removeOnlineUser } = useSocketStore();
  const { addNotification } = useNotificationStore();

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
      playNotificationSound(notif);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      if (notif?.type === 'problem_report') {
        queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.list });
        if (notif.data?.reportId) queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.byId(String(notif.data.reportId)) });
        if (user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN') {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.problemReports });
          if (notif.data?.reportId) queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.problemReports, String(notif.data.reportId)] });
        }
      }
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

    const onOrderUpdated = () => {
      if (user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN') {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNewNotification);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(SOCKET_EVENTS.ADMIN_AUDIT_LOG, onAdminAuditLog);
    socket.on(SOCKET_EVENTS.ORDER_UPDATED, onOrderUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNewNotification);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(SOCKET_EVENTS.ADMIN_AUDIT_LOG, onAdminAuditLog);
      socket.off(SOCKET_EVENTS.ORDER_UPDATED, onOrderUpdated);
    };
  }, [isAuthenticated, user, queryClient, setConnected, addOnlineUser, removeOnlineUser, addNotification]);

  return <>{children}</>;
};
