import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, ImageIcon, PackagePlus } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Table } from '@/shared/components/ui/Table';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { useLanguageStore } from '@/app/stores/language.store';
import { useCreateStockService, useReorderStockServices, useStockServices, useUpdateStockService } from '@/features/stocks/hooks/stock-services.hooks';
import {
  LocalizedText,
  StockService,
  StockServiceType,
  stockServiceTypes,
} from '@/features/stocks/types/stock-service.types';
import { toast } from 'sonner';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;

export default function StockServicesPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [name, setName] = useState<LocalizedText>(emptyLocalizedText);
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [type, setType] = useState<StockServiceType>('DIGITAL_BASICS');
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<StockService | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockServiceType | ''>('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [deleteFilter, setDeleteFilter] = useState('');

  const { data: servicesResponse, isLoading } = useStockServices({
    page,
    limit,
    search,
    type: typeFilter,
    isVisible: visibilityFilter,
    isDeleted: deleteFilter,
  });
  const { mutate: createService, isPending } = useCreateStockService();
  const { mutate: updateService, isPending: isUpdating } = useUpdateStockService();
  const { mutate: reorderServices } = useReorderStockServices();

  useEffect(() => {
    setPageTitle(t('stocks.services.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.services.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const typeOptions = useMemo(
    () =>
      stockServiceTypes.map((serviceType) => ({
        value: serviceType,
        label: t(`stocks.serviceTypes.${serviceType}`),
      })),
    [t]
  );

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const resetForm = () => {
    setName({ ...emptyLocalizedText });
    setDescription({ ...emptyLocalizedText });
    setType('DIGITAL_BASICS');
    setIsVisible(true);
    setIsDeleted(false);
    setImage(null);
    setUploadKey((currentKey) => currentKey + 1);
  };

  const closeCreateModal = () => {
    resetForm();
    setIsCreateOpen(false);
    setEditingService(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingService(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (service: StockService) => {
    setName({ ...service.name });
    setDescription({ ...service.description });
    setType(service.type);
    setIsVisible(service.isVisible);
    setIsDeleted(service.isDeleted);
    setImage(null);
    setUploadKey((currentKey) => currentKey + 1);
    setEditingService(service);
    setIsCreateOpen(true);
  };

  const updateLocalizedField = (
    setter: (value: LocalizedText) => void,
    currentValue: LocalizedText,
    code: keyof LocalizedText,
    value: string
  ) => {
    setter({ ...currentValue, [code]: value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingService && !image) {
      toast.error(t('stocks.services.imageRequired'));
      return;
    }

    if (editingService) {
      updateService(
        { id: editingService._id, data: { name, description, type, isVisible, isDeleted, image } },
        { onSuccess: closeCreateModal }
      );
      return;
    }

    createService({ name, description, type, isVisible, isDeleted, image: image! }, { onSuccess: closeCreateModal });
  };

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const columns = [
    {
      key: 'service',
      header: t('stocks.services.service'),
      render: (service: StockService) => (
        <div className="flex items-center gap-3">
          {service.image?.secureUrl ? (
            <img
              src={service.image.secureUrl}
              alt={getLocalizedValue(service.name)}
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(service.name)}</div>
            <div className="max-w-md truncate text-xs text-slate-400">
              {getLocalizedValue(service.description)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('stocks.services.type'),
      render: (service: StockService) => (
        <Badge variant="info">{t(`stocks.serviceTypes.${service.type}`)}</Badge>
      ),
    },
    {
      key: 'visibility',
      header: t('stocks.services.visibility'),
      render: (service: StockService) => (
        <Badge variant={service.isVisible ? 'success' : 'default'}>
          {service.isVisible ? t('stocks.services.visible') : t('stocks.services.hidden')}
        </Badge>
      ),
    },
    {
      key: 'deleteStatus',
      header: t('stocks.services.deleteStatus'),
      render: (service: StockService) => (
        <Badge variant={service.isDeleted ? 'danger' : 'outline'}>
          {service.isDeleted ? t('stocks.services.softDeleted') : t('stocks.services.active')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('runtime.created'),
      render: (service: StockService) => new Date(service.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (service: StockService) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(service)} leftIcon={<Edit size={16} />}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const services = [...(servicesResponse?.data || [])];
    const [movedService] = services.splice(fromIndex, 1);
    if (!movedService) return;
    services.splice(toIndex, 0, movedService);
    reorderServices(services.map((service) => service._id));
  };

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.services.title')} description={t('stocks.services.description')} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.services.title')}</h1>
          <PackagePlus size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal} leftIcon={<PackagePlus size={18} />}>
          {t('stocks.services.create')}
        </Button>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-800 bg-background/40 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label={t('common.search')}
          value={search}
          placeholder={t('stocks.services.searchPlaceholder')}
          onChange={(event) => updateFilter(setSearch, event.target.value)}
        />
        <Select
          label={t('stocks.services.type')}
          value={typeFilter}
          options={[{ value: '', label: t('stocks.services.allTypes') }, ...typeOptions]}
          onChange={(event) => {
            setTypeFilter(event.target.value as StockServiceType | '');
            setPage(1);
          }}
        />
        <Select
          label={t('stocks.services.visibility')}
          value={visibilityFilter}
          options={[
            { value: '', label: t('stocks.services.allVisibility') },
            { value: 'true', label: t('stocks.services.visible') },
            { value: 'false', label: t('stocks.services.hidden') },
          ]}
          onChange={(event) => updateFilter(setVisibilityFilter, event.target.value)}
        />
        <Select
          label={t('stocks.services.deleteStatus')}
          value={deleteFilter}
          options={[
            { value: '', label: t('stocks.services.allDeleteStatuses') },
            { value: 'false', label: t('stocks.services.active') },
            { value: 'true', label: t('stocks.services.softDeleted') },
          ]}
          onChange={(event) => updateFilter(setDeleteFilter, event.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={servicesResponse?.data || []}
        isLoading={isLoading}
        getRowKey={(service) => service._id}
        onRowDragEnd={handleReorder}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.services.rowsPerPage')}</span>
          <Select
            value={String(limit)}
            options={[
              { value: 10, label: '10' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
              { value: 300, label: '300' },
            ]}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="w-28"
          />
        </div>
        <Pagination
          total={servicesResponse?.meta?.total ?? 0}
          page={page}
          limit={limit}
          onChange={setPage}
        />
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title={editingService ? t('stocks.services.update') : t('stocks.services.create')}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Input
                key={code}
                label={t('stocks.services.nameByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={name[code]}
                onChange={(event) => updateLocalizedField(setName, name, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Textarea
                key={code}
                label={t('stocks.services.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={description[code]}
                onChange={(event) => updateLocalizedField(setDescription, description, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
            <Select
              label={t('stocks.services.type')}
              value={type}
              options={typeOptions}
              onChange={(event) => setType(event.target.value as StockServiceType)}
            />
            <div className="flex items-end">
              <Switch
                label={t('stocks.services.showService')}
                checked={isVisible}
                onChange={(event) => setIsVisible(event.target.checked)}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label={t('stocks.services.markDeleted')}
                checked={isDeleted}
                onChange={(event) => setIsDeleted(event.target.checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold">{t('stocks.services.image')}</h2>
            {editingService?.image?.secureUrl && !image && (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
                <img
                  src={editingService.image.secureUrl}
                  alt={getLocalizedValue(editingService.name)}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <span className="text-sm text-slate-400">{t('stocks.services.keepCurrentImage')}</span>
              </div>
            )}
            <FileUpload
              key={uploadKey}
              accept="image/jpeg,image/png,image/webp"
              maxSize={5 * 1024 * 1024}
              onFile={setImage}
              onClear={() => setImage(null)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingService ? t('stocks.services.update') : t('stocks.services.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
