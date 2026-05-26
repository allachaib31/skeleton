import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { SEO } from '@/shared/components/seo/SEO';
import { formatDate } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';
import { useAdminPaymentRequests, useApprovePaymentRequest, useRejectPaymentRequest } from '@/features/payments/payments.hooks';
import { PaymentRequest } from '@/features/payments/payments.types';
import { PaymentRequestQuery } from '@/features/payments/payments.types';

const getLocalized = (value: any, language: string, fallback = '-') =>
  typeof value === 'string' ? value : value?.[language] || value?.en || value?.fr || value?.ar || fallback;

const getClientName = (client: PaymentRequest['clientId']) =>
  typeof client === 'string' ? client : client.name || client.email || client.username || client._id;

const getGatewayName = (gateway: PaymentRequest['paymentGatewayId'], language: string) =>
  typeof gateway === 'string' ? gateway : getLocalized(gateway.name, language);

const getCurrency = (currency: PaymentRequest['currencyId']) =>
  !currency || typeof currency === 'string' ? '' : currency.shortName;

export default function ManagePaymentsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [params, setParams] = useState<PaymentRequestQuery>({ page: 1, limit: 10, status: '', search: '', gatewayKind: 'BANK' });
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const { data: paymentsResponse, isLoading } = useAdminPaymentRequests(params);
  const approveMutation = useApprovePaymentRequest();
  const rejectMutation = useRejectPaymentRequest();
  const payments = paymentsResponse?.data || [];

  const review = (action: 'approve' | 'reject') => {
    if (!selected) return;
    const payload = { id: selected._id, adminComment };
    if (action === 'approve') {
      approveMutation.mutate(payload, { onSuccess: () => setSelected(null) });
    } else {
      rejectMutation.mutate(payload, { onSuccess: () => setSelected(null) });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title={t('payments.manageTitle')} description={t('payments.manageDescription')} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('payments.manageTitle')}</h1>
          <p className="text-sm text-slate-500">{t('payments.manageDescription')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[240px_180px]">
          <Input
            value={params.search}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, search: event.target.value }))}
            placeholder={t('payments.searchPlaceholder')}
          />
          <Select
            value={params.status}
            onChange={(event) => setParams((current) => ({ ...current, page: 1, status: event.target.value as PaymentRequestQuery['status'] }))}
            options={[
              { value: '', label: t('common.all') },
              { value: 'PENDING', label: t('payments.statuses.PENDING') },
              { value: 'APPROVED', label: t('payments.statuses.APPROVED') },
              { value: 'REJECTED', label: t('payments.statuses.REJECTED') },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-secondary">
        <div className="grid grid-cols-[1.2fr_1fr_110px_110px_110px_120px] gap-4 border-b border-white/10 bg-slate-900/40 px-4 py-3 text-xs font-bold uppercase text-slate-400">
          <span>{t('payments.client')}</span>
          <span>{t('payments.method')}</span>
          <span>{t('payments.amount')}</span>
          <span>{t('payments.payable')}</span>
          <span>{t('payments.status')}</span>
          <span>{t('common.actions')}</span>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">{t('common.loading')}</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">{t('payments.empty')}</div>
        ) : (
          payments.map((payment) => (
            <div key={payment._id} className="grid grid-cols-[1.2fr_1fr_110px_110px_110px_120px] gap-4 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
              <div className="min-w-0">
                <div className="truncate font-bold">{getClientName(payment.clientId)}</div>
                <div className="truncate text-xs text-slate-500">{typeof payment.clientId === 'string' ? '' : payment.clientId.email}</div>
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{getGatewayName(payment.paymentGatewayId, language)}</div>
                <div className="text-xs text-slate-500">{formatDate(payment.createdAt, language)}</div>
              </div>
              <span>{payment.amount.toFixed(2)} {getCurrency(payment.currencyId)}</span>
              <span>{payment.payableAmount.toFixed(2)} {getCurrency(payment.currencyId)}</span>
              <PaymentStatusBadge status={payment.status} />
              <Button size="sm" variant="ghost" leftIcon={<Eye size={15} />} onClick={() => { setSelected(payment); setAdminComment(payment.adminComment || ''); }}>
                {t('common.view')}
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Select
          value={String(params.limit)}
          onChange={(event) => setParams((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
          options={[10, 50, 100, 300].map((value) => ({ value: String(value), label: String(value) }))}
          className="w-28"
        />
        <Pagination total={paymentsResponse?.meta?.total ?? 0} page={params.page || 1} limit={params.limit || 10} onChange={(page) => setParams((current) => ({ ...current, page }))} />
      </div>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={t('payments.details')} size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock label={t('payments.client')} value={getClientName(selected.clientId)} />
              <InfoBlock label={t('payments.method')} value={getGatewayName(selected.paymentGatewayId, language)} />
              <InfoBlock label={t('payments.status')} value={t(`payments.statuses.${selected.status}`)} />
              <InfoBlock label={t('payments.amount')} value={`${selected.amount.toFixed(2)} ${getCurrency(selected.currencyId)}`} />
              <InfoBlock label={t('payments.tax')} value={`${selected.taxAmount.toFixed(2)} ${getCurrency(selected.currencyId)}`} />
              <InfoBlock label={t('payments.credit')} value={`$${selected.creditedAmount.toFixed(2)}`} />
            </div>

            {selected.proofImage && (
              <div>
                <div className="mb-2 text-sm font-bold">{t('payments.proofImage')}</div>
                <a href={selected.proofImage.secureUrl} target="_blank" rel="noreferrer">
                  <img src={selected.proofImage.secureUrl} alt="" className="max-h-80 rounded-xl border border-white/10 object-contain" />
                </a>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-bold">{t('payments.clientInputs')}</div>
              {selected.inputs.length === 0 ? (
                <div className="text-sm text-slate-500">{t('payments.noInputs')}</div>
              ) : selected.inputs.map((input) => (
                <div key={input.key} className="rounded-lg bg-slate-900/40 p-3">
                  <div className="text-xs font-bold text-slate-500">{getLocalized(input.label, language, input.key)}</div>
                  <div className="break-words text-sm">{input.value || '-'}</div>
                </div>
              ))}
            </div>

            {selected.clientComment && <InfoBlock label={t('payments.clientComment')} value={selected.clientComment} />}
            <div>
              <label className="mb-2 block text-sm font-bold">{t('payments.adminComment')}</label>
              <textarea
                value={adminComment}
                onChange={(event) => setAdminComment(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {selected.status === 'PENDING' && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="danger" leftIcon={<X size={16} />} onClick={() => review('reject')} isLoading={rejectMutation.isPending}>
                  {t('payments.reject')}
                </Button>
                <Button leftIcon={<Check size={16} />} onClick={() => review('approve')} isLoading={approveMutation.isPending}>
                  {t('payments.approve')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentRequest['status'] }) {
  const { t } = useTranslation();
  const variant = status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning';
  return <Badge variant={variant}>{t(`payments.statuses.${status}`)}</Badge>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900/40 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold">{value || '-'}</div>
    </div>
  );
}
