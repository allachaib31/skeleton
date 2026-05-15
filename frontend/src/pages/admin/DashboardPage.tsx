import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../features/admin/hooks/useDashboard';
import { useUIStore } from '@/app/stores/ui.store';
import { StatsCard } from '../../features/admin/components/StatsCard';
import { HealthIndicator } from '../../features/admin/components/HealthIndicator';
import { Table } from '@/shared/components/ui/Table';
import { Card } from '@/shared/components/ui/Card';
import { ActionBadge } from '../../features/admin/components/StatusBadge';
import { SEO } from '@/shared/components/seo/SEO';
import { Users, UserPlus, Upload, Activity, ShieldCheck, Database, Cpu } from 'lucide-react';
import { formatRelative } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: dashResponse, isLoading } = useDashboard();
  const { language } = useLanguageStore();

  const data = dashResponse?.data;
  const memory = data?.system.memory ?? { heapUsed: 0, heapTotal: 1 };
  const memoryUsage = Math.round((memory.heapUsed / Math.max(memory.heapTotal, 1)) * 100);

  useEffect(() => {
    setPageTitle(t('runtime.adminDashboard'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('nav.dashboard') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const auditColumns = [
    { key: 'actor', header: t('runtime.actor'), render: (log: any) => log.actorId.name },
    { key: 'action', header: t('runtime.action'), render: (log: any) => <ActionBadge action={log.action} /> },
    { key: 'entity', header: t('runtime.entity') },
    { key: 'createdAt', header: t('runtime.time'), render: (log: any) => formatRelative(log.createdAt, language) },
  ];

  return (
    <div className="space-y-8">
      <SEO title={t('runtime.adminDashboard')} description={t('runtime.adminDashboardDescription')} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label={t('runtime.totalUsers')} 
          value={data?.totalUsers || 0} 
          icon={<Users size={24} />} 
          delta={{ value: 12, isUp: true }}
        />
        <StatsCard 
          label={t('runtime.newToday')} 
          value={data?.newUsersToday || 0} 
          icon={<UserPlus size={24} />} 
          className="border-green-100 dark:border-green-900/50"
        />
        <StatsCard 
          label={t('runtime.totalUploads')} 
          value={data?.totalUploads || 0} 
          icon={<Upload size={24} />} 
        />
        <StatsCard 
          label={t('runtime.systemHealth')} 
          value={data?.system.status === 'healthy' || data?.system.status === 'ok' ? t('runtime.ok') : t('runtime.degraded')} 
          icon={<Activity size={24} />} 
          className={data?.system.status === 'healthy' || data?.system.status === 'ok' ? '' : 'border-red-200'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audit Logs */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold">{t('runtime.recentActivities')}</h3>
              <ShieldCheck size={20} className="text-slate-400" />
            </div>
            <Table 
              columns={auditColumns} 
              data={data?.recentAuditLogs || []} 
              isLoading={isLoading} 
            />
          </Card>
        </div>

        {/* System Status */}
        <div className="lg:col-span-1">
          <Card padding="lg">
            <h3 className="font-bold mb-6">{t('runtime.systemStatus')}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <HealthIndicator status={data?.system.db ? 'healthy' : 'unhealthy'} label={t('runtime.database')} />
                <Database size={18} className="text-slate-400" />
              </div>
              <div className="flex items-center justify-between">
                <HealthIndicator status={data?.system.redis ? 'healthy' : 'unhealthy'} label={t('runtime.cacheRedis')} />
                <Activity size={18} className="text-slate-400" />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('runtime.memoryUsage')}</span>
                  <span className="text-xs text-slate-500">
                    {memoryUsage}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${memoryUsage}%` }} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
                <Cpu size={14} />
                <span>{t('runtime.uptime')}: {data ? Math.floor(data.system.uptime / 3600) : 0} {t('runtime.hours')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
