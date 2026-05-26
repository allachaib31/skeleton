import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, PackagePlus } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Table } from '@/shared/components/ui/Table';
import { useSettingsApis } from '@/features/settings/hooks/settings.hooks';
import { apiGroups, ApiGroup } from '@/features/settings/types/settings.types';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useImportApiProducts, usePreviewApiProductsImport } from '@/features/stocks/hooks/stock-products.hooks';
import { ApiProductImportPreviewRequest, ApiProductImportPreviewRow } from '@/features/stocks/types/stock-product.types';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';

const supportedGroups: ApiGroup[] = [
  'GIFT_CARD_PROVIDERS',
  'SOCIAL_MEDIA_SERVICE_PROVIDERS',
  'GIFT_CARD_PROVIDERS_2',
  'TEMPORARY_NUMBER_CODING_SITES',
  'RENEWABLE_NUMBER_CODING_SITES',
];

export default function StockProductImportPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [apiGroup, setApiGroup] = useState<ApiGroup>('GIFT_CARD_PROVIDERS');
  const [apiId, setApiId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('');
  const [providerStatusFilter, setProviderStatusFilter] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [stock, setStock] = useState(true);

  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { mutate: preview, data: previewResponse, isPending: isPreviewing } = usePreviewApiProductsImport();
  const { mutate: importProducts, data: importResponse, isPending: isImporting } = useImportApiProducts();

  useEffect(() => {
    setPageTitle(t('stocks.importProducts.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.importProducts.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const apiOptions = useMemo(() => {
    const apis = (apisResponse?.data || []).filter((api) => api.group === apiGroup && api.isVisible && !api.isDeleted);
    return [
      { value: '', label: t('stocks.importProducts.selectApi') },
      ...apis.map((api) => ({ value: api._id, label: api.name })),
    ];
  }, [apisResponse?.data, apiGroup, t]);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: t('stocks.products.selectService') },
      ...(servicesResponse?.data || []).map((service) => ({ value: service._id, label: getLocalizedValue(service.name) })),
    ],
    [servicesResponse?.data, language, t]
  );

  const rows = previewResponse?.data || [];
  const providerCategoryOptions = useMemo(() => {
    const categories = Array.from(new Set(rows.map((row) => row.categoryName).filter(Boolean))).sort();
    return [
      { value: '', label: t('stocks.importProducts.allProviderCategories') },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [rows, t]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const searchMatches = !productSearch.trim() || row.name.toLowerCase().includes(productSearch.trim().toLowerCase());
        const categoryMatches = !providerCategoryFilter || row.categoryName === providerCategoryFilter;
        const statusMatches =
          !providerStatusFilter ||
          (providerStatusFilter === 'available' && row.available) ||
          (providerStatusFilter === 'unavailable' && !row.available) ||
          (providerStatusFilter === 'existing' && Boolean(row.existingProductId));
        return searchMatches && categoryMatches && statusMatches;
      }),
    [rows, productSearch, providerCategoryFilter, providerStatusFilter]
  );

  const systemCategoryOptions = useMemo(
    () => [
      { value: '', label: t('stocks.products.selectCategory') },
      ...(categoriesResponse?.data || [])
        .filter((category) => !serviceId || (typeof category.serviceId === 'string' ? category.serviceId : category.serviceId._id) === serviceId)
        .map((category) => ({ value: category._id, label: getLocalizedValue(category.name) })),
    ],
    [categoriesResponse?.data, serviceId, language, t]
  );

  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedProductIds.includes(row.providerProductId));

  const isSupported = supportedGroups.includes(apiGroup);
  const isNumberCodingGroup = apiGroup === 'TEMPORARY_NUMBER_CODING_SITES' || apiGroup === 'RENEWABLE_NUMBER_CODING_SITES';

  const handlePreview = () => {
    if (!apiId || !isSupported) return;
    setSelectedProductIds([]);
    setProductSearch('');
    preview({ apiGroup: apiGroup as ApiProductImportPreviewRequest['apiGroup'], apiId });
  };

  const toggleSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((current) => {
      if (checked) return current.includes(productId) ? current : [...current, productId];
      return current.filter((id) => id !== productId);
    });
  };

  const toggleAll = (checked: boolean) => {
    const filteredIds = filteredRows.map((row) => row.providerProductId);
    setSelectedProductIds((current) => {
      if (checked) return Array.from(new Set([...current, ...filteredIds]));
      return current.filter((id) => !filteredIds.includes(id));
    });
  };

  const handleImport = () => {
    if (!apiId || !serviceId || selectedProductIds.length === 0 || !isSupported || (!isNumberCodingGroup && !autoCreateCategories && !categoryId)) return;
    const importApiGroup = apiGroup as ApiProductImportPreviewRequest['apiGroup'];
    importProducts({
      apiGroup: importApiGroup,
      apiId,
      serviceId,
      categoryId: autoCreateCategories || isNumberCodingGroup ? undefined : categoryId,
      productIds: selectedProductIds,
      autoCreateCategories: isNumberCodingGroup ? true : autoCreateCategories,
      updateExisting,
      isVisible,
      stock,
    });
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => toggleAll(event.target.checked)}
          className="h-4 w-4 accent-primary"
          aria-label={t('stocks.importProducts.selectAll')}
        />
      ),
      render: (row: ApiProductImportPreviewRow) => (
        <input
          type="checkbox"
          checked={selectedProductIds.includes(row.providerProductId)}
          onChange={(event) => toggleSelection(row.providerProductId, event.target.checked)}
          className="h-4 w-4 accent-primary"
          aria-label={t('stocks.importProducts.selectProduct')}
        />
      ),
    },
    { key: 'id', header: t('stocks.importProducts.providerId'), render: (row: ApiProductImportPreviewRow) => row.providerProductId },
    { key: 'name', header: t('stocks.products.name'), render: (row: ApiProductImportPreviewRow) => <div className="font-bold">{row.name}</div> },
    { key: 'category', header: t('stocks.products.category'), render: (row: ApiProductImportPreviewRow) => row.categoryName },
    {
      key: 'providerPrice',
      header: t('stocks.importProducts.providerPrice'),
      render: (row: ApiProductImportPreviewRow) => row.productType === 'NUMBER_CODING_SERVICE' ? t('stocks.importProducts.dynamicPrice') : `${row.providerPrice} ${row.providerCurrency}`,
    },
    { key: 'price', header: t('stocks.products.costPrice'), render: (row: ApiProductImportPreviewRow) => row.productType === 'NUMBER_CODING_SERVICE' ? t('stocks.importProducts.liveAtPurchase') : row.costPrice },
    {
      key: 'mode',
      header: t('stocks.products.quantityMode'),
      render: (row: ApiProductImportPreviewRow) => <Badge variant="info">{t(`stocks.productQuantityModes.${row.quantityMode}`)}</Badge>,
    },
    {
      key: 'providerType',
      header: t('stocks.importProducts.providerType'),
      render: (row: ApiProductImportPreviewRow) => row.productType || '-',
    },
    {
      key: 'status',
      header: t('stocks.products.status'),
      render: (row: ApiProductImportPreviewRow) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant={row.available ? 'success' : 'danger'}>
            {row.available ? t('stocks.importProducts.available') : t('stocks.importProducts.unavailable')}
          </Badge>
          {row.existingProductId && <Badge variant="warning">{t('stocks.importProducts.exists')}</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.importProducts.title')} description={t('stocks.importProducts.description')} />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('stocks.importProducts.title')}</h1>
        <PackagePlus size={24} className="text-primary" />
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-secondary p-4 lg:grid-cols-4">
        <Select
          label={t('stocks.importProducts.apiGroup')}
          value={apiGroup}
          options={apiGroups.map((group) => ({ value: group, label: t(`adminSettings.apiGroups.${group}`) }))}
          onChange={(event) => {
            setApiGroup(event.target.value as ApiGroup);
            setApiId('');
            setProductSearch('');
            setSelectedProductIds([]);
          }}
        />
        <Select label={t('stocks.products.api')} value={apiId} options={apiOptions} onChange={(event) => setApiId(event.target.value)} />
        <Select
          label={t('stocks.products.service')}
          value={serviceId}
          options={serviceOptions}
          onChange={(event) => {
            setServiceId(event.target.value);
            setCategoryId('');
          }}
        />
        <div className="flex items-end">
          <Button type="button" onClick={handlePreview} disabled={!apiId || !isSupported} isLoading={isPreviewing} leftIcon={<Download size={16} />}>
            {t('stocks.importProducts.preview')}
          </Button>
        </div>
      </div>

      {!isSupported && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
          {t('stocks.importProducts.groupNotReady')}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-white/10 bg-secondary p-4 md:grid-cols-4">
        <Switch label={t('stocks.importProducts.autoCreateCategories')} checked={isNumberCodingGroup || autoCreateCategories} disabled={isNumberCodingGroup} onChange={(event) => setAutoCreateCategories(event.target.checked)} />
        <Switch label={t('stocks.importProducts.updateExisting')} checked={updateExisting} onChange={(event) => setUpdateExisting(event.target.checked)} />
        <Switch label={t('stocks.importProducts.visibleAfterImport')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
        <Switch label={t('stocks.products.stock')} checked={stock} onChange={(event) => setStock(event.target.checked)} />
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-secondary p-4 md:grid-cols-3">
        <Input
          label={t('stocks.importProducts.searchProduct')}
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          placeholder={t('stocks.importProducts.searchProductPlaceholder')}
        />
        <Select
          label={t('stocks.importProducts.providerCategory')}
          value={providerCategoryFilter}
          options={providerCategoryOptions}
          onChange={(event) => setProviderCategoryFilter(event.target.value)}
        />
        <Select
          label={t('stocks.importProducts.providerStatus')}
          value={providerStatusFilter}
          options={[
            { value: '', label: t('stocks.importProducts.allProviderStatuses') },
            { value: 'available', label: t('stocks.importProducts.available') },
            { value: 'unavailable', label: t('stocks.importProducts.unavailable') },
            { value: 'existing', label: t('stocks.importProducts.exists') },
          ]}
          onChange={(event) => setProviderStatusFilter(event.target.value)}
        />
        {!autoCreateCategories && !isNumberCodingGroup && (
          <Select
            label={t('stocks.importProducts.systemCategory')}
            value={categoryId}
            options={systemCategoryOptions}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          />
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-secondary p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-400">
          {t('stocks.importProducts.selectedCount', { selected: selectedProductIds.length, total: filteredRows.length })}
        </div>
        <Button type="button" onClick={handleImport} disabled={!serviceId || (!isNumberCodingGroup && !autoCreateCategories && !categoryId) || selectedProductIds.length === 0 || isImporting} isLoading={isImporting}>
          {t('stocks.importProducts.importSelected')}
        </Button>
      </div>

      {importResponse?.data && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
          {t('stocks.importProducts.importSummary', { ...importResponse.data })}
        </div>
      )}

      <Table columns={columns} data={filteredRows} isLoading={isPreviewing} getRowKey={(row) => row.apiProductKey} />
    </div>
  );
}
