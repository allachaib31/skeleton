import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/app/stores/theme.store';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: 'light', icon: <Sun size={16} />, label: t('settings.light') },
    { value: 'system', icon: <Laptop size={16} />, label: t('settings.system') },
    { value: 'dark', icon: <Moon size={16} />, label: t('settings.dark') },
  ] as const;

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
            theme === opt.value 
              ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
