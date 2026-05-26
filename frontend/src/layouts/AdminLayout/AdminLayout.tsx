import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Shield, FileText, Upload, Settings, ChevronLeft, ChevronRight, Globe2, Package } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLanguageStore } from '@/app/stores/language.store';

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { direction } = useLanguageStore();
  const BackIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;

  const adminNavItems = [
    { label: t('nav.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('admin.users'), path: '/admin/users', icon: Users },
    { label: t('admin.roles'), path: '/admin/roles', icon: Shield },
    { label: t('admin.permissions'), path: '/admin/permissions', icon: Shield },
    { label: t('admin.auditLogs'), path: '/admin/audit-logs', icon: FileText },
    { label: t('admin.uploads'), path: '/admin/uploads', icon: Upload },
    { label: t('admin.languages.title'), path: '/admin/languages', icon: Globe2 },
    { label: t('stocks.categories.title'), path: '/admin/stocks/categories', icon: Package },
    { label: t('stocks.services.title'), path: '/admin/stocks/services', icon: Package },
    { label: t('settings.title'), path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-white/10 bg-secondary">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">{t('admin.panel')}</h1>
          <Link to="/shop/dashboard" className="text-slate-400 hover:text-primary transition-colors">
            <BackIcon size={20} />
          </Link>
        </div>
        <nav className="px-4 space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                location.pathname === item.path 
                  ? "bg-primary text-primary-foreground" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
