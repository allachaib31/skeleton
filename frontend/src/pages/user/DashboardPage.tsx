import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, Clock3, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { useUIStore } from '@/app/stores/ui.store';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUnreadCount } from '@/features/notifications/hooks/notifications.hooks';
import { useProfile } from '@/features/users/hooks/useProfile';
import { useMySessions } from '@/features/users/hooks/useMySessions';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { SEO } from '@/shared/components/seo/SEO';
import { formatDate } from '@/shared/lib/utils/date';
import { cn } from '@/shared/lib/utils';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user: authUser } = useAuthStore();
  const { data: profileResponse } = useProfile();
  const { data: unreadResponse } = useUnreadCount();
  const { data: sessionsResponse } = useMySessions();

  const user = profileResponse?.data ?? authUser;
  const unreadCount = unreadResponse?.data.count ?? 0;
  const activeSessions = sessionsResponse?.data.filter((session) => session.isCurrent).length ?? 0;

  useEffect(() => {
    setPageTitle(t('nav.dashboard'));
    setBreadcrumbs([{ label: t('nav.dashboard') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  return (
    <div className="space-y-8">
      <SEO title={t('nav.dashboard')} description={t('runtime.dashboardSubtitle')} />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm dark:border-slate-800">
        <div className="relative p-8 md:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <Badge variant="info" className="mb-4">{t('runtime.dashboardWelcome')}</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('runtime.welcomeBackName', { name: user?.name ?? t('runtime.there') })}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
              {t('runtime.dashboardSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/app/profile"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                {t('runtime.editProfile')}
              </Link>
              <Link
                to="/app/settings"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/5 px-4 py-2 font-medium text-white transition-colors hover:bg-white/10"
              >
                {t('runtime.accountSettings')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('runtime.unreadNotifications')}</p>
              <p className="mt-2 text-3xl font-bold">{unreadCount}</p>
            </div>
            <Bell className="text-primary" size={28} />
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('runtime.currentSessions')}</p>
              <p className="mt-2 text-3xl font-bold">{activeSessions}</p>
            </div>
            <ShieldCheck className="text-emerald-500" size={28} />
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('runtime.accountStatus')}</p>
              <p className="mt-2 text-3xl font-bold capitalize">{user?.status ?? t('runtime.active')}</p>
            </div>
            <CheckCircle2 className="text-blue-500" size={28} />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold">{t('runtime.profileSummary')}</h2>
            <UserRound size={20} className="text-slate-400" />
          </div>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('runtime.email')}</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('runtime.role')}</dt>
              <dd className="font-medium">{user?.role?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('runtime.verified')}</dt>
              <dd className="font-medium">{user?.isEmailVerified ? t('runtime.yes') : t('runtime.no')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('runtime.joined')}</dt>
              <dd className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card padding="lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold">{t('runtime.quickActions')}</h2>
            <Clock3 size={20} className="text-slate-400" />
          </div>
          <div className="grid gap-3">
            {[
              { to: '/app/notifications', label: t('runtime.reviewNotifications'), icon: Bell },
              { to: '/app/sessions', label: t('runtime.manageSessions'), icon: ShieldCheck },
              { to: '/app/settings', label: t('runtime.securitySettings'), icon: Settings },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'inline-flex h-10 items-center justify-start gap-2 rounded-md border border-slate-200 bg-transparent px-4 py-2 font-medium transition-colors',
                  'hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
