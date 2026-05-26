import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { SEO } from '@/shared/components/seo/SEO';
import { useLanguageStore } from '@/app/stores/language.store';
import {
  useAddAdminProblemReportMessage,
  useAdminProblemReport,
  useAssignAdminProblemReport,
  useUpdateAdminProblemReportPriority,
  useUpdateAdminProblemReportStatus,
} from '@/features/problem-reports/problem-reports.hooks';
import { ProblemReportPriority, ProblemReportStatus } from '@/features/problem-reports/problem-reports.types';
import { PriorityBadge, StatusBadge, formatDate } from './ProblemReportsPage';

const STATUSES: ProblemReportStatus[] = ['OPEN', 'WAITING_ADMIN', 'WAITING_CLIENT', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];
const PRIORITIES: ProblemReportPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function ProblemReportDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: detailResponse, isLoading } = useAdminProblemReport(id);
  const messageMutation = useAddAdminProblemReportMessage(id || '');
  const statusMutation = useUpdateAdminProblemReportStatus(id || '');
  const priorityMutation = useUpdateAdminProblemReportPriority(id || '');
  const assignMutation = useAssignAdminProblemReport(id || '');
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState('');
  const detail = detailResponse?.data;

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    messageMutation.mutate({ message, isInternal }, { onSuccess: () => setMessage('') });
  };

  if (isLoading || !detail) {
    return <div className="rounded-xl border border-white/10 bg-secondary p-6 text-sm text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <SEO title={detail.report.subject} description={t('problemReports.adminSubtitle')} />
      <Link to="/admin/problem-reports" className="text-sm font-semibold text-slate-500 hover:text-primary">{t('common.back')}</Link>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-secondary p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold text-slate-500">#{detail.report.reportNumber}</div>
                <h1 className="mt-1 break-words text-2xl font-bold">{detail.report.subject}</h1>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-400">{detail.report.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.report.status} />
                <PriorityBadge priority={detail.report.priority} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-secondary p-5">
            <h2 className="mb-4 text-lg font-bold">{t('problemReports.message')}</h2>
            <div className="space-y-3">
              {detail.messages.map((item) => (
                <div key={item._id} className="rounded-lg bg-slate-900/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
                    <span>{item.senderRole === 'ADMIN' ? t('admin.panel') : t('problemReports.client')}</span>
                    <span>{item.isInternal ? t('problemReports.privateNote') : t('problemReports.publicReply')}</span>
                    <span>{formatDate(item.createdAt, language)}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-sm">{item.message}</div>
                </div>
              ))}
              {detail.messages.length === 0 && <div className="text-sm text-slate-500">{t('problemReports.messagesEmpty')}</div>}
            </div>
          </div>

          <form onSubmit={submitMessage} className="rounded-xl border border-white/10 bg-secondary p-5">
            <label className="mb-2 block text-sm font-bold">{t('problemReports.reply')}</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
              {t('problemReports.internalNote')}
            </label>
            <div className="mt-4">
              <Button type="submit" isLoading={messageMutation.isPending}>{t('problemReports.addMessage')}</Button>
            </div>
          </form>
        </div>

        <aside className="h-fit space-y-5 rounded-xl border border-white/10 bg-secondary p-5">
          <Info label={t('problemReports.type')} value={t(`problemReports.types.${detail.report.type}`)} />
          <Info label={t('problemReports.createdAt')} value={formatDate(detail.report.createdAt, language)} />
          <Info label={t('problemReports.lastMessage')} value={formatDate(detail.report.lastMessageAt || detail.report.createdAt, language)} />
          <div className="space-y-2">
            <Select
              label={t('problemReports.status')}
              value={detail.report.status}
              onChange={(event) => statusMutation.mutate({ status: event.target.value as ProblemReportStatus, resolutionNote })}
              options={STATUSES.map((value) => ({ value, label: t(`problemReports.statuses.${value}`) }))}
            />
            <textarea
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              rows={3}
              placeholder={t('problemReports.resolutionNote')}
              className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Select
            label={t('problemReports.priority')}
            value={detail.report.priority}
            onChange={(event) => priorityMutation.mutate(event.target.value as ProblemReportPriority)}
            options={PRIORITIES.map((value) => ({ value, label: t(`problemReports.priorities.${value}`) }))}
          />
          <div className="space-y-2">
            <Input
              label={t('problemReports.assign')}
              value={assignedAdminId}
              onChange={(event) => setAssignedAdminId(event.target.value)}
              placeholder={t('problemReports.unassigned')}
            />
            <Button size="sm" onClick={() => assignMutation.mutate(assignedAdminId.trim() || undefined)} isLoading={assignMutation.isPending}>
              {t('problemReports.assign')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold">{value || '-'}</div>
    </div>
  );
}

