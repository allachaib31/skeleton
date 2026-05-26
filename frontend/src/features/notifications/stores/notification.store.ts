import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { normalizeNotification, type Notification } from '../api/notifications.api';

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
}

interface NotificationActions {
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: Notification[]) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  devtools(
    (set) => ({
      unreadCount: 0,
      notifications: [],

      setUnreadCount: (unreadCount) => set({ unreadCount }),
      setNotifications: (notifications) => {
        const normalizedNotifications = notifications.map((notification) => normalizeNotification(notification as any));
        set({
          notifications: normalizedNotifications,
          unreadCount: normalizedNotifications.filter((notification) => !notification.read).length,
        });
      },
      incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      decrementUnreadCount: () =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
      addNotification: (notification) =>
        set((state) => {
          const normalizedNotification = normalizeNotification(notification as any);
          const notifications = [
            normalizedNotification,
            ...state.notifications.filter((item) => item._id !== normalizedNotification._id),
          ].slice(0, 10);
          return {
            notifications,
            unreadCount: state.unreadCount + (normalizedNotification.read ? 0 : 1),
          };
        }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        })),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'notification-store' }
  )
);
