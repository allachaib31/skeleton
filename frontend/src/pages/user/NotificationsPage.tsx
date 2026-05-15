import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../../features/notifications/hooks/notifications.hooks';
import { useNotificationStore } from '../../features/notifications/stores/notification.store';
import { useUIStore } from '@/app/stores/ui.store';
import { Button } from '@/shared/components/ui/Button';
import { Tabs } from '@/shared/components/ui/Tabs';
import { Pagination } from '@/shared/components/ui/Pagination';
import { NotificationItem } from '../../features/notifications/components/NotificationItem';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SEO } from '@/shared/components/seo/SEO';
import { Bell, BellOff, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading } = useNotifications({ page, limit });
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllAsRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  const { unreadCount } = useNotificationStore();

  const notifications = response?.data || [];
  const filtered = activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications;

  useEffect(() => {
    setPageTitle(t('notifications.title'));
    setBreadcrumbs([{ label: t('notifications.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const tabs = [
    { label: t('notifications.all'), value: 'all' },
    { label: `${t('notifications.unread')} (${unreadCount})`, value: 'unread' },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('notifications.title')} description={t('runtime.notificationsDescription')} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-primary" /> {t('notifications.title')}
        </h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead()} leftIcon={<CheckCheck size={16} />}>
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(val) => { setActiveTab(val); setPage(1); }} />

      <div className="space-y-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 animate-pulse">
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/4 rounded" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 w-1/2 rounded" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BellOff size={48} />}
            title={t('runtime.allCaughtUp')}
            description={activeTab === 'unread' ? t('runtime.noUnreadNotifications') : t('runtime.noNotificationsYet')}
          />
        ) : (
          filtered.map((notif) => (
            <NotificationItem 
              key={notif._id} 
              notification={notif} 
              onRead={(id) => markRead(id)}
              onDelete={(id) => deleteNotif(id)}
            />
          ))
        )}
      </div>

      {response?.meta && (
        <Pagination 
          total={response.meta.total} 
          page={page} 
          limit={limit} 
          onChange={setPage} 
          className="mt-8"
        />
      )}
    </div>
  );
}
