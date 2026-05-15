import { ReactNode } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { cn } from '@/shared/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  delta?: { value: number; isUp: boolean };
  className?: string;
}

export function StatsCard({ label, value, icon, delta, className }: StatsCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          {icon}
        </div>
        {delta && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold",
            delta.isUp ? "text-green-500" : "text-red-500"
          )}>
            {delta.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider">{label}</p>
      </div>
    </Card>
  );
}
