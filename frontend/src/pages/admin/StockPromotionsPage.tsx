import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgePercent, Edit, Plus, Trash2 } from 'lucide-react';
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
import { Tabs } from '@/shared/components/ui/Tabs';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useAdminClients } from '@/features/clients/hooks/clients.hooks';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProductGroups } from '@/features/stocks/hooks/stock-product-groups.hooks';
import { useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServiceGroups } from '@/features/stocks/hooks/stock-service-groups.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import {
  useCreateStockPromotion,
  useStockPromotions,
  useStockPromotionUsages,
  useUpdateStockPromotion,
} from '@/features/stocks/hooks/stock-promotions.hooks';
import {
  StockPromotion,
  StockPromotionTargetType,
  StockPromotionType,
  stockPromotionTargetTypes,
  stockPromotionTypes,
  StockPromotionUsage,
} from '@/features/stocks/types/stock-promotion.types';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const languageKeys: (keyof LocalizedText)[] = ['en', 'fr', 'ar'];
const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

const toDateTimeInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function StockPromotionsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [activeTab, setActiveTab] = useState('promotions');
  const [page, setPage] = useState(1);
  const [usagePage, setUsagePage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [usageLimit, setUsageLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<StockPromotion | null>(null);
  const [name, setName] = useState<LocalizedText>(emptyLocalizedText);
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [promotionType, setPromotionType] = useState<StockPromotionType>('PERCENT');
  const [value, setValue] = useState('');
  const [targetType, setTargetType] = useState<StockPromotionTargetType>('ALL_PRODUCTS');
  const [targetId, setTargetId] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startAt, setStartAt] = useState(toDateTimeInput(new Date().toISOString()));
  const [endAt, setEndAt] = useState('');
  const [priority, setPriority] = useState('0');
  const [usageLimitValue, setUsageLimitValue] = useState('');
  const [perClientLimit, setPerClientLimit] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: promotionsResponse, isLoading } = useStockPromotions({
    page,
    limit,
    search: search || undefined,
    targetType: targetFilter as StockPromotionTargetType || undefined,
    promotionType: typeFilter as StockPromotionType || undefined,
  });
  const { data: usagesResponse, isLoading: isUsageLoading } = useStockPromotionUsages({ page: usagePage, limit: usageLimit });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: productsResponse } = useStockProducts({ page: 1, limit: 300 });
  const { data: productGroupsResponse } = useStockProductGroups({ page: 1, limit: 300 });
  const { data: serviceGroupsResponse } = useStockServiceGroups({ page: 1, limit: 300 });
  const { data: clientsResponse } = useAdminClients({ page: 1, limit: 300 });
  const { mutate: createPromotion, isPending } = useCreateStockPromotion();
  const { mutate: updatePromotion, isPending: isUpdating } = useUpdateStockPromotion();

  useEffect(() => {
    setPageTitle(t('stocks.promotions.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.promotions.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const promotionTypeOptions = useMemo(
    () => stockPromotionTypes.map((type) => ({ value: type, label: t(`stocks.promotionTypes.${type}`) })),
    [t]
  );

  const targetTypeOptions = useMemo(
    () => stockPromotionTargetTypes.map((type) => ({ value: type, label: t(`stocks.promotionTargetTypes.${type}`) })),
    [t]
  );

  const targetOptions = useMemo(() => {
    if (targetType === 'ALL_PRODUCTS') return [];
    if (targetType === 'SERVICE') {
      return (servicesResponse?.data || []).map((service) => ({ value: service._id, label: getLocalizedValue(service.name) }));
    }
    if (targetType === 'CATEGORY') {
      return (categoriesResponse?.data || []).map((category) => ({ value: category._id, label: getLocalizedValue(category.name) }));
    }
    if (targetType === 'PRODUCT') {
      return (productsResponse?.data || []).map((product) => ({ value: product._id, label: getLocalizedValue(product.name) }));
    }
    if (targetType === 'PRODUCT_GROUP') {
      return (productGroupsResponse?.data || []).map((group) => ({ value: group._id, label: getLocalizedValue(group.name) }));
    }
    if (targetType === 'CLIENT') {
      return (clientsResponse?.data || []).map((client) => ({ value: client._id, label: client.name || client.email }));
    }
    return (serviceGroupsResponse?.data || []).map((group) => ({ value: group._id, label: group.name }));
  }, [
    targetType,
    servicesResponse?.data,
    categoriesResponse?.data,
    productsResponse?.data,
    productGroupsResponse?.data,
    clientsResponse?.data,
    serviceGroupsResponse?.data,
    language,
  ]);

  const filterTargetTypeOptions = useMemo(
    () => [{ value: '', label: t('stocks.promotions.allTargets') }, ...targetTypeOptions],
    [targetTypeOptions, t]
  );

  const filterPromotionTypeOptions = useMemo(
    () => [{ value: '', label: t('stocks.promotions.allTypes') }, ...promotionTypeOptions],
    [promotionTypeOptions, t]
  );

  const resetForm = () => {
    setName(emptyLocalizedText);
    setDescription(emptyLocalizedText);
    setPromotionType('PERCENT');
    setValue('');
    setTargetType('ALL_PRODUCTS');
    setTargetId('');
    setMinOrderAmount('');
    setMaxDiscountAmount('');
    setStartAt(toDateTimeInput(new Date().toISOString()));
    setEndAt('');
    setPriority('0');
    setUsageLimitValue('');
    setPerClientLimit('');
    setIsActive(true);
    setIsDeleted(false);
    setEditingPromotion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsOpen(false);
  };

  const getTargetId = (promotion: StockPromotion) => {
    const target = promotion.targetType;
    const targetValue = target === 'SERVICE'
      ? promotion.serviceId
      : target === 'CATEGORY'
        ? promotion.categoryId
        : target === 'PRODUCT'
          ? promotion.productId
          : target === 'PRODUCT_GROUP'
            ? promotion.productGroupId
            : target === 'CLIENT'
              ? promotion.clientId
              : promotion.clientLevelGroupId;

    return typeof targetValue === 'string' ? targetValue : targetValue?._id || '';
  };

  const openEditModal = (promotion: StockPromotion) => {
    setEditingPromotion(promotion);
    setName(promotion.name);
    setDescription(promotion.description);
    setPromotionType(promotion.promotionType);
    setValue(String(promotion.value));
    setTargetType(promotion.targetType);
    setTargetId(getTargetId(promotion));
    setMinOrderAmount(promotion.minOrderAmount !== undefined ? String(promotion.minOrderAmount) : '');
    setMaxDiscountAmount(promotion.maxDiscountAmount !== undefined ? String(promotion.maxDiscountAmount) : '');
    setStartAt(toDateTimeInput(promotion.startAt));
    setEndAt(toDateTimeInput(promotion.endAt));
    setPriority(String(promotion.priority));
    setUsageLimitValue(promotion.usageLimit !== undefined ? String(promotion.usageLimit) : '');
    setPerClientLimit(promotion.perClientLimit !== undefined ? String(promotion.perClientLimit) : '');
    setIsActive(promotion.isActive);
    setIsDeleted(promotion.isDeleted);
    setIsOpen(true);
  };

  const updateLocalizedValue = (setter: (value: LocalizedText) => void, current: LocalizedText, key: keyof LocalizedText, value: string) => {
    setter({ ...current, [key]: value });
  };

  const buildTargetPayload = () => {
    if (targetType === 'ALL_PRODUCTS') return {};
    if (!targetId) {
      toast.error(t('stocks.promotions.targetRequired'));
      return null;
    }
    if (targetType === 'SERVICE') return { serviceId: targetId };
    if (targetType === 'CATEGORY') return { categoryId: targetId };
    if (targetType === 'PRODUCT') return { productId: targetId };
    if (targetType === 'PRODUCT_GROUP') return { productGroupId: targetId };
    if (targetType === 'CLIENT') return { clientId: targetId };
    return { clientLevelGroupId: targetId };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetPayload = buildTargetPayload();
    if (!targetPayload) return;

    const payload = {
      name,
      description,
      promotionType,
      value: Number(value),
      targetType,
      ...targetPayload,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      priority: Number(priority),
      usageLimit: usageLimitValue ? Number(usageLimitValue) : undefined,
      perClientLimit: perClientLimit ? Number(perClientLimit) : undefined,
      isActive,
      isDeleted,
    };

    if (editingPromotion) {
      updatePromotion({ id: editingPromotion._id, data: payload }, { onSuccess: closeModal });
      return;
    }

    createPromotion(payload, { onSuccess: closeModal });
  };

  const softDeletePromotion = (promotion: StockPromotion) => {
    updatePromotion({ id: promotion._id, data: { isDeleted: true, isActive: false } });
  };

  const getTargetLabel = (promotion: StockPromotion) => {
    if (promotion.targetType === 'ALL_PRODUCTS') return t('stocks.promotionTargetTypes.ALL_PRODUCTS');
    if (promotion.targetType === 'SERVICE' && promotion.serviceId && typeof promotion.serviceId !== 'string') return getLocalizedValue(promotion.serviceId.name);
    if (promotion.targetType === 'CATEGORY' && promotion.categoryId && typeof promotion.categoryId !== 'string') return getLocalizedValue(promotion.categoryId.name);
    if (promotion.targetType === 'PRODUCT' && promotion.productId && typeof promotion.productId !== 'string') return getLocalizedValue(promotion.productId.name);
    if (promotion.targetType === 'PRODUCT_GROUP' && promotion.productGroupId && typeof promotion.productGroupId !== 'string') return getLocalizedValue(promotion.productGroupId.name);
    if (promotion.targetType === 'CLIENT' && promotion.clientId && typeof promotion.clientId !== 'string') return promotion.clientId.name || promotion.clientId.email;
    if (promotion.targetType === 'CLIENT_LEVEL_GROUP' && promotion.clientLevelGroupId && typeof promotion.clientLevelGroupId !== 'string') return promotion.clientLevelGroupId.name;
    return t('stocks.promotions.unknownTarget');
  };

  const getUsageName = (usage: StockPromotionUsage, field: 'promotionId' | 'clientId' | 'productId') => {
    if (field === 'clientId' && usage.clientId && typeof usage.clientId !== 'string') return usage.clientId.name || usage.clientId.email;
    if (field === 'promotionId' && usage.promotionId && typeof usage.promotionId !== 'string') return getLocalizedValue(usage.promotionId.name);
    if (field === 'productId' && usage.productId && typeof usage.productId !== 'string') return getLocalizedValue(usage.productId.name);
    return t('stocks.promotions.unknownTarget');
  };

  const columns = [
    {
      key: 'name',
      header: t('stocks.promotions.name'),
      render: (promotion: StockPromotion) => <span className="font-bold">{getLocalizedValue(promotion.name)}</span>,
    },
    {
      key: 'target',
      header: t('stocks.promotions.target'),
      render: (promotion: StockPromotion) => (
        <div>
          <div>{getTargetLabel(promotion)}</div>
          <div className="text-xs text-slate-500">{t(`stocks.promotionTargetTypes.${promotion.targetType}`)}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('stocks.promotions.type'),
      render: (promotion: StockPromotion) => <Badge variant="info">{t(`stocks.promotionTypes.${promotion.promotionType}`)}</Badge>,
    },
    {
      key: 'value',
      header: t('stocks.promotions.value'),
      render: (promotion: StockPromotion) => promotion.value,
    },
    {
      key: 'priority',
      header: t('stocks.promotions.priority'),
      render: (promotion: StockPromotion) => promotion.priority,
    },
    {
      key: 'usage',
      header: t('stocks.promotions.usage'),
      render: (promotion: StockPromotion) => `${promotion.usageCount}${promotion.usageLimit ? ` / ${promotion.usageLimit}` : ''}`,
    },
    {
      key: 'status',
      header: t('stocks.promotions.status'),
      render: (promotion: StockPromotion) => (
        <Badge variant={promotion.isDeleted ? 'danger' : promotion.isActive ? 'success' : 'default'}>
          {promotion.isDeleted
            ? t('stocks.promotions.softDeleted')
            : promotion.isActive
              ? t('stocks.promotions.active')
              : t('stocks.promotions.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (promotion: StockPromotion) => (
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 px-0" aria-label={t('common.edit')} title={t('common.edit')} onClick={() => openEditModal(promotion)}>
            <Edit size={16} />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 px-0 text-red-500 hover:text-red-600" aria-label={t('stocks.promotions.softDelete')} title={t('stocks.promotions.softDelete')} disabled={promotion.isDeleted} onClick={() => softDeletePromotion(promotion)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const usageColumns = [
    {
      key: 'promotion',
      header: t('stocks.promotions.promotion'),
      render: (usage: StockPromotionUsage) => getUsageName(usage, 'promotionId'),
    },
    {
      key: 'client',
      header: t('stocks.promotions.client'),
      render: (usage: StockPromotionUsage) => getUsageName(usage, 'clientId'),
    },
    {
      key: 'product',
      header: t('stocks.promotions.product'),
      render: (usage: StockPromotionUsage) => getUsageName(usage, 'productId'),
    },
    {
      key: 'discount',
      header: t('stocks.promotions.discountAmount'),
      render: (usage: StockPromotionUsage) => usage.discountAmount,
    },
    {
      key: 'finalPrice',
      header: t('stocks.promotions.finalPrice'),
      render: (usage: StockPromotionUsage) => usage.finalPrice,
    },
    {
      key: 'createdAt',
      header: t('runtime.created'),
      render: (usage: StockPromotionUsage) => new Date(usage.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.promotions.title')} description={t('stocks.promotions.description')} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.promotions.title')}</h1>
          <BadgePercent size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
          {t('stocks.promotions.create')}
        </Button>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'promotions', label: t('stocks.promotions.promotionsTab') },
          { value: 'usages', label: t('stocks.promotions.usagesTab') },
        ]}
      />

      {activeTab === 'promotions' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              value={search}
              placeholder={t('runtime.search')}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Select
              value={targetFilter}
              options={filterTargetTypeOptions}
              onChange={(event) => {
                setTargetFilter(event.target.value);
                setPage(1);
              }}
            />
            <Select
              value={typeFilter}
              options={filterPromotionTypeOptions}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <Table columns={columns} data={promotionsResponse?.data || []} isLoading={isLoading} getRowKey={(promotion) => promotion._id} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{t('stocks.promotions.rowsPerPage')}</span>
              <Select value={String(limit)} options={pageSizeOptions} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="w-28" />
            </div>
            <Pagination total={promotionsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
          </div>
        </>
      ) : (
        <>
          <Table columns={usageColumns} data={usagesResponse?.data || []} isLoading={isUsageLoading} getRowKey={(usage) => usage._id} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{t('stocks.promotions.rowsPerPage')}</span>
              <Select value={String(usageLimit)} options={pageSizeOptions} onChange={(event) => { setUsageLimit(Number(event.target.value)); setUsagePage(1); }} className="w-28" />
            </div>
            <Pagination total={usagesResponse?.meta?.total ?? 0} page={usagePage} limit={usageLimit} onChange={setUsagePage} />
          </div>
        </>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} title={editingPromotion ? t('stocks.promotions.update') : t('stocks.promotions.create')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {languageKeys.map((key) => (
              <Input
                key={key}
                label={t('stocks.promotions.nameByLanguage', { language: t(`stocks.languages.${key}`) })}
                value={name[key]}
                onChange={(event) => updateLocalizedValue(setName, name, key, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {languageKeys.map((key) => (
              <Textarea
                key={key}
                label={t('stocks.promotions.descriptionByLanguage', { language: t(`stocks.languages.${key}`) })}
                value={description[key]}
                onChange={(event) => updateLocalizedValue(setDescription, description, key, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Select label={t('stocks.promotions.type')} value={promotionType} options={promotionTypeOptions} onChange={(event) => setPromotionType(event.target.value as StockPromotionType)} />
            <Input type="number" min="0" step="0.0001" label={t('stocks.promotions.value')} value={value} onChange={(event) => setValue(event.target.value)} required />
            <Input type="number" step="1" label={t('stocks.promotions.priority')} value={priority} onChange={(event) => setPriority(event.target.value)} required />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Select
              label={t('stocks.promotions.targetType')}
              value={targetType}
              options={targetTypeOptions}
              onChange={(event) => {
                setTargetType(event.target.value as StockPromotionTargetType);
                setTargetId('');
              }}
            />
            {targetType !== 'ALL_PRODUCTS' && (
              <Select
                label={t('stocks.promotions.target')}
                value={targetId}
                options={[{ value: '', label: t('stocks.promotions.selectTarget') }, ...targetOptions]}
                onChange={(event) => setTargetId(event.target.value)}
                required
              />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <Input type="number" min="0" step="0.0001" label={t('stocks.promotions.minOrderAmount')} value={minOrderAmount} onChange={(event) => setMinOrderAmount(event.target.value)} />
            <Input type="number" min="0" step="0.0001" label={t('stocks.promotions.maxDiscountAmount')} value={maxDiscountAmount} onChange={(event) => setMaxDiscountAmount(event.target.value)} />
            <Input type="number" min="1" step="1" label={t('stocks.promotions.usageLimit')} value={usageLimitValue} onChange={(event) => setUsageLimitValue(event.target.value)} />
            <Input type="number" min="1" step="1" label={t('stocks.promotions.perClientLimit')} value={perClientLimit} onChange={(event) => setPerClientLimit(event.target.value)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Input type="datetime-local" label={t('stocks.promotions.startAt')} value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
            <Input type="datetime-local" label={t('stocks.promotions.endAt')} value={endAt} onChange={(event) => setEndAt(event.target.value)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Switch label={t('stocks.promotions.active')} checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            <Switch label={t('stocks.promotions.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingPromotion ? t('stocks.promotions.update') : t('stocks.promotions.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
