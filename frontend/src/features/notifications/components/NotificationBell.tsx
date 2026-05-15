import { useNotificationStore } from '../stores/notification.store';
import { useUnreadCount } from '../hooks/notifications.hooks';
import { NotificationDropdown } from './NotificationDropdown';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  useUnreadCount();

  return (
    <Dropdown
      align="right"
      trigger={
        <div className="relative">
          <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0 rounded-full">
            <Bell size={20} className={unreadCount > 0 ? 'text-primary' : ''} />
            {unreadCount > 0 && (
              <Badge 
                variant="danger" 
                className="absolute -top-0.5 -right-0.5 px-1 min-w-[18px] h-[18px] border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      }
    >
      <NotificationDropdown />
    </Dropdown>
  );
}
