import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/config/i18n';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  Notification
} from '../api/notifications.api';
import { useNotificationStore } from '../stores/notification.store';
import { queryKeys } from '@/shared/constants/queryKeys';
import { PaginationQuery } from '@/shared/types/api.types';

export const useNotifications = (params: PaginationQuery) => {
  const { setNotifications } = useNotificationStore();
  const query = useQuery({
    queryKey: [queryKeys.notifications.list, params],
    queryFn: () => getNotifications(params),
  });

  useEffect(() => {
    if (params.page === 1 && query.data) {
      setNotifications(query.data.data);
    }
  }, [params.page, query.data, setNotifications]);

  return query;
};

export const useInfiniteNotifications = (limit = 10) =>
  useInfiniteQuery({
    queryKey: [...queryKeys.notifications.list, 'dropdown', limit],
    queryFn: ({ pageParam = 1 }) => getNotifications({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta?.hasNext) return undefined;
      return lastPage.meta.page + 1;
    },
  });

export const useUnreadCount = () => {
  const { setUnreadCount } = useNotificationStore();
  const query = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (query.data) {
      setUnreadCount(query.data.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { markAsRead: localMarkRead } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: (_, id) => {
      localMarkRead(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { markAllAsRead: localMarkAllRead } = useNotificationStore();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      localMarkAllRead();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      toast.success(i18n.t('notifications.markAllReadSuccess'));
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list });
      const previous = queryClient.getQueryData(queryKeys.notifications.list);
      queryClient.setQueryData(queryKeys.notifications.list, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((n: Notification) => n._id !== id),
        };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
};
