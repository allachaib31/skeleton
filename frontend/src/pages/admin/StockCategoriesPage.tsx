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
import { useCreateStockCategory, useReorderStockCategories, useStockCategories, useUpdateStockCategory } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import { toast } from 'sonner';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;

export default function StockCategoriesPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [name, setName] = useState<LocalizedText>(emptyLocalizedText);
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [serviceId, setServiceId] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StockCategory | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [deleteFilter, setDeleteFilter] = useState('');

  const { data: categoriesResponse, isLoading } = useStockCategories({
    page,
    limit,
    search,
    serviceId: serviceFilter,
    isVisible: visibilityFilter,
    isDeleted: deleteFilter,
  });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { mutate: createCategory, isPending } = useCreateStockCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateStockCategory();
  const { mutate: reorderCategories } = useReorderStockCategories();

  useEffect(() => {
    setPageTitle(t('stocks.categories.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.categories.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const serviceOptions = useMemo(
    () =>
      (servicesResponse?.data || []).map((service) => ({
        value: service._id,
        label: getLocalizedValue(service.name),
      })),
    [servicesResponse?.data, language]
  );

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const resetForm = () => {
    setName({ ...emptyLocalizedText });
    setDescription({ ...emptyLocalizedText });
    setServiceId('');
    setIsVisible(true);
    setIsDeleted(false);
    setImage(null);
    setUploadKey((currentKey) => currentKey + 1);
  };

  const closeCreateModal = () => {
    resetForm();
    setIsCreateOpen(false);
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCategory(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (category: StockCategory) => {
    setName({ ...category.name });
    setDescription({ ...category.description });
    setServiceId(typeof category.serviceId === 'string' ? category.serviceId : category.serviceId._id);
    setIsVisible(category.isVisible);
    setIsDeleted(category.isDeleted);
    setImage(null);
    setUploadKey((currentKey) => currentKey + 1);
    setEditingCategory(category);
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

    if (!editingCategory && !image) {
      toast.error(t('stocks.categories.imageRequired'));
      return;
    }

    if (!serviceId) {
      toast.error(t('stocks.categories.serviceRequired'));
      return;
    }

    if (editingCategory) {
      updateCategory(
        { id: editingCategory._id, data: { name, description, serviceId, isVisible, isDeleted, image } },
        { onSuccess: closeCreateModal }
      );
      return;
    }

    createCategory({ name, description, serviceId, isVisible, isDeleted, image: image! }, { onSuccess: closeCreateModal });
  };

  const getCategoryService = (category: StockCategory) => {
    return typeof category.serviceId === 'string' ? null : category.serviceId;
  };

  const columns = [
    {
      key: 'category',
      header: t('stocks.categories.category'),
      render: (category: StockCategory) => (
        <div className="flex items-center gap-3">
          {category.image?.secureUrl ? (
            <img
              src={category.image.secureUrl}
              alt={getLocalizedValue(category.name)}
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(category.name)}</div>
            <div className="max-w-md truncate text-xs text-slate-400">
              {getLocalizedValue(category.description)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: t('stocks.categories.relatedService'),
      render: (category: StockCategory) => (
        <Badge variant="info">
          {getCategoryService(category) ? getLocalizedValue(getCategoryService(category)!.name) : t('stocks.categories.unknownService')}
        </Badge>
      ),
    },
    {
      key: 'visibility',
      header: t('stocks.categories.visibility'),
      render: (category: StockCategory) => (
        <Badge variant={category.isVisible ? 'success' : 'default'}>
          {category.isVisible ? t('stocks.categories.visible') : t('stocks.categories.hidden')}
        </Badge>
      ),
    },
    {
      key: 'deleteStatus',
      header: t('stocks.categories.deleteStatus'),
      render: (category: StockCategory) => (
        <Badge variant={category.isDeleted ? 'danger' : 'outline'}>
          {category.isDeleted ? t('stocks.categories.softDeleted') : t('stocks.categories.active')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('runtime.created'),
      render: (category: StockCategory) => new Date(category.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (category: StockCategory) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(category)} leftIcon={<Edit size={16} />}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const categories = [...(categoriesResponse?.data || [])];
    const [movedCategory] = categories.splice(fromIndex, 1);
    if (!movedCategory) return;
    categories.splice(toIndex, 0, movedCategory);
    reorderCategories(categories.map((category) => category._id));
  };

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.categories.title')} description={t('stocks.categories.description')} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.categories.title')}</h1>
          <PackagePlus size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal} leftIcon={<PackagePlus size={18} />}>
          {t('stocks.categories.create')}
        </Button>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-800 bg-background/40 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label={t('common.search')}
          value={search}
          placeholder={t('stocks.categories.searchPlaceholder')}
          onChange={(event) => updateFilter(setSearch, event.target.value)}
        />
        <Select
          label={t('stocks.categories.relatedService')}
          value={serviceFilter}
          options={[{ value: '', label: t('stocks.categories.allServices') }, ...serviceOptions]}
          onChange={(event) => updateFilter(setServiceFilter, event.target.value)}
        />
        <Select
          label={t('stocks.categories.visibility')}
          value={visibilityFilter}
          options={[
            { value: '', label: t('stocks.categories.allVisibility') },
            { value: 'true', label: t('stocks.categories.visible') },
            { value: 'false', label: t('stocks.categories.hidden') },
          ]}
          onChange={(event) => updateFilter(setVisibilityFilter, event.target.value)}
        />
        <Select
          label={t('stocks.categories.deleteStatus')}
          value={deleteFilter}
          options={[
            { value: '', label: t('stocks.categories.allDeleteStatuses') },
            { value: 'false', label: t('stocks.categories.active') },
            { value: 'true', label: t('stocks.categories.softDeleted') },
          ]}
          onChange={(event) => updateFilter(setDeleteFilter, event.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={categoriesResponse?.data || []}
        isLoading={isLoading}
        getRowKey={(category) => category._id}
        onRowDragEnd={handleReorder}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.categories.rowsPerPage')}</span>
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
          total={categoriesResponse?.meta?.total ?? 0}
          page={page}
          limit={limit}
          onChange={setPage}
        />
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title={editingCategory ? t('stocks.categories.update') : t('stocks.categories.create')}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Input
                key={code}
                label={t('stocks.categories.nameByLanguage', { language: t(`stocks.languages.${code}`) })}
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
                label={t('stocks.categories.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={description[code]}
                onChange={(event) => updateLocalizedField(setDescription, description, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
            <Select
              label={t('stocks.categories.relatedService')}
              value={serviceId}
              options={[{ value: '', label: t('stocks.categories.selectService') }, ...serviceOptions]}
              onChange={(event) => setServiceId(event.target.value)}
              required
            />
            <div className="flex items-end">
              <Switch
                label={t('stocks.categories.showCategory')}
                checked={isVisible}
                onChange={(event) => setIsVisible(event.target.checked)}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label={t('stocks.categories.markDeleted')}
                checked={isDeleted}
                onChange={(event) => setIsDeleted(event.target.checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold">{t('stocks.categories.image')}</h2>
            {editingCategory?.image?.secureUrl && !image && (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
                <img
                  src={editingCategory.image.secureUrl}
                  alt={getLocalizedValue(editingCategory.name)}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <span className="text-sm text-slate-400">{t('stocks.categories.keepCurrentImage')}</span>
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
              {editingCategory ? t('stocks.categories.update') : t('stocks.categories.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
