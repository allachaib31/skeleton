import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface Tab {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-slate-200 dark:border-slate-800 space-x-8", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex items-center gap-2 py-4 px-1 text-sm font-medium border-b-2 transition-colors",
            activeTab === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
          )}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
