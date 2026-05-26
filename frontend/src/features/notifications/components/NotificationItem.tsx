import { Notification } from '../api/notifications.api';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/ui/Card';
import { formatRelative } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';
import { CheckCircle, Info, AlertTriangle, Trash2, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onRead, onDelete, compact }: NotificationItemProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { _id, title, message, type, read, createdAt } = notification;
  const displayTitle = notification.data?.titleKey ? t(notification.data.titleKey) : title;
  const displayMessage = notification.data?.messageKey ? t(notification.data.messageKey) : message;

  const getIcon = () => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={18} className="text-green-500" />;
      case 'WARNING': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'DANGER': return <Trash2 size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-accent" />;
    }
  };

  return (
    <Card 
      className={cn(
        "flex min-w-0 max-w-full items-start gap-4 overflow-hidden p-4 transition-colors cursor-pointer group",
        !read ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary rtl:border-l-0 rtl:border-r-4 rtl:border-r-primary" : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
        compact && "p-3 gap-2 border-none shadow-none rounded-none hover:bg-slate-50 dark:hover:bg-slate-900/50"
      )}
      onClick={() => onRead?.(_id)}
    >
      <div className="mt-1 shrink-0">
        {getIcon()}
      </div>
      
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="mb-1 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <h4 className={cn("min-w-0 max-w-full text-sm break-words [overflow-wrap:anywhere]", !read ? "font-bold" : "font-medium")}>
            {displayTitle}
          </h4>
          <span className="shrink-0 text-[10px] text-slate-400 sm:max-w-[96px] sm:text-end">
            {formatRelative(createdAt, language)}
          </span>
        </div>
        <p className={cn(
          "max-w-full text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words [overflow-wrap:anywhere]",
          compact ? "line-clamp-2" : "line-clamp-3"
        )}>
          {displayMessage}
        </p>
      </div>

      {!read && (
        <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
      )}

      {onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(_id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </Card>
  );
}
