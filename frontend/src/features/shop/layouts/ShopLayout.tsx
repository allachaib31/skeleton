import { ReactNode, UIEvent, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Btn, Wordmark, Input } from '../components/primitives';
import { ACCOUNT_NAV } from '../data/catalog';
import { clsx } from 'clsx';
import { useShopServices } from '../hooks/shop.hooks';
import { useShopOrders } from '../hooks/shop.hooks';
import { localized, serviceGlyph, serviceShopPath } from '../utils/shop-format';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import {
  useInfiniteNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useUnreadCount,
} from '@/features/notifications/hooks/notifications.hooks';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { useLanguages } from '@/features/i18n/hooks/languages.hooks';
import { formatRelative } from '@/shared/lib/utils/date';
import { Notification } from '@/features/notifications/api/notifications.api';
import { User } from '@/shared/types/auth.types';
import { useProfile } from '@/features/users/hooks/useProfile';

export default function ShopLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="shop-page flex h-screen min-h-0 overflow-hidden bg-[#f0eee9] text-[#111827]">
      <Sidebar />
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: servicesResponse, isLoading } = useShopServices({ page: 1, limit: 20 });
  const { data: ordersResponse } = useShopOrders({ page: 1, limit: 1 });
  const services = servicesResponse?.data || [];
  const orderCount = ordersResponse?.meta?.total;
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  return (
    <aside
      className={clsx(
        'min-h-0 w-[232px] flex-shrink-0 flex-col gap-2 overflow-y-auto bg-[#100E22] p-4 text-white',
        mobile ? 'absolute inset-y-0 left-0 z-10 flex shadow-2xl' : 'hidden xl:flex',
      )}
    >
      <div className="px-2 pt-1 pb-5">
        <Wordmark size={20} />
      </div>

      <SidebarHeading>Marketplace</SidebarHeading>
      <SidebarLink icon="home" label="Home" to="/shop/dashboard" onNavigate={onNavigate} />
      {isLoading && Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="mx-1 h-10 rounded-[10px] bg-white/[0.06]" />
      ))}
      {!isLoading && services.map((service) => (
        <SidebarLink
          key={service._id}
          icon={service.type === 'SOCIAL_REINFORCERS' ? 'heart' : service.type === 'ESIM_NUMBER' || service.type === 'PHONE_NUMBER_GENERATOR' ? 'sms' : 'gift'}
          label={localized(service.name, i18n.language, 'Service')}
          to={serviceShopPath(service)}
          count={service.productCount}
          fallbackGlyph={serviceGlyph(service, i18n.language)}
          onNavigate={onNavigate}
        />
      ))}

      <SidebarHeading className="mt-5">Account</SidebarHeading>
      {isAdmin && (
        <SidebarLink icon="shield" label={t('admin.panel')} to="/admin/dashboard" onNavigate={onNavigate} />
      )}
      {ACCOUNT_NAV.map((s) => (
        <SidebarLink key={s.id} icon={s.icon} label={s.label} to={s.to} count={s.id === 'orders' ? orderCount : undefined} onNavigate={onNavigate} />
      ))}

      <div className="mt-auto rounded-2xl border border-primary/20 bg-primary/[0.08] p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="sparkle" size={14} className="text-primary" />
          <div className="text-xs font-bold text-primary">Bonus weekend</div>
        </div>
        <div className="text-xs leading-snug text-white/70">
          Top up $100+ and get an extra 8% credited instantly.
        </div>
        <NavLink to="/shop/wallet" className="mt-2.5 block">
          <Btn kind="primary" size="sm" full>
            Add balance
          </Btn>
        </NavLink>
      </div>
    </aside>
  );
}

function SidebarHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx('px-3 pt-3 pb-1.5 text-[11px] font-bold uppercase text-white/40', className)}
      style={{ letterSpacing: 0.8 }}
    >
      {children}
    </div>
  );
}

