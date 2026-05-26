import { UIEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../stores/notification.store';
import { useInfiniteNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/notifications.hooks';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/shared/components/ui/Button';
import { BellOff, CheckCheck } from 'lucide-react';

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { unreadCount } = useNotificationStore();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllAsRead();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotifications(10);

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data]
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="flex max-h-[min(480px,calc(100vh-5rem))] w-full min-w-0 max-w-full flex-col overflow-hidden sm:w-80">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="min-w-0 break-words text-sm font-bold [overflow-wrap:anywhere]">{t('notifications.title')}</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllRead()}
            className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary hover:underline"
          >
            <CheckCheck size={12} /> {t('runtime.markAllReadShort')}
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1 divide-y divide-slate-100 overflow-x-hidden overflow-y-auto dark:divide-slate-800" onScroll={handleScroll}>
        {!isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
              <BellOff size={24} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500">{t('runtime.noNewNotifications')}</p>
          </div>
        ) : (
          <>
            {notifications.map((notif) => (
              <NotificationItem
                key={notif._id}
                notification={notif}
                compact
                onRead={(id) => {
                  markRead(id);
                  if (notif.href) navigate(notif.href);
                }}
              />
            ))}
            {(isLoading || isFetchingNextPage) && (
              <div className="p-4 text-center text-xs text-slate-500">
                {t('common.loading')}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs font-bold"
          onClick={() => navigate('/shop/dashboard')}
        >
          {t('runtime.viewAllNotifications')}
        </Button>
      </div>
    </div>
  );
}
