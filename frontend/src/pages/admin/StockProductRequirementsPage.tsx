import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, ListChecks, Trash2 } from 'lucide-react';
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
import { apiGroups, ApiGroup } from '@/features/settings/types/settings.types';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import {
  requirementInputTypes,
  RequirementInputType,
  StockProductRequirement,
  StockProductRequirementPayload,
} from '@/features/stocks/types/stock-product-requirement.types';
import {
  useCreateStockProductRequirement,
  useStockProductRequirements,
  useUpdateStockProductRequirement,
} from '@/features/stocks/hooks/stock-product-requirements.hooks';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;
const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function StockProductRequirementsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [apiGroupFilter, setApiGroupFilter] = useState('');
  const [deleteFilter, setDeleteFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<StockProductRequirement | null>(null);
  const [paramsName, setParamsName] = useState('');
  const [message, setMessage] = useState<LocalizedText>(emptyLocalizedText);
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [apiGroup, setApiGroup] = useState<ApiGroup>('TEMPORARY_NUMBER_CODING_SITES');
  const [inputType, setInputType] = useState<RequirementInputType>('TEXT');
  const [defaultValue, setDefaultValue] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: requirementsResponse, isLoading } = useStockProductRequirements({
    page,
    limit,
    search: search || undefined,
    apiGroup: apiGroupFilter ? (apiGroupFilter as ApiGroup) : undefined,
    isDeleted: deleteFilter ? deleteFilter === 'deleted' : undefined,
  });
  const { mutate: createRequirement, isPending } = useCreateStockProductRequirement();
  const { mutate: updateRequirement, isPending: isUpdating } = useUpdateStockProductRequirement();

  useEffect(() => {
    setPageTitle(t('stocks.productRequirements.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.productRequirements.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const resetForm = () => {
    setParamsName('');
    setMessage({ ...emptyLocalizedText });
    setDescription({ ...emptyLocalizedText });
    setApiGroup('TEMPORARY_NUMBER_CODING_SITES');
    setInputType('TEXT');
    setDefaultValue('');
    setIsRequired(false);
    setIsDeleted(false);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingRequirement(null);
    setIsOpen(true);
  };

  const openEditModal = (requirement: StockProductRequirement) => {
    setParamsName(requirement.paramsName);
    setMessage({ ...requirement.message });
    setDescription({ ...requirement.description });
    setApiGroup(requirement.apiGroup);
    setInputType(requirement.inputType);
    setDefaultValue(requirement.defaultValue || '');
    setIsRequired(requirement.isRequired);
    setIsDeleted(requirement.isDeleted);
    setEditingRequirement(requirement);
    setIsOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setEditingRequirement(null);
    setIsOpen(false);
  };

  const updateLocalizedField = (
    setter: (value: LocalizedText) => void,
    currentValue: LocalizedText,
    code: keyof LocalizedText,
    value: string
  ) => {
    setter({ ...currentValue, [code]: value });
  };

  const buildPayload = (overrides: Partial<StockProductRequirementPayload> = {}): StockProductRequirementPayload => ({
    paramsName,
    message,
    description,
    apiGroup,
    inputType,
    defaultValue: defaultValue || undefined,
    isRequired,
    isDeleted,
    ...overrides,
  });

  const requirementToPayload = (
    requirement: StockProductRequirement,
    overrides: Partial<StockProductRequirementPayload> = {}
  ): StockProductRequirementPayload => ({
    paramsName: requirement.paramsName,
    message: requirement.message,
    description: requirement.description,
    apiGroup: requirement.apiGroup,
    inputType: requirement.inputType,
    defaultValue: requirement.defaultValue,
    isRequired: requirement.isRequired,
    isDeleted: requirement.isDeleted,
    ...overrides,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingRequirement) {
      updateRequirement({ id: editingRequirement._id, data: buildPayload() }, { onSuccess: closeModal });
      return;
    }

    createRequirement(buildPayload(), { onSuccess: closeModal });
  };

  const handleSoftDelete = (requirement: StockProductRequirement) => {
    updateRequirement({ id: requirement._id, data: requirementToPayload(requirement, { isDeleted: true }) });
  };

  const columns = [
    { key: 'paramsName', header: t('stocks.productRequirements.paramsName'), render: (item: StockProductRequirement) => <span className="font-bold">{item.paramsName}</span> },
    { key: 'message', header: t('stocks.productRequirements.message'), render: (item: StockProductRequirement) => getLocalizedValue(item.message) },
    { key: 'apiGroup', header: t('stocks.productRequirements.apiGroup'), render: (item: StockProductRequirement) => <Badge variant="info">{t(`adminSettings.apiGroups.${item.apiGroup}`)}</Badge> },
    { key: 'inputType', header: t('stocks.productRequirements.inputType'), render: (item: StockProductRequirement) => t(`stocks.requirementInputTypes.${item.inputType}`) },
    { key: 'defaultValue', header: t('stocks.productRequirements.defaultValue'), render: (item: StockProductRequirement) => item.defaultValue || '-' },
    {
      key: 'required',
      header: t('stocks.productRequirements.required'),
      render: (item: StockProductRequirement) => <Badge variant={item.isRequired ? 'warning' : 'outline'}>{item.isRequired ? t('runtime.yes') : t('runtime.no')}</Badge>,
    },
    {
      key: 'deleteStatus',
      header: t('adminSettings.deleteStatus'),
      render: (item: StockProductRequirement) => <Badge variant={item.isDeleted ? 'danger' : 'outline'}>{item.isDeleted ? t('adminSettings.softDeleted') : t('adminSettings.active')}</Badge>,
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (item: StockProductRequirement) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} leftIcon={<Edit size={16} />}>
            {t('common.edit')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleSoftDelete(item)} leftIcon={<Trash2 size={16} />} disabled={item.isDeleted}>
            {t('stocks.productRequirements.softDelete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.productRequirements.title')} description={t('stocks.productRequirements.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.productRequirements.title')}</h1>
          <ListChecks size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal}>{t('stocks.productRequirements.create')}</Button>
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-secondary p-4 lg:grid-cols-3">
        <Input
          label={t('common.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label={t('stocks.productRequirements.apiGroup')}
          value={apiGroupFilter}
          options={[{ value: '', label: t('stocks.productRequirements.allApiGroups') }, ...apiGroups.map((item) => ({ value: item, label: t(`adminSettings.apiGroups.${item}`) }))]}
          onChange={(event) => {
            setApiGroupFilter(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label={t('adminSettings.deleteStatus')}
          value={deleteFilter}
          options={[
            { value: '', label: t('stocks.products.allDeleteStatuses') },
            { value: 'active', label: t('adminSettings.active') },
            { value: 'deleted', label: t('adminSettings.softDeleted') },
          ]}
          onChange={(event) => {
            setDeleteFilter(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table columns={columns} data={requirementsResponse?.data || []} isLoading={isLoading} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.productRequirements.rowsPerPage')}</span>
          <Select
            value={String(limit)}
            options={pageSizeOptions}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="w-28"
          />
        </div>
        <Pagination total={requirementsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={editingRequirement ? t('stocks.productRequirements.update') : t('stocks.productRequirements.create')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Input label={t('stocks.productRequirements.paramsName')} value={paramsName} onChange={(event) => setParamsName(event.target.value)} required />
            <Select
              label={t('stocks.productRequirements.apiGroup')}
              value={apiGroup}
              options={apiGroups.map((item) => ({ value: item, label: t(`adminSettings.apiGroups.${item}`) }))}
              onChange={(event) => setApiGroup(event.target.value as ApiGroup)}
            />
            <Select
              label={t('stocks.productRequirements.inputType')}
              value={inputType}
              options={requirementInputTypes.map((item) => ({ value: item, label: t(`stocks.requirementInputTypes.${item}`) }))}
              onChange={(event) => setInputType(event.target.value as RequirementInputType)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Textarea
                key={code}
                label={t('stocks.productRequirements.messageByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={message[code]}
                onChange={(event) => updateLocalizedField(setMessage, message, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Textarea
                key={code}
                label={t('stocks.productRequirements.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={description[code]}
                onChange={(event) => updateLocalizedField(setDescription, description, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Input label={t('stocks.productRequirements.defaultValue')} value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} />
            <div className="flex items-end">
              <Switch label={t('stocks.productRequirements.required')} checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Switch label={t('adminSettings.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingRequirement ? t('stocks.productRequirements.update') : t('stocks.productRequirements.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
