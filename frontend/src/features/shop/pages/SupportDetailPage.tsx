import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Btn } from '../components/primitives';
import { useAddProblemReportMessage, useCloseProblemReport, useProblemReport } from '@/features/problem-reports/problem-reports.hooks';
import { PriorityBadge, StatusBadge, formatDate } from './SupportPage';

export default function SupportDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { data: detailResponse, isLoading } = useProblemReport(id);
  const addMessageMutation = useAddProblemReportMessage(id || '');
  const closeMutation = useCloseProblemReport(id || '');
  const [message, setMessage] = useState('');
  const detail = detailResponse?.data;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    addMessageMutation.mutate({ message }, { onSuccess: () => setMessage('') });
  };

  if (isLoading || !detail) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">{t('common.loading')}</div>;
  }

  const closed = ['CLOSED', 'REJECTED'].includes(detail.report.status);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <Link to="/shop/support" className="text-sm font-bold text-gray-500">{t('common.back')}</Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mono text-xs font-bold text-gray-500">#{detail.report.reportNumber}</div>
              <h1 className="mt-1 break-words text-3xl font-black text-[#100E22]" style={{ letterSpacing: '-0.03em' }}>{detail.report.subject}</h1>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-600">{detail.report.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.report.status} />
              <PriorityBadge priority={detail.report.priority} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 text-lg font-black">{t('problemReports.messages')}</div>
          <div className="flex flex-col gap-3">
            {detail.messages.map((item) => (
              <div key={item._id} className="rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-gray-500">
                  <span>{t(item.senderRole === 'ADMIN' ? 'admin.panel' : 'problemReports.client')}</span>
                  <span>{formatDate(item.createdAt, i18n.language)}</span>
                </div>
                <div className="whitespace-pre-wrap break-words text-sm font-semibold text-[#100E22]">{item.message}</div>
              </div>
            ))}
            {detail.messages.length === 0 && <div className="text-sm text-gray-500">{t('problemReports.messagesEmpty')}</div>}
          </div>
          {!closed && (
            <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={4} className="rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold outline-none focus:border-[#100E22]" />
              <Btn type="submit" icon="plus" disabled={addMessageMutation.isPending}>{t('problemReports.addMessage')}</Btn>
            </form>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5">
        <div className="space-y-4">
          <Info label={t('problemReports.type')} value={t(`problemReports.types.${detail.report.type}`)} />
          <Info label={t('problemReports.createdAt')} value={formatDate(detail.report.createdAt, i18n.language)} />
          <Info label={t('problemReports.lastMessage')} value={formatDate(detail.report.lastMessageAt || detail.report.createdAt, i18n.language)} />
          {detail.report.relatedOrderId && <Info label={t('problemReports.relatedOrder')} value={getRelatedId(detail.report.relatedOrderId)} />}
          {detail.report.relatedPaymentRequestId && <Info label={t('problemReports.relatedPayment')} value={getRelatedId(detail.report.relatedPaymentRequestId)} />}
          {!closed && (
            <Btn kind="outline" icon="close" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              {t('problemReports.close')}
            </Btn>
          )}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-extrabold text-[#100E22]">{value}</div>
    </div>
  );
}

const getRelatedId = (value: string | { _id?: string; orderNumber?: string }) =>
  typeof value === 'string' ? value : value.orderNumber || value._id || '-';
