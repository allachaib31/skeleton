import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { User, Settings, Bell, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: t('profile.title'), path: '/app/profile', icon: User },
    { label: t('notifications.title'), path: '/app/notifications', icon: Bell },
    { label: t('settings.title'), path: '/app/settings', icon: Settings },
  ];

  if (user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN') {
    navItems.unshift({ label: t('admin.panel'), path: '/admin/dashboard', icon: ShieldCheck });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r border-white/10 bg-secondary hidden md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">{t('nav.dashboard')}</h1>
        </div>
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
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
        <div className="absolute bottom-4 w-64 px-4">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('runtime.welcomeBackName', { name: user?.name ?? t('runtime.there') })}</h2>
          <div className="md:hidden">
            {/* Mobile Menu Trigger */}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
