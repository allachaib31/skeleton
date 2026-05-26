import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Pagination } from '@/shared/components/ui/Pagination';
import { SEO } from '@/shared/components/seo/SEO';
import { useLanguageStore } from '@/app/stores/language.store';
import { useAdminProblemReports } from '@/features/problem-reports/problem-reports.hooks';
import { ProblemReportPriority, ProblemReportStatus, ProblemReportType } from '@/features/problem-reports/problem-reports.types';

const STATUSES: Array<ProblemReportStatus | ''> = ['', 'OPEN', 'WAITING_ADMIN', 'WAITING_CLIENT', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];
const TYPES: Array<ProblemReportType | ''> = ['', 'ORDER', 'PAYMENT', 'WALLET', 'PRODUCT', 'API_PROVIDER', 'WAREHOUSE', 'ACCOUNT_SECURITY', 'REFUND', 'GENERAL'];
const PRIORITIES: Array<ProblemReportPriority | ''> = ['', 'LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function ProblemReportsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' as ProblemReportStatus | '', type: '' as ProblemReportType | '', priority: '' as ProblemReportPriority | '' });
  const { data: reportsResponse, isLoading } = useAdminProblemReports(params);
  const reports = reportsResponse?.data || [];
  const activeFilterCount = [params.search, params.status, params.type, params.priority].filter(Boolean).length;
  const resetFilters = () => setParams((current) => ({ ...current, page: 1, search: '', status: '', type: '', priority: '' }));

  return (
    <div className="space-y-6">
      <SEO title={t('problemReports.adminTitle')} description={t('problemReports.adminSubtitle')} />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('problemReports.adminTitle')}</h1>
          <p className="text-sm text-slate-500">{t('problemReports.adminSubtitle')}</p>
        </div>
        <Badge variant={activeFilterCount ? 'info' : 'outline'}>{t('problemReports.activeFilters', { count: activeFilterCount })}</Badge>
      </div>

      <div className="rounded-xl border border-white/10 bg-secondary p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Filter size={16} className="text-primary" />
            {t('problemReports.filters')}
          </div>
          <Button size="sm" variant="ghost" leftIcon={<RotateCcw size={15} />} onClick={resetFilters}>
            {t('problemReports.resetFilters')}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <Input
            label={t('common.search')}
            value={params.search}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, search: event.target.value }))}
            placeholder={t('problemReports.searchPlaceholder')}
          />
          <Select
            label={t('problemReports.type')}
            value={params.type}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, type: event.target.value as ProblemReportType | '' }))}
            options={TYPES.map((value) => ({ value, label: value ? t(`problemReports.types.${value}`) : t('common.all') }))}
          />
          <Select
            label={t('problemReports.status')}
            value={params.status}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, status: event.target.value as ProblemReportStatus | '' }))}
            options={STATUSES.map((value) => ({ value, label: value ? t(`problemReports.statuses.${value}`) : t('common.all') }))}
          />
          <Select
            label={t('problemReports.priority')}
            value={params.priority}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, priority: event.target.value as ProblemReportPriority | '' }))}
            options={PRIORITIES.map((value) => ({ value, label: value ? t(`problemReports.priorities.${value}`) : t('common.all') }))}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-secondary">
        <div className="divide-y divide-white/10 md:hidden">
          {isLoading ? (
            <div className="p-6 text-sm text-slate-500">{t('common.loading')}</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('problemReports.empty')}</div>
          ) : reports.map((report) => (
            <Link key={report._id} to={`/admin/problem-reports/${report._id}`} className="block p-4 transition hover:bg-slate-900/30">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold text-slate-500">#{report.reportNumber}</div>
                  <div className="mt-1 break-words text-base font-bold">{report.subject}</div>
                  <div className="mt-1 break-words text-xs text-slate-500">{getClientName(report.clientId)}</div>
                </div>
                <Eye size={16} className="mt-1 flex-shrink-0 text-slate-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{t(`problemReports.types.${report.type}`)}</Badge>
                <PriorityBadge priority={report.priority} />
                <StatusBadge status={report.status} />
              </div>
              <div className="mt-3 text-xs text-slate-500">{formatDate(report.lastMessageAt || report.createdAt, language)}</div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-slate-900/40 text-xs font-bold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">{t('problemReports.reportNumber')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.client')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.subject')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.type')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.priority')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.status')}</th>
                <th className="px-4 py-3 text-left">{t('problemReports.lastMessage')}</th>
                <th className="px-4 py-3 text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-6 text-sm text-slate-500">{t('common.loading')}</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-slate-500">{t('problemReports.empty')}</td></tr>
              ) : reports.map((report) => (
                <tr key={report._id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-mono text-xs">#{report.reportNumber}</td>
                  <td className="px-4 py-3 text-sm">{getClientName(report.clientId)}</td>
                  <td className="max-w-[320px] break-words px-4 py-3 text-sm font-semibold">{report.subject}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{t(`problemReports.types.${report.type}`)}</Badge></td>
                  <td className="px-4 py-3"><PriorityBadge priority={report.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(report.lastMessageAt || report.createdAt, language)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/problem-reports/${report._id}`}>
                      <Button size="sm" variant="ghost" leftIcon={<Eye size={15} />}>{t('common.view')}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Select
          value={String(params.limit)}
          onChange={(event) => setParams((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
          options={[10, 50, 100, 300].map((value) => ({ value: String(value), label: String(value) }))}
          className="w-28"
        />
        <Pagination total={reportsResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ProblemReportStatus }) {
  const { t } = useTranslation();
  const variant = status === 'RESOLVED' || status === 'CLOSED' ? 'success' : status === 'REJECTED' ? 'danger' : status === 'IN_PROGRESS' ? 'info' : 'warning';
  return <Badge variant={variant}>{t(`problemReports.statuses.${status}`)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ProblemReportPriority }) {
  const { t } = useTranslation();
  const variant = priority === 'URGENT' || priority === 'HIGH' ? 'danger' : 'outline';
  return <Badge variant={variant}>{t(`problemReports.priorities.${priority}`)}</Badge>;
}

export const formatDate = (value: string, language: string) =>
  value ? new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';

const getClientName = (client: unknown) => {
  if (!client || typeof client === 'string') return String(client || '-');
  const value = client as { name?: string; email?: string; username?: string; _id?: string };
  return value.name || value.email || value.username || value._id || '-';
};
