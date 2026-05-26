import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Badge, Btn } from '../components/primitives';
import { Icon } from '../components/Icon';
import { useProblemReports } from '@/features/problem-reports/problem-reports.hooks';
import { ProblemReportStatus, ProblemReportType } from '@/features/problem-reports/problem-reports.types';
import { Pagination } from '@/shared/components/ui/Pagination';

const PAGE_LIMIT = 10;
const TYPES: Array<'ALL' | ProblemReportType> = ['ALL', 'ORDER', 'PAYMENT', 'WALLET', 'PRODUCT', 'ACCOUNT_SECURITY', 'GENERAL'];
const STATUSES: Array<'ALL' | ProblemReportStatus> = ['ALL', 'WAITING_ADMIN', 'WAITING_CLIENT', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function SupportPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'ALL' | ProblemReportType>('ALL');
  const [status, setStatus] = useState<'ALL' | ProblemReportStatus>('ALL');
  const { data: reportsResponse, isLoading } = useProblemReports({
    page,
    limit: PAGE_LIMIT,
    type: type === 'ALL' ? undefined : type,
    status: status === 'ALL' ? undefined : status,
  });
  const reports = reportsResponse?.data || [];
  const total = reportsResponse?.meta?.total || 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-3xl font-black" style={{ letterSpacing: '-0.03em' }}>
            {t('problemReports.title')}
          </div>
          <div className="text-[13px] text-gray-500">{t('problemReports.subtitle')}</div>
        </div>
        <Link to="/shop/support/new">
          <Btn icon="plus">{t('problemReports.newReport')}</Btn>
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-gray-500">{t('problemReports.type')}</span>
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as 'ALL' | ProblemReportType);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
          >
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? t('common.all') : t(`problemReports.types.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-gray-500">{t('problemReports.status')}</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'ALL' | ProblemReportStatus);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? t('common.all') : t(`problemReports.statuses.${item}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="divide-y divide-gray-200 md:hidden">
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[138px] bg-white" />
          ))}
          {!isLoading && reports.map((report) => (
            <Link key={report._id} to={`/shop/support/${report._id}`} className="block p-4 transition hover:bg-[#F8FAFC]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mono text-[11px] font-bold text-gray-500">#{report.reportNumber}</div>
                  <div className="mt-1 break-words text-base font-black leading-snug text-[#100E22]">{report.subject}</div>
                </div>
                <Icon name="chevronR" size={16} className="mt-1 flex-shrink-0 text-gray-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge kind="soft">{t(`problemReports.types.${report.type}`)}</Badge>
                <PriorityBadge priority={report.priority} />
                <StatusBadge status={report.status} />
              </div>
              <div className="mt-3 text-[11px] font-semibold text-gray-500">
                {formatDate(report.lastMessageAt || report.createdAt, i18n.language)}
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-gray-500" style={{ letterSpacing: 0.4 }}>
              <tr>
                <th className="px-6 py-3.5 text-left">{t('problemReports.reportNumber')}</th>
                <th className="px-6 py-3.5 text-left">{t('problemReports.subject')}</th>
                <th className="px-6 py-3.5 text-left">{t('problemReports.type')}</th>
                <th className="px-6 py-3.5 text-left">{t('problemReports.priority')}</th>
                <th className="px-6 py-3.5 text-left">{t('problemReports.status')}</th>
                <th className="px-6 py-3.5 text-left" />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td colSpan={6} className="h-[60px] bg-white" />
                </tr>
              ))}
              {!isLoading && reports.map((report) => (
                <tr key={report._id} className="border-t border-gray-200 hover:bg-[#F8FAFC]">
                  <td className="px-6 py-3.5 mono text-xs font-bold">#{report.reportNumber}</td>
                  <td className="px-6 py-3.5">
                    <Link to={`/shop/support/${report._id}`} className="block max-w-[360px] break-words text-sm font-extrabold text-[#100E22]">
                      {report.subject}
                    </Link>
                    <div className="text-[11px] text-gray-500">{formatDate(report.lastMessageAt || report.createdAt, i18n.language)}</div>
                  </td>
                  <td className="px-6 py-3.5"><Badge kind="soft">{t(`problemReports.types.${report.type}`)}</Badge></td>
                  <td className="px-6 py-3.5"><PriorityBadge priority={report.priority} /></td>
                  <td className="px-6 py-3.5"><StatusBadge status={report.status} /></td>
                  <td className="px-6 py-3.5">
                    <Link to={`/shop/support/${report._id}`} className="inline-flex">
                      <Icon name="chevronR" size={16} className="text-gray-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && reports.length === 0 && (
          <div className="px-6 py-16 text-center text-gray-500">{t('problemReports.empty')}</div>
        )}
      </div>
      <Pagination total={total} page={page} limit={PAGE_LIMIT} onChange={setPage} />
    </div>
  );
}

export function StatusBadge({ status }: { status: ProblemReportStatus }) {
  const { t } = useTranslation();
  const kind = status === 'RESOLVED' || status === 'CLOSED' ? 'success' : status === 'REJECTED' ? 'danger' : status === 'IN_PROGRESS' ? 'info' : 'warning';
  return <Badge kind={kind} dot>{t(`problemReports.statuses.${status}`)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation();
  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-extrabold', priority === 'URGENT' || priority === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700')}>
      {t(`problemReports.priorities.${priority}`)}
    </span>
  );
}

export const formatDate = (value: string, language: string) =>
  value ? new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';
