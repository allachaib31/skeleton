import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUIStore } from '@/app/stores/ui.store';
import { cn } from '@/shared/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Upload, 
  Settings, 
  User, 
  Bell,
  Globe2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const location = useLocation();
  const { t } = useTranslation();

  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  const userLinks = [
    { label: t('nav.dashboard'), path: '/app/dashboard', icon: LayoutDashboard },
    { label: t('profile.title'), path: '/app/profile', icon: User },
    { label: t('notifications.title'), path: '/app/notifications', icon: Bell },
    { label: t('settings.title'), path: '/app/settings', icon: Settings },
  ];

  const adminLinks = [
    { label: t('admin.dashboard'), path: '/admin/dashboard', icon: Shield },
    { label: t('admin.users'), path: '/admin/users', icon: Users },
    { label: t('admin.auditLogs'), path: '/admin/audit-logs', icon: FileText },
    { label: t('admin.uploads'), path: '/admin/uploads', icon: Upload },
    { label: t('admin.languages.title'), path: '/admin/languages', icon: Globe2 },
  ];

  const links = isAdmin && location.pathname.startsWith('/admin')
    ? adminLinks
    : isAdmin
      ? [...userLinks, { label: t('admin.panel'), path: '/admin/dashboard', icon: Shield }]
      : userLinks;

  if (!sidebarOpen) return null;

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 md:relative",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
        {!sidebarCollapsed && <span className="font-bold text-lg">{t('nav.menu')}</span>}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
              location.pathname === link.path 
                ? "bg-primary text-primary-foreground" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <link.icon size={20} className={cn(location.pathname === link.path ? "" : "text-slate-400 group-hover:text-primary")} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{link.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 px-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('common.systemOnline')}</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
