import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onDismiss, className }: AlertProps) {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <TriangleAlert className="h-5 w-5 text-yellow-500" />,
    danger: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  const variants = {
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-400',
    success: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50 text-green-800 dark:text-green-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-400',
    danger: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-400',
  };

  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-lg border",
      variants[variant],
      className
    )}>
      <div className="shrink-0">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h5 className="font-bold mb-1">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
