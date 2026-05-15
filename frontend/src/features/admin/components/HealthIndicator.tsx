import { cn } from '@/shared/lib/utils';

interface HealthIndicatorProps {
  status: 'healthy' | 'unhealthy' | 'degraded';
  label: string;
}

export function HealthIndicator({ status, label }: HealthIndicatorProps) {
  const colors = {
    healthy: 'bg-green-500',
    unhealthy: 'bg-red-500',
    degraded: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2.5 w-2.5 rounded-full", colors[status])} />
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
}
