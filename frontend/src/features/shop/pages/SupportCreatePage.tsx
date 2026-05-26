import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Btn } from '../components/primitives';
import { Icon, IconName } from '../components/Icon';
import { useCreateProblemReport } from '@/features/problem-reports/problem-reports.hooks';
import { ProblemReportPriority, ProblemReportType } from '@/features/problem-reports/problem-reports.types';

const TYPES: ProblemReportType[] = ['ORDER', 'PAYMENT', 'WALLET', 'PRODUCT', 'API_PROVIDER', 'WAREHOUSE', 'ACCOUNT_SECURITY', 'REFUND', 'GENERAL'];
const PRIORITIES: ProblemReportPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const TYPE_ICONS: Record<ProblemReportType, IconName> = {
  ORDER: 'package',
  PAYMENT: 'wallet',
  WALLET: 'receipt',
  PRODUCT: 'gift',
  API_PROVIDER: 'globe',
  WAREHOUSE: 'qr',
  ACCOUNT_SECURITY: 'shield',
  REFUND: 'refresh',
  GENERAL: 'headphones',
};

type DetailKey =
  | 'orderIssue'
  | 'expectedResult'
  | 'paymentReference'
  | 'paidAmount'
  | 'walletIssue'
  | 'expectedBalance'
  | 'productIssue'
  | 'providerIssue'
  | 'warehouseIssue'
  | 'securityEvent'
  | 'deviceInfo'
  | 'refundReason'
  | 'generalContext';

const DETAIL_FIELDS: Record<ProblemReportType, DetailKey[]> = {
  ORDER: ['orderIssue', 'expectedResult'],
  PAYMENT: ['paymentReference', 'paidAmount'],
  WALLET: ['walletIssue', 'expectedBalance'],
  PRODUCT: ['productIssue', 'expectedResult'],
  API_PROVIDER: ['providerIssue', 'expectedResult'],
  WAREHOUSE: ['warehouseIssue', 'expectedResult'],
  ACCOUNT_SECURITY: ['securityEvent', 'deviceInfo'],
  REFUND: ['refundReason', 'expectedResult'],
  GENERAL: ['generalContext'],
};

