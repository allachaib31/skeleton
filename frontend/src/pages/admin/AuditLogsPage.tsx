import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '../../features/admin/hooks/useAuditLogs';
import { useUIStore } from '@/app/stores/ui.store';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { ActionBadge } from '../../features/admin/components/StatusBadge';
import { JsonDiff } from '../../features/admin/components/JsonDiff';
import { SEO } from '@/shared/components/seo/SEO';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRelative } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';
import { AuditLog } from '@/features/admin/types/admin.types';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/lib/utils';
import { Pagination } from '@/shared/components/ui/Pagination';

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { language } = useLanguageStore();
  const [params, setParams] = useState({ page: 1, limit: 20, action: '', entity: '', search: '' });
  const { data: logsResponse, isLoading } = useAuditLogs(params);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('runtime.auditLogs'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('runtime.auditLogs') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.auditLogs')} description={t('runtime.auditLogsDescription')} />
      
      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input 
              placeholder={t('runtime.filterActorIp')} 
              leftIcon={<Search size={18} />}
              value={params.search}
              onChange={(e: any) => setParams({ ...params, search: e.target.value, page: 1 })}
            />
          </div>
          <Select 
            options={[
              { label: t('runtime.allActions'), value: '' },
              { label: t('runtime.create'), value: 'CREATE' },
              { label: t('runtime.update'), value: 'UPDATE' },
              { label: t('common.delete'), value: 'DELETE' },
              { label: t('runtime.auth'), value: 'AUTH' },
              { label: t('runtime.providerRequestSent'), value: 'ORDER_PROVIDER_REQUEST_SENT' },
              { label: t('runtime.providerResponseReceived'), value: 'ORDER_PROVIDER_RESPONSE_RECEIVED' },
              { label: t('runtime.providerRequestFailed'), value: 'ORDER_PROVIDER_REQUEST_FAILED' },
            ]}
            value={params.action}
            onChange={(e: any) => setParams({ ...params, action: e.target.value, page: 1 })}
          />
          <Input 
            placeholder={t('runtime.entityPlaceholder')} 
            value={params.entity}
            onChange={(e: any) => setParams({ ...params, entity: e.target.value, page: 1 })}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <AuditLogSkeleton key={index} />)
        ) : (
          logsResponse?.data.length ? logsResponse.data.map((log) => (
            <AuditLogRow
              key={log._id}
              log={log}
              expandedLogId={expandedLogId}
              setExpandedLogId={setExpandedLogId}
              fallbackActor={t('common.system')}
              language={language}
              labels={{
                action: t('runtime.action'),
                entity: t('runtime.entity'),
                ip: t('runtime.ipAddress'),
                time: t('runtime.time'),
              }}
            />
          )) : (
            <Card padding="lg" className="text-center text-sm text-slate-500">
              {t('runtime.noDataFound')}
            </Card>
          )
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('runtime.rowsPerPage')}</span>
          <Select
            value={String(params.limit)}
            options={[
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
            ]}
            onChange={(event) => setParams({ ...params, limit: Number(event.target.value), page: 1 })}
            className="w-28"
          />
        </div>
        <Pagination
          total={logsResponse?.meta?.total ?? 0}
          page={params.page}
          limit={params.limit}
          onChange={(page) => setParams({ ...params, page })}
        />
      </div>
    </div>
  );
}

interface AuditLogRowProps {
  log: AuditLog;
  expandedLogId: string | null;
  setExpandedLogId: (id: string | null) => void;
  fallbackActor: string;
  language: string;
  labels: {
    action: string;
    entity: string;
    ip: string;
    time: string;
  };
}

function AuditLogRow({ log, expandedLogId, setExpandedLogId, fallbackActor, language, labels }: AuditLogRowProps) {
  const actor = getAuditActor(log, fallbackActor);
  const isExpanded = expandedLogId === log._id;

  return (
    <Card
      padding="none"
      className={cn(
        'transition-all',
        isExpanded && 'ring-2 ring-primary/20 border-primary/50'
      )}
    >
      <button
        type="button"
        className="w-full cursor-pointer p-4 text-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 sm:p-5"
        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="break-words text-sm font-bold text-slate-900 dark:text-white">{actor.name}</div>
                {actor.email && (
                  <div className="mt-1 break-all text-xs text-slate-400">{actor.email}</div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ActionBadge action={log.action} />
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-3">
              <AuditMeta label={labels.entity} value={log.entity} />
              <AuditMeta label={labels.ip} value={log.ip || '-'} mono />
              <AuditMeta label={labels.time} value={formatRelative(log.createdAt, language)} />
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30 sm:p-6">
          <div className="max-w-full overflow-x-auto">
            <JsonDiff before={log.before} after={log.after} />
          </div>
        </div>
      )}
    </Card>
  );
}

function AuditMeta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-100 bg-white/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/20">
      <div className="text-[10px] font-semibold uppercase text-slate-400">{label}</div>
      <div className={cn('mt-1 break-words text-sm text-slate-700 dark:text-slate-200', mono && 'break-all font-mono text-xs')}>
        {value}
      </div>
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <Card padding="none">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full max-w-sm space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </Card>
  );
}

const getAuditActor = (log: AuditLog, fallback: string) => {
  if (!log.actorId || typeof log.actorId === 'string') {
    return { name: fallback, email: typeof log.actorId === 'string' ? log.actorId : '' };
  }

  return {
    name: log.actorId.name || fallback,
    email: log.actorId.email || '',
  };
};
