import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Edit, ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Table } from '@/shared/components/ui/Table';
import { Textarea } from '@/shared/components/ui/Textarea';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import {
  PaymentGatewayInfoField,
  paymentGatewayInfoTypes,
  PaymentGatewayKind,
  paymentGatewayKinds,
  PaymentGatewayLocalizedText,
  PaymentGatewayTaxType,
  paymentGatewayTaxTypes,
  SettingsPaymentGateway,
} from '@/features/settings/types/settings.types';
import {
  useCreateSettingsPaymentGateway,
  useSettingsCurrencies,
  useSettingsPaymentGateways,
  useUpdateSettingsPaymentGateway,
} from '@/features/settings/hooks/settings.hooks';

const emptyLocalizedText: PaymentGatewayLocalizedText = { en: '', fr: '', ar: '' };
const uploadPlaceholder = '__UPLOAD__';
const supportedLanguages = ['en', 'fr', 'ar'] as const;
const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

const createEmptyInfoField = (): PaymentGatewayInfoField => ({
  label: { ...emptyLocalizedText },
  type: 'TEXT',
  value: '',
});

export default function SettingsPaymentGatewaysPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingsPaymentGateway | null>(null);
  const [kind, setKind] = useState<PaymentGatewayKind>('PAYMENT_GATEWAY');
  const [name, setName] = useState<PaymentGatewayLocalizedText>(emptyLocalizedText);
  const [link, setLink] = useState('');
  const [token, setToken] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [description, setDescription] = useState<PaymentGatewayLocalizedText>(emptyLocalizedText);
  const [infoFields, setInfoFields] = useState<PaymentGatewayInfoField[]>([]);
  const [taxType, setTaxType] = useState<PaymentGatewayTaxType>('INCREASE');
  const [taxValue, setTaxValue] = useState('');
  const [minMoney, setMinMoney] = useState('');
  const [maxMoney, setMaxMoney] = useState('');
  const [requiresImage, setRequiresImage] = useState(false);
  const [requiresSerialNumber, setRequiresSerialNumber] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [infoFieldFiles, setInfoFieldFiles] = useState<Record<number, File | null>>({});
  const [uploadKey, setUploadKey] = useState(0);

  const { data: itemsResponse, isLoading } = useSettingsPaymentGateways({ page, limit });
  const { data: currenciesResponse } = useSettingsCurrencies({ page: 1, limit: 300 });
  const { mutate: createItem, isPending } = useCreateSettingsPaymentGateway();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateSettingsPaymentGateway();

  useEffect(() => {
    setPageTitle(t('adminSettings.paymentGateways.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.paymentGateways.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: PaymentGatewayLocalizedText) => {
    const key = language.split('-')[0] as keyof PaymentGatewayLocalizedText;
    return value[key] || value.en;
  };

  const updateLocalizedField = (
    setter: (value: PaymentGatewayLocalizedText) => void,
    currentValue: PaymentGatewayLocalizedText,
    code: keyof PaymentGatewayLocalizedText,
    value: string
  ) => setter({ ...currentValue, [code]: value });

  const kindOptions = useMemo(() => paymentGatewayKinds.map((item) => ({ value: item, label: t(`adminSettings.paymentGatewayKinds.${item}`) })), [t]);
  const taxTypeOptions = useMemo(() => paymentGatewayTaxTypes.map((item) => ({ value: item, label: t(`adminSettings.paymentGatewayTaxTypes.${item}`) })), [t]);
  const infoTypeOptions = useMemo(() => paymentGatewayInfoTypes.map((item) => ({ value: item, label: t(`adminSettings.paymentGatewayInfoTypes.${item}`) })), [t]);
  const currencyOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.paymentGateways.selectCurrency') },
      ...(currenciesResponse?.data || []).map((currency) => ({ value: currency._id, label: `${currency.name} (${currency.shortName})` })),
    ],
    [currenciesResponse?.data, t]
  );

  const resetForm = () => {
    setKind('PAYMENT_GATEWAY');
    setName({ ...emptyLocalizedText });
    setLink('');
    setToken('');
    setCurrencyId('');
    setDescription({ ...emptyLocalizedText });
    setInfoFields([]);
    setTaxType('INCREASE');
    setTaxValue('');
    setMinMoney('');
    setMaxMoney('');
    setRequiresImage(false);
    setRequiresSerialNumber(false);
    setIsVisible(true);
    setIsDeleted(false);
    setImage(null);
    setInfoFieldFiles({});
    setEditingItem(null);
    setUploadKey((key) => key + 1);
  };

  const closeModal = () => {
    resetForm();
    setIsOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditModal = (item: SettingsPaymentGateway) => {
    setKind(item.kind);
    setName({ ...item.name });
    setLink(item.link || '');
    setToken('');
    setCurrencyId(getCurrencyId(item.currencyId));
    setDescription({ ...(item.description || emptyLocalizedText) });
    setInfoFields(item.infoFields || []);
    setTaxType(item.taxType);
    setTaxValue(String(item.taxValue ?? 0));
    setMinMoney(String(item.minMoney));
    setMaxMoney(String(item.maxMoney));
    setRequiresImage(item.requiresImage);
    setRequiresSerialNumber(item.requiresSerialNumber);
    setIsVisible(item.isVisible);
    setIsDeleted(item.isDeleted);
    setImage(null);
    setInfoFieldFiles({});
    setEditingItem(item);
    setUploadKey((key) => key + 1);
    setIsOpen(true);
  };

  const updateInfoField = (index: number, patch: Partial<PaymentGatewayInfoField>) => {
    setInfoFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  };

  const updateInfoFieldType = (index: number, type: PaymentGatewayInfoField['type']) => {
    setInfoFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, type, value: type === 'TEXT' ? '' : field.value } : field));
    if (type === 'TEXT') {
      setInfoFieldFiles((current) => ({ ...current, [index]: null }));
    }
  };

  const removeInfoField = (index: number) => {
    setInfoFields((fields) => fields.filter((_, fieldIndex) => fieldIndex !== index));
    setInfoFieldFiles((current) => {
      const next: Record<number, File | null> = {};
      Object.entries(current).forEach(([key, file]) => {
        const oldIndex = Number(key);
        if (oldIndex < index) next[oldIndex] = file;
        if (oldIndex > index) next[oldIndex - 1] = file;
      });
      return next;
    });
  };

  const updateInfoFieldLabel = (index: number, code: keyof PaymentGatewayLocalizedText, value: string) => {
    setInfoFields((current) =>
      current.map((field, fieldIndex) => fieldIndex === index ? { ...field, label: { ...field.label, [code]: value } } : field)
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem && !image) {
      toast.error(t('adminSettings.paymentGateways.imageRequired'));
      return;
    }

    const normalizedInfoFields = infoFields.map((field, index) => {
      if ((field.type === 'IMAGE' || field.type === 'QR_CODE') && infoFieldFiles[index]) {
        return { ...field, value: uploadPlaceholder };
      }
      return field;
    });

    const missingInfoFile = kind === 'BANK' && normalizedInfoFields.some((field, index) =>
      (field.type === 'IMAGE' || field.type === 'QR_CODE') && !field.value && !infoFieldFiles[index]
    );
    if (missingInfoFile) {
      toast.error(t('adminSettings.paymentGateways.infoFileRequired'));
      return;
    }

    const payload = {
      kind,
      name,
      link,
      token,
      currencyId,
      description,
      infoFields: normalizedInfoFields,
      infoFiles: infoFields.map((_, index) => infoFieldFiles[index] || null),
      taxType,
      taxValue: Number(taxValue),
      minMoney: Number(minMoney),
      maxMoney: Number(maxMoney),
      requiresImage,
      requiresSerialNumber,
      isVisible,
      isDeleted,
      image,
    };

    if (editingItem) {
      updateItem({ id: editingItem._id, data: payload }, { onSuccess: closeModal });
      return;
    }

    createItem({ ...payload, image: image! }, { onSuccess: closeModal });
  };

  const columns = [
    {
      key: 'gateway',
      header: t('adminSettings.paymentGateways.gateway'),
      render: (item: SettingsPaymentGateway) => (
        <div className="flex items-center gap-3">
          {item.image?.secureUrl ? (
            <img src={item.image.secureUrl} alt={getLocalizedValue(item.name)} className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(item.name)}</div>
            <div className="text-xs text-slate-400">{t(`adminSettings.paymentGatewayKinds.${item.kind}`)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'taxType',
      header: t('adminSettings.paymentGateways.taxType'),
      render: (item: SettingsPaymentGateway) => <Badge variant="info">{t(`adminSettings.paymentGatewayTaxTypes.${item.taxType}`)}: {item.taxValue ?? 0}</Badge>,
    },
    { key: 'limits', header: t('adminSettings.paymentGateways.moneyLimits'), render: (item: SettingsPaymentGateway) => `${item.minMoney} - ${item.maxMoney}` },
    {
      key: 'requirements',
      header: t('adminSettings.paymentGateways.requirements'),
      render: (item: SettingsPaymentGateway) => (
        <div className="flex flex-wrap gap-2">
          {item.requiresImage && <Badge variant="outline">{t('adminSettings.paymentGateways.clientImage')}</Badge>}
          {item.requiresSerialNumber && <Badge variant="outline">{t('adminSettings.paymentGateways.serialNumber')}</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('adminSettings.deleteStatus'),
      render: (item: SettingsPaymentGateway) => <Badge variant={item.isDeleted ? 'danger' : 'outline'}>{item.isDeleted ? t('adminSettings.softDeleted') : t('adminSettings.active')}</Badge>,
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (item: SettingsPaymentGateway) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} leftIcon={<Edit size={16} />}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.paymentGateways.title')} description={t('adminSettings.paymentGateways.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('adminSettings.paymentGateways.title')}</h1>
          <CreditCard size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>{t('adminSettings.paymentGateways.create')}</Button>
      </div>

      <Table columns={columns} data={itemsResponse?.data || []} isLoading={isLoading} getRowKey={(item) => item._id} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('adminSettings.rowsPerPage')}</span>
          <Select value={String(limit)} options={pageSizeOptions} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="w-28" />
        </div>
        <Pagination total={itemsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={editingItem ? t('adminSettings.paymentGateways.update') : t('adminSettings.paymentGateways.create')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select label={t('adminSettings.paymentGateways.kind')} value={kind} options={kindOptions} onChange={(event) => setKind(event.target.value as PaymentGatewayKind)} />
          <div className="grid gap-4 md:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Input key={code} label={t('adminSettings.paymentGateways.nameByLanguage', { language: t(`stocks.languages.${code}`) })} value={name[code]} onChange={(event) => updateLocalizedField(setName, name, code, event.target.value)} required />
            ))}
          </div>

          {kind === 'PAYMENT_GATEWAY' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label={t('adminSettings.paymentGateways.link')} value={link} onChange={(event) => setLink(event.target.value)} required />
              <Input label={t('adminSettings.paymentGateways.token')} value={token} onChange={(event) => setToken(event.target.value)} required={!editingItem} />
            </div>
          ) : (
            <div className="space-y-6">
              <Select label={t('adminSettings.paymentGateways.currency')} value={currencyId} options={currencyOptions} onChange={(event) => setCurrencyId(event.target.value)} required />
              <div className="grid gap-4 md:grid-cols-3">
                {supportedLanguages.map((code) => (
                  <Textarea key={code} label={t('adminSettings.paymentGateways.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })} value={description[code]} onChange={(event) => updateLocalizedField(setDescription, description, code, event.target.value)} required />
                ))}
              </div>
              <div className="rounded-lg border border-white/10 bg-background/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold">{t('adminSettings.paymentGateways.infoFields')}</h2>
                  <Button type="button" size="sm" onClick={() => setInfoFields((fields) => [...fields, createEmptyInfoField()])} leftIcon={<Plus size={16} />}>{t('adminSettings.paymentGateways.addField')}</Button>
                </div>
                <div className="space-y-4">
                  {infoFields.map((field, index) => (
                    <div key={index} className="rounded-md bg-secondary p-3">
                      <div className="mb-3 flex justify-end">
                        <Button type="button" variant="danger" size="sm" className="h-8 w-8 px-0" onClick={() => removeInfoField(index)}><Trash2 size={14} /></Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input label={t('adminSettings.paymentGateways.fieldArabic')} value={field.label.ar} onChange={(event) => updateInfoFieldLabel(index, 'ar', event.target.value)} required />
                        <Input label={t('adminSettings.paymentGateways.fieldEnglish')} value={field.label.en} onChange={(event) => updateInfoFieldLabel(index, 'en', event.target.value)} required />
                        <Input label={t('adminSettings.paymentGateways.fieldFrench')} value={field.label.fr} onChange={(event) => updateInfoFieldLabel(index, 'fr', event.target.value)} required />
                        <Select label={t('adminSettings.paymentGateways.fieldType')} value={field.type} options={infoTypeOptions} onChange={(event) => updateInfoFieldType(index, event.target.value as PaymentGatewayInfoField['type'])} />
                        {field.type === 'TEXT' ? (
                          <Input label={t('adminSettings.paymentGateways.fieldValue')} value={field.value} onChange={(event) => updateInfoField(index, { value: event.target.value })} required />
                        ) : (
                          <div className="space-y-2 md:col-span-2">
                            {field.value && !infoFieldFiles[index] && (
                              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
                                <img src={field.value} alt={getLocalizedValue(field.label)} className="h-12 w-12 rounded-md object-cover" />
                                <span className="text-sm text-slate-400">{t('adminSettings.paymentGateways.keepCurrentInfoFile')}</span>
                              </div>
                            )}
                            <FileUpload
                              key={`info-${index}-${field.type}`}
                              accept="image/jpeg,image/png,image/webp"
                              maxSize={5 * 1024 * 1024}
                              onFile={(file) => setInfoFieldFiles((current) => ({ ...current, [index]: file }))}
                              onClear={() => setInfoFieldFiles((current) => ({ ...current, [index]: null }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Select label={t('adminSettings.paymentGateways.taxType')} value={taxType} options={taxTypeOptions} onChange={(event) => setTaxType(event.target.value as PaymentGatewayTaxType)} />
            <Input type="number" min="0" step="0.0001" label={t('adminSettings.paymentGateways.taxValue')} value={taxValue} onChange={(event) => setTaxValue(event.target.value)} required />
            <Input type="number" min="0" step="0.0001" label={t('adminSettings.paymentGateways.minMoney')} value={minMoney} onChange={(event) => setMinMoney(event.target.value)} required />
            <Input type="number" min="0" step="0.0001" label={t('adminSettings.paymentGateways.maxMoney')} value={maxMoney} onChange={(event) => setMaxMoney(event.target.value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Switch label={t('adminSettings.paymentGateways.clientImage')} checked={requiresImage} onChange={(event) => setRequiresImage(event.target.checked)} />
            <Switch label={t('adminSettings.paymentGateways.serialNumber')} checked={requiresSerialNumber} onChange={(event) => setRequiresSerialNumber(event.target.checked)} />
            <Switch label={t('adminSettings.show')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
            <Switch label={t('adminSettings.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          </div>
          {editingItem?.image?.secureUrl && !image && (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
              <img src={editingItem.image.secureUrl} alt={getLocalizedValue(editingItem.name)} className="h-12 w-12 rounded-md object-cover" />
              <span className="text-sm text-slate-400">{t('adminSettings.paymentGateways.keepCurrentImage')}</span>
            </div>
          )}
          <FileUpload key={uploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setImage} onClear={() => setImage(null)} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>{editingItem ? t('adminSettings.paymentGateways.update') : t('adminSettings.paymentGateways.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const getCurrencyId = (currency?: SettingsPaymentGateway['currencyId']) => {
  if (!currency) return '';
  return typeof currency === 'string' ? currency : currency._id;
};
