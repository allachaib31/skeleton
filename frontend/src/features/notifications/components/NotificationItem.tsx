import { Notification } from '../api/notifications.api';
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
  const { language } = useLanguageStore();
  const { _id, title, message, type, read, createdAt } = notification;

  const getIcon = () => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={18} className="text-green-500" />;
      case 'WARNING': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'DANGER': return <Trash2 size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <Card 
      className={cn(
        "flex items-start gap-4 p-4 transition-colors cursor-pointer group",
        !read ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
        compact && "p-3 gap-3 border-none shadow-none rounded-none hover:bg-slate-50 dark:hover:bg-slate-900/50"
      )}
      onClick={() => onRead?.(_id)}
    >
      <div className="shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={cn("text-sm truncate", !read ? "font-bold" : "font-medium")}>
            {title}
          </h4>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {formatRelative(createdAt, language)}
          </span>
        </div>
        <p className={cn(
          "text-xs text-slate-500 dark:text-slate-400 leading-relaxed",
          compact ? "line-clamp-1" : "line-clamp-2"
        )}>
          {message}
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