export default function SupportCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateProblemReport();
  const [type, setType] = useState<ProblemReportType>('GENERAL');
  const [priority, setPriority] = useState<ProblemReportPriority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedOrderId, setRelatedOrderId] = useState('');
  const [relatedPaymentRequestId, setRelatedPaymentRequestId] = useState('');
  const [relatedFinancialMovementId, setRelatedFinancialMovementId] = useState('');
  const [relatedProductId, setRelatedProductId] = useState('');
  const [relatedServiceId, setRelatedServiceId] = useState('');
  const [relatedCategoryId, setRelatedCategoryId] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});

  const visibleRelationFields = getRelationFields(type);
  const visibleDetailFields = DETAIL_FIELDS[type];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const enrichedDescription = buildDescription(description, visibleDetailFields, details, t);
    createMutation.mutate(
      {
        type,
        priority,
        subject,
        description: enrichedDescription,
        relatedOrderId: visibleRelationFields.includes('relatedOrderId') ? relatedOrderId.trim() || undefined : undefined,
        relatedPaymentRequestId: visibleRelationFields.includes('relatedPaymentRequestId') ? relatedPaymentRequestId.trim() || undefined : undefined,
        relatedFinancialMovementId: visibleRelationFields.includes('relatedFinancialMovementId') ? relatedFinancialMovementId.trim() || undefined : undefined,
        relatedProductId: visibleRelationFields.includes('relatedProductId') ? relatedProductId.trim() || undefined : undefined,
        relatedServiceId: visibleRelationFields.includes('relatedServiceId') ? relatedServiceId.trim() || undefined : undefined,
        relatedCategoryId: visibleRelationFields.includes('relatedCategoryId') ? relatedCategoryId.trim() || undefined : undefined,
      },
      {
        onSuccess: (response) => navigate(`/shop/support/${response.data.report._id}`),
      },
    );
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <div className="text-3xl font-black" style={{ letterSpacing: '-0.03em' }}>{t('problemReports.createTitle')}</div>
        <div className="text-[13px] text-gray-500">{t('problemReports.subtitle')}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={clsx(
              'min-h-[118px] rounded-2xl border p-4 text-left transition',
              type === item
                ? 'border-[#100E22] bg-[#100E22] text-white shadow-lg shadow-[#100E22]/10'
                : 'border-gray-200 bg-white text-[#100E22] hover:border-[#100E22]/40',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={clsx('grid h-9 w-9 place-items-center rounded-xl', type === item ? 'bg-primary text-[#100E22]' : 'bg-[#F8FAFC] text-[#100E22]')}>
                <Icon name={TYPE_ICONS[item]} size={18} />
              </span>
              <span className="font-black">{t(`problemReports.types.${item}`)}</span>
            </div>
            <p className={clsx('text-xs leading-snug', type === item ? 'text-white/70' : 'text-gray-500')}>
              {t(`problemReports.typeDescriptions.${item}`)}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-gray-500">{t('problemReports.priority')}</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as ProblemReportPriority)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]">
            {PRIORITIES.map((item) => <option key={item} value={item}>{t(`problemReports.priorities.${item}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-xs font-bold text-gray-500">{t('problemReports.subject')}</span>
          <input required value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]" />
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-xs font-bold text-gray-500">{t('problemReports.description')}</span>
          <textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={7} className="rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold outline-none focus:border-[#100E22]" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-lg font-black text-[#100E22]">{t('problemReports.contextTitle')}</div>
            <div className="text-xs text-gray-500">{t('problemReports.optionalReference')}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            {visibleRelationFields.includes('relatedOrderId') && (
              <ReferenceInput label={t('problemReports.selectOrder')} value={relatedOrderId} onChange={setRelatedOrderId} />
            )}
            {visibleRelationFields.includes('relatedPaymentRequestId') && (
              <ReferenceInput label={t('problemReports.selectPayment')} value={relatedPaymentRequestId} onChange={setRelatedPaymentRequestId} />
            )}
            {visibleRelationFields.includes('relatedFinancialMovementId') && (
              <ReferenceInput label={t('problemReports.relatedFinancialMovement')} value={relatedFinancialMovementId} onChange={setRelatedFinancialMovementId} />
            )}
            {visibleRelationFields.includes('relatedServiceId') && (
              <ReferenceInput label={t('problemReports.relatedService')} value={relatedServiceId} onChange={setRelatedServiceId} />
            )}
            {visibleRelationFields.includes('relatedCategoryId') && (
              <ReferenceInput label={t('problemReports.relatedCategory')} value={relatedCategoryId} onChange={setRelatedCategoryId} />
            )}
            {visibleRelationFields.includes('relatedProductId') && (
              <ReferenceInput label={t('problemReports.relatedProduct')} value={relatedProductId} onChange={setRelatedProductId} />
            )}
            {visibleRelationFields.length === 0 && (
              <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm font-semibold text-gray-500">{t(`problemReports.typeDescriptions.${type}`)}</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-lg font-black text-[#100E22]">{t('problemReports.detailsTitle')}</div>
            <div className="text-xs text-gray-500">{t('problemReports.detailsHint')}</div>
          </div>
          <div className="grid gap-3">
            {visibleDetailFields.map((field) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-500">{t(`problemReports.typeFields.${field}`)}</span>
                <input
                  value={details[field] || ''}
                  onChange={(event) => setDetails((current) => ({ ...current, [field]: event.target.value }))}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Btn type="submit" icon="plus" disabled={createMutation.isPending}>{t('common.create')}</Btn>
          <Btn type="button" kind="outline" onClick={() => navigate('/shop/support')}>{t('common.cancel')}</Btn>
        </div>
      </div>
    </form>
  );
}

type RelationField =
  | 'relatedOrderId'
  | 'relatedPaymentRequestId'
  | 'relatedFinancialMovementId'
  | 'relatedProductId'
  | 'relatedServiceId'
  | 'relatedCategoryId';

function getRelationFields(type: ProblemReportType): RelationField[] {
  if (type === 'ORDER') return ['relatedOrderId'];
  if (type === 'PAYMENT') return ['relatedPaymentRequestId'];
  if (type === 'WALLET') return ['relatedFinancialMovementId', 'relatedPaymentRequestId'];
  if (type === 'PRODUCT') return ['relatedServiceId', 'relatedCategoryId', 'relatedProductId'];
  if (type === 'API_PROVIDER') return ['relatedServiceId', 'relatedCategoryId', 'relatedProductId'];
  if (type === 'WAREHOUSE') return ['relatedOrderId', 'relatedProductId'];
  if (type === 'REFUND') return ['relatedOrderId', 'relatedPaymentRequestId'];
  return [];
}

function ReferenceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
      />
    </label>
  );
}

function buildDescription(
  baseDescription: string,
  fields: DetailKey[],
  details: Record<string, string>,
  t: (key: string) => string,
) {
  const rows = fields
    .map((field) => ({ label: t(`problemReports.typeFields.${field}`), value: details[field]?.trim() }))
    .filter((item) => item.value);
  if (!rows.length) return baseDescription;
  return [
    baseDescription.trim(),
    '',
    '---',
    ...rows.map((item) => `${item.label}: ${item.value}`),
  ].join('\n');
}
