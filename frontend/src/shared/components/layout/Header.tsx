import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUIStore } from '@/app/stores/ui.store';
import { useThemeStore } from '@/app/stores/theme.store';
import { Menu, Sun, Moon, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  const userItems = [
    { label: t('profile.title'), icon: <UserIcon size={16} />, onClick: () => {} },
    { label: t('settings.title'), icon: <Settings size={16} />, onClick: () => {} },
    { label: t('auth.logout'), icon: <LogOut size={16} />, onClick: logout, danger: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="md:hidden">
            <Menu size={20} />
          </Button>
          <Link to="/" className="text-xl font-bold text-primary">
            {t('app.name')}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <LanguageSwitcher />

          {/* User Profile */}
          {user ? (
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </div>
              }
              items={userItems}
            />
          ) : (
            <Link to="/login">
              <Button size="sm">{t('auth.login')}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