type SidebarIcon = 'home' | 'heart' | 'sms' | 'gift' | 'shield' | (typeof ACCOUNT_NAV)[number]['icon'];

function SidebarLink({
  icon,
  label,
  to,
  count,
  fallbackGlyph,
  onNavigate,
}: {
  icon: SidebarIcon;
  label: string;
  to: string;
  count?: number;
  fallbackGlyph?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const [toPath, toSearch = ''] = to.split('?');
  const targetServiceId = new URLSearchParams(toSearch).get('serviceId');
  const currentServiceId = new URLSearchParams(location.search).get('serviceId');
  const isActive = targetServiceId
    ? location.pathname === toPath && currentServiceId === targetServiceId
    : location.pathname === toPath || location.pathname.startsWith(`${toPath}/`);

  return (
    <NavLink to={to} end={false} onClick={onNavigate}>
      {() => (
        <div
          className={clsx(
            'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-white/80 hover:bg-white/[0.06]',
          )}
        >
          {icon ? <Icon name={icon as never} size={18} /> : <span className="text-xs font-black">{fallbackGlyph}</span>}
          <span className="flex-1 text-left">{label}</span>
          {count != null && (
            <span
              className={clsx(
                'rounded-full px-1.5 py-px text-[11px] font-bold',
                isActive ? 'bg-[#100E22] text-white' : 'bg-white/10 text-white',
              )}
            >
              {count}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: profileResponse } = useProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [searchOpen, setSearchOpen] = useState(false);
  const balance = profileResponse?.data?.balance ?? user?.balance ?? 0;
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-[68px] flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:gap-5 md:px-8">
      <button
        type="button"
        aria-label="Menu"
        onClick={onMenuClick}
        className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] border border-gray-200 bg-[#F8FAFC] text-[#100E22] xl:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      <NavLink to="/shop/dashboard" className="hidden sm:block xl:hidden">
        <Wordmark size={18} onDark={false} />
      </NavLink>

      <div className="ml-auto hidden w-full max-w-[520px] xl:ml-0 xl:block">
        <Input icon="search" placeholder={t('shopHeader.searchPlaceholder')} />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label={t('shopHeader.search')}
          onClick={() => setSearchOpen(true)}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] border border-gray-200 bg-[#F8FAFC] text-[#100E22] xl:hidden"
        >
          <Icon name="search" size={18} />
        </button>

        <NavLink
          to="/shop/wallet"
          className="hidden items-center gap-2 rounded-[10px] border border-gray-200 bg-[#F8FAFC] px-3.5 py-2 hover:bg-gray-100 md:flex"
        >
          <Icon name="wallet" size={16} />
          <div className="text-left">
            <div className="text-[10px] font-semibold uppercase leading-none text-gray-500">{t('shopHeader.balance')}</div>
            <div className="text-[15px] font-extrabold leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {formatMoney(balance)}
            </div>
          </div>
          <Icon name="plus" size={14} className="text-gray-500" />
        </NavLink>

        <div className="flex items-center gap-1">
          <ShopNotificationDropdown />
          <ShopLanguageDropdown />
        </div>

        <ShopProfileDropdown
          user={user}
          initials={initials}
          onLogout={() => logout()}
          isLoggingOut={isLoggingOut}
        />
      </div>
      {searchOpen && <ShopSearchDialog onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function ShopNotificationDropdown() {
  const { unreadCount } = useNotificationStore();
  useUnreadCount();

  return (
    <Dropdown
      align="right"
      contentClassName="w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-gray-200 bg-white text-[#111827] shadow-2xl sm:w-80"
      trigger={
        <ShopIconButton icon="bell" label="Notifications">
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </ShopIconButton>
      }
    >
      <ShopNotificationPanel />
    </Dropdown>
  );
}

function ShopNotificationPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { unreadCount } = useNotificationStore();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllAsRead();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteNotifications(8);
  const notifications = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      markRead(notification._id);
    }
    if (notification.href) {
      navigate(notification.href);
    }
  };

  return (
    <div className="flex max-h-[min(560px,calc(100vh-5rem))] w-full min-w-0 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3.5">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#100E22]">{t('notifications.title')}</div>
          {unreadCount > 0 && (
            <div className="mt-0.5 text-xs font-semibold text-gray-500">
              {unreadCount}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="shrink-0 rounded-full bg-[#100E22] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#221d40]"
          >
            {t('runtime.markAllReadShort')}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2" onScroll={handleScroll}>
        {!isLoading && notifications.length === 0 ? (
          <div className="grid place-items-center px-6 py-10 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#F8FAFC] text-gray-400">
              <Icon name="bell" size={22} />
            </div>
            <p className="text-sm font-bold text-gray-500">{t('runtime.noNewNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <ShopNotificationItem
                key={notification._id}
                notification={notification}
                language={language}
                onOpen={() => openNotification(notification)}
              />
            ))}
            {(isLoading || isFetchingNextPage) && (
              <div className="px-4 py-4 text-center text-xs font-bold text-gray-500">
                {t('common.loading')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-[#F8FAFC] p-2">
        <button
          type="button"
          onClick={() => navigate('/shop/dashboard')}
          className="w-full rounded-xl px-3 py-2 text-sm font-black text-[#100E22] transition hover:bg-white"
        >
          {t('runtime.viewAllNotifications')}
        </button>
      </div>
    </div>
  );
}

function ShopNotificationItem({
  notification,
  language,
  onOpen,
}: {
  notification: Notification;
  language: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const displayTitle = notification.data?.titleKey ? t(notification.data.titleKey) : notification.title;
  const displayMessage = notification.data?.messageKey ? t(notification.data.messageKey) : notification.message;
  const tone = getNotificationTone(notification.type);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        'flex w-full min-w-0 items-start gap-3 rounded-2xl p-3 text-start transition',
        notification.read ? 'hover:bg-[#F8FAFC]' : 'bg-[#fffde6] hover:bg-[#fffbd1]',
      )}
    >
      <span className={clsx('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone.className)}>
        <Icon name={tone.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0 break-words text-sm font-black text-[#100E22] [overflow-wrap:anywhere]">
            {displayTitle}
          </span>
          {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
        </span>
        <span className="mt-1 line-clamp-2 break-words text-xs font-semibold leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
          {displayMessage}
        </span>
        <span className="mt-2 block text-[11px] font-bold text-gray-400">
          {formatRelative(notification.createdAt, language)}
        </span>
      </span>
    </button>
  );
}

function getNotificationTone(type: string): { icon: 'check' | 'warning' | 'close' | 'info'; className: string } {
  switch (type) {
    case 'SUCCESS':
      return { icon: 'check', className: 'bg-emerald-50 text-emerald-600' };
    case 'WARNING':
      return { icon: 'warning', className: 'bg-amber-50 text-amber-600' };
    case 'DANGER':
      return { icon: 'close', className: 'bg-red-50 text-red-600' };
    default:
      return { icon: 'info', className: 'bg-[#100E22]/[0.06] text-[#100E22]' };
  }
}

function ShopProfileDropdown({
  user,
  initials,
  onLogout,
  isLoggingOut,
}: {
  user: User | null;
  initials: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const avatar = user?.avatar;
  const displayName = user?.username || user?.email || t('runtime.user');

  return (
    <Dropdown
      align="right"
      contentClassName="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border-gray-200 bg-white p-2 text-[#111827] shadow-2xl sm:w-72"
      trigger={
        <button type="button" className="flex items-center gap-2.5 rounded-[10px] p-1.5 hover:bg-gray-100">
          {avatar ? (
            <img src={avatar} alt="" className="h-9 w-9 rounded-[10px] object-cover" />
          ) : (
            <div
              className="grid h-9 w-9 place-items-center rounded-[10px] text-sm font-extrabold text-[#100E22]"
              style={{ background: 'linear-gradient(135deg, #fdf001 0%, #ff8e3c 100%)' }}
            >
              {initials}
            </div>
          )}
          <div className="hidden text-left xl:block">
            <div className="max-w-[120px] truncate text-[13px] font-bold leading-tight">{displayName}</div>
            <div className="text-[11px] text-gray-500">{user?.role?.name || t('runtime.role')}</div>
          </div>
          <Icon name="chevronD" size={14} className="hidden text-gray-400 xl:block" />
        </button>
      }
    >
      <div className="rounded-xl bg-[#F8FAFC] p-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-[#100E22]"
              style={{ background: 'linear-gradient(135deg, #fdf001 0%, #ff8e3c 100%)' }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="break-words text-sm font-black text-[#100E22] [overflow-wrap:anywhere]">
              {displayName}
            </div>
            <div className="break-words text-xs font-semibold text-gray-500 [overflow-wrap:anywhere]">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={() => navigate('/shop/profile')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-black text-[#100E22] hover:bg-[#F8FAFC]"
        >
          <Icon name="user" size={17} />
          <span className="min-w-0 flex-1">{t('profile.title')}</span>
          <Icon name="chevronR" size={15} className="text-gray-400 rtl:hidden" />
          <Icon name="chevronL" size={15} className="hidden text-gray-400 rtl:block" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <Icon name="close" size={17} />
          <span className="min-w-0 flex-1">{t('auth.logout')}</span>
        </button>
      </div>
    </Dropdown>
  );
}

function ShopSearchDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[70] xl:hidden">
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 bg-[#100E22]/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-4 top-20 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black text-[#100E22]">{t('shopHeader.searchTitle')}</div>
            <div className="text-xs font-semibold text-gray-500">{t('shopHeader.searchDescription')}</div>
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-[#F8FAFC] text-[#100E22]"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <Input icon="search" autoFocus placeholder={t('shopHeader.searchPlaceholder')} />
      </div>
    </div>
  );
}

function ShopLanguageDropdown() {
  const { language, direction, setLanguage } = useLanguageStore();
  const { data: languagesResponse } = useLanguages();
  const options = languagesResponse?.data ?? [
    { code: 'en', name: 'English', direction: 'ltr' as const, isDefault: true, isCustom: false },
    { code: 'fr', name: 'Français', direction: 'ltr' as const, isDefault: false, isCustom: false },
    { code: 'ar', name: 'العربية', direction: 'rtl' as const, isDefault: false, isCustom: false },
  ];

  return (
    <Dropdown
      align={direction === 'rtl' ? 'left' : 'right'}
      contentClassName="w-[calc(100vw-2rem)] max-w-xs overflow-hidden rounded-2xl border-gray-200 bg-white p-1.5 text-[#111827] shadow-2xl sm:w-60"
      trigger={
        <ShopIconButton icon="globe" label={language.toUpperCase()}>
          <span className="text-[11px] font-black uppercase">{language}</span>
        </ShopIconButton>
      }
      items={options.map((option) => ({
        label: (
          <div className="flex min-w-0 w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F8FAFC] text-[11px] font-black uppercase text-[#100E22]">
                {option.code}
              </span>
              <span className="min-w-0 break-words text-sm font-bold text-[#111827] [overflow-wrap:anywhere]">
                {option.name}
              </span>
            </div>
            {language === option.code && <Icon name="check" size={15} className="shrink-0 text-[#100E22]" />}
          </div>
        ),
        onClick: () => void setLanguage(option.code),
      }))}
    />
  );
}

function ShopIconButton({
  icon,
  label,
  children,
}: {
  icon: 'bell' | 'globe';
  label: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-[10px] border border-gray-200 bg-[#F8FAFC] px-2.5 text-[#100E22] transition hover:bg-gray-100"
    >
      <Icon name={icon} size={18} />
      {children}
    </button>
  );
}
