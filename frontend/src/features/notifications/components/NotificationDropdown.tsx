import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../stores/notification.store';
import { useMarkAsRead, useMarkAllAsRead } from '../hooks/notifications.hooks';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/shared/components/ui/Button';
import { BellOff, CheckCheck } from 'lucide-react';

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notifications, unreadCount } = useNotificationStore();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllAsRead();

  const latest = notifications.slice(0, 5);

  return (
    <div className="w-80 flex flex-col max-h-[480px] overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-bold text-sm">{t('notifications.title')}</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllRead()}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <CheckCheck size={12} /> {t('runtime.markAllReadShort')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {latest.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
              <BellOff size={24} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500">{t('runtime.noNewNotifications')}</p>
          </div>
        ) : (
          latest.map((notif) => (
            <NotificationItem 
              key={notif._id} 
              notification={notif} 
              compact 
              onRead={(id) => {
                markRead(id);
                if (notif.href) navigate(notif.href);
              }}
            />
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs font-bold"
          onClick={() => navigate('/app/notifications')}
        >
          {t('runtime.viewAllNotifications')}
        </Button>
      </div>
    </div>
  );
}
