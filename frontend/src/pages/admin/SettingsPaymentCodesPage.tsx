import { FormEvent, useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { Textarea } from '@/shared/components/ui/Textarea';
import {
  useCreatePaymentCode,
  useGeneratePaymentCodes,
  useImportPaymentCodes,
  usePaymentCodeJournal,
  usePaymentCodes,
  useSettingsCurrencies,
  useUpdatePaymentCode,
} from '@/features/settings/hooks/settings.hooks';
import {
  PaymentCode,
  PaymentCodeJournal,
  paymentCodeJournalReasons,
  PaymentCodeJournalReason,
  PaymentCodeJournalStatus,
  paymentCodeStatuses,
  PaymentCodeStatus,
} from '@/features/settings/types/settings.types';

type Mode = 'single' | 'generate' | 'import';

export default function SettingsPaymentCodesPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState<'codes' | 'journal'>('codes');
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', currencyId: '', status: '' as PaymentCodeStatus | '' });
  const [journalParams, setJournalParams] = useState({ page: 1, limit: 10, status: '' as PaymentCodeJournalStatus | '', reason: '' as PaymentCodeJournalReason | '' });
  const [mode, setMode] = useState<Mode>('single');
  const [isOpen, setOpen] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [form, setForm] = useState({ code: '', prefix: '', count: '10', codes: '', value: '', currencyId: '', expiresAt: '', notes: '' });

  const { data: codesResponse, isLoading } = usePaymentCodes(params);
  const { data: journalResponse, isLoading: isJournalLoading } = usePaymentCodeJournal(journalParams);
  const { data: currenciesResponse } = useSettingsCurrencies({ page: 1, limit: 300 });
  const { mutate: createCode, isPending: isCreating } = useCreatePaymentCode();
  const { mutate: generateCodes, isPending: isGenerating } = useGeneratePaymentCodes();
  const { mutate: importCodes, isPending: isImporting } = useImportPaymentCodes();
  const { mutate: updateCode, isPending: isUpdating } = useUpdatePaymentCode();

  useEffect(() => {
    setPageTitle(t('adminSettings.paymentCodes.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.paymentCodes.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const currencyOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.paymentCodes.allCurrencies') },
      ...(currenciesResponse?.data || []).map((currency) => ({ value: currency._id, label: `${currency.name} (${currency.shortName})` })),
    ],
    [currenciesResponse?.data, t]
  );

  const resetForm = () => {
    setForm({ code: '', prefix: '', count: '10', codes: '', value: '', currencyId: '', expiresAt: '', notes: '' });
  };

  const closeModal = () => {
    resetForm();
    setGeneratedCodes([]);
    setOpen(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const base = {
      value: Number(form.value),
      currencyId: form.currencyId,
      expiresAt: form.expiresAt,
      notes: form.notes,
    };
    if (mode === 'single') {
      createCode({ ...base, code: form.code }, { onSuccess: (response) => setGeneratedCodes([response.data.plainCode]) });
    }
    if (mode === 'generate') {
      generateCodes({ ...base, prefix: form.prefix, count: Number(form.count) }, { onSuccess: (response) => setGeneratedCodes(response.data.plainCodes) });
    }
    if (mode === 'import') {
      importCodes({ ...base, codes: form.codes }, { onSuccess: closeModal });
    }
  };

  const maskCode = (code: PaymentCode) => `${code.codePrefix ? `${code.codePrefix}-` : ''}••••-••••-${code.codeLast4}`;

  const codeColumns = [
    { key: 'code', header: t('adminSettings.paymentCodes.code'), render: (code: PaymentCode) => <span className="font-mono">{maskCode(code)}</span> },
    { key: 'value', header: t('adminSettings.paymentCodes.value'), render: (code: PaymentCode) => `${code.value} ${typeof code.currencyId === 'string' ? '' : code.currencyId.shortName}` },
    { key: 'status', header: t('adminSettings.paymentCodes.status'), render: (code: PaymentCode) => <Badge variant="outline">{t(`adminSettings.paymentCodeStatuses.${code.status}`)}</Badge> },
    { key: 'usedBy', header: t('adminSettings.paymentCodes.usedBy'), render: (code: PaymentCode) => code.usedByClientId ? `${code.usedByClientId.name} (${code.usedByClientId.email})` : '-' },
    { key: 'expiresAt', header: t('adminSettings.paymentCodes.expiresAt'), render: (code: PaymentCode) => code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '-' },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (code: PaymentCode) => (
        <div className="flex gap-2">
          <Select
            value={code.status}
            options={paymentCodeStatuses.map((status) => ({ value: status, label: t(`adminSettings.paymentCodeStatuses.${status}`) }))}
            onChange={(event) => updateCode({ id: code._id, data: { status: event.target.value as PaymentCodeStatus } })}
            disabled={code.status === 'USED' || isUpdating}
            className="w-36"
          />
          <Button type="button" size="sm" variant="ghost" onClick={() => updateCode({ id: code._id, data: { isDeleted: true } })} disabled={isUpdating} aria-label={t('common.delete')} title={t('common.delete')}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const journalColumns = [
    { key: 'code', header: t('adminSettings.paymentCodes.code'), render: (item: PaymentCodeJournal) => <span className="font-mono">{item.codePrefix ? `${item.codePrefix}-` : ''}••••-{item.codeLast4 || '----'}</span> },
    { key: 'client', header: t('clients.client'), render: (item: PaymentCodeJournal) => item.clientId ? `${item.clientId.name} (${item.clientId.email})` : '-' },
    { key: 'status', header: t('adminSettings.paymentCodes.status'), render: (item: PaymentCodeJournal) => <Badge variant={item.status === 'SUCCESS' ? 'success' : 'danger'}>{t(`adminSettings.paymentCodeJournalStatuses.${item.status}`)}</Badge> },
    { key: 'reason', header: t('adminSettings.paymentCodes.reason'), render: (item: PaymentCodeJournal) => t(`adminSettings.paymentCodeJournalReasons.${item.reason}`) },
    { key: 'ip', header: t('adminSettings.paymentCodes.ip'), render: (item: PaymentCodeJournal) => item.ip || '-' },
    { key: 'createdAt', header: t('clients.date'), render: (item: PaymentCodeJournal) => new Date(item.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.paymentCodes.title')} description={t('adminSettings.paymentCodes.description')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('adminSettings.paymentCodes.title')}</h1>
          <KeyRound size={24} className="text-primary" />
        </div>
        <Button type="button" onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>{t('adminSettings.paymentCodes.create')}</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === 'codes' ? 'primary' : 'outline'} onClick={() => setTab('codes')}>{t('adminSettings.paymentCodes.codes')}</Button>
        <Button type="button" variant={tab === 'journal' ? 'primary' : 'outline'} onClick={() => setTab('journal')}>{t('adminSettings.paymentCodes.journal')}</Button>
      </div>

      {tab === 'codes' ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={params.search} onChange={(event) => setParams((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder={t('common.search')} />
            <Select value={params.currencyId} options={currencyOptions} onChange={(event) => setParams((current) => ({ ...current, currencyId: event.target.value, page: 1 }))} />
            <Select value={params.status} options={[{ value: '', label: t('common.all') }, ...paymentCodeStatuses.map((status) => ({ value: status, label: t(`adminSettings.paymentCodeStatuses.${status}`) }))]} onChange={(event) => setParams((current) => ({ ...current, status: event.target.value as PaymentCodeStatus | '', page: 1 }))} />
            <Select value={String(params.limit)} options={[10, 50, 100, 300].map((value) => ({ value, label: String(value) }))} onChange={(event) => setParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
          </div>
          <Table columns={codeColumns} data={codesResponse?.data || []} isLoading={isLoading} emptyMessage={t('adminSettings.paymentCodes.empty')} getRowKey={(code) => code._id} />
          <Pagination total={codesResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />
        </>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={journalParams.status} options={[{ value: '', label: t('common.all') }, { value: 'SUCCESS', label: t('adminSettings.paymentCodeJournalStatuses.SUCCESS') }, { value: 'FAILED', label: t('adminSettings.paymentCodeJournalStatuses.FAILED') }]} onChange={(event) => setJournalParams((current) => ({ ...current, status: event.target.value as PaymentCodeJournalStatus | '', page: 1 }))} />
            <Select value={journalParams.reason} options={[{ value: '', label: t('common.all') }, ...paymentCodeJournalReasons.map((reason) => ({ value: reason, label: t(`adminSettings.paymentCodeJournalReasons.${reason}`) }))]} onChange={(event) => setJournalParams((current) => ({ ...current, reason: event.target.value as PaymentCodeJournalReason | '', page: 1 }))} />
            <Select value={String(journalParams.limit)} options={[10, 50, 100, 300].map((value) => ({ value, label: String(value) }))} onChange={(event) => setJournalParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
          </div>
          <Table columns={journalColumns} data={journalResponse?.data || []} isLoading={isJournalLoading} emptyMessage={t('adminSettings.paymentCodes.journalEmpty')} getRowKey={(item) => item._id} />
          <Pagination total={journalResponse?.meta?.total ?? 0} page={journalParams.page} limit={journalParams.limit} onChange={(page) => setJournalParams((current) => ({ ...current, page }))} />
        </>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} title={t('adminSettings.paymentCodes.create')} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Select label={t('adminSettings.paymentCodes.mode')} value={mode} options={[
            { value: 'single', label: t('adminSettings.paymentCodes.single') },
            { value: 'generate', label: t('adminSettings.paymentCodes.generate') },
            { value: 'import', label: t('adminSettings.paymentCodes.import') },
          ]} onChange={(event) => { setMode(event.target.value as Mode); setGeneratedCodes([]); }} />
          {mode === 'single' && <Input label={t('adminSettings.paymentCodes.codeOptional')} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />}
          {mode === 'generate' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input label={t('adminSettings.paymentCodes.prefix')} value={form.prefix} onChange={(event) => setForm((current) => ({ ...current, prefix: event.target.value }))} />
              <Input label={t('adminSettings.paymentCodes.count')} type="number" min="1" max="500" value={form.count} onChange={(event) => setForm((current) => ({ ...current, count: event.target.value }))} required />
            </div>
          )}
          {mode === 'import' && <Textarea label={t('adminSettings.paymentCodes.codesInput')} value={form.codes} onChange={(event) => setForm((current) => ({ ...current, codes: event.target.value }))} rows={8} required />}
          <div className="grid gap-3 md:grid-cols-2">
            <Input label={t('adminSettings.paymentCodes.value')} type="number" min="0" step="0.0001" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} required />
            <Select label={t('adminSettings.paymentCodes.currency')} value={form.currencyId} options={currencyOptions} onChange={(event) => setForm((current) => ({ ...current, currencyId: event.target.value }))} required />
          </div>
          <Input label={t('adminSettings.paymentCodes.expiresAt')} type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
          <Textarea label={t('adminSettings.paymentCodes.notes')} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          {generatedCodes.length > 0 && <Textarea label={t('adminSettings.paymentCodes.generatedCodes')} value={generatedCodes.join('\n')} readOnly rows={8} />}
          <div className="flex justify-end">
            <Button type="submit" isLoading={isCreating || isGenerating || isImporting}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
