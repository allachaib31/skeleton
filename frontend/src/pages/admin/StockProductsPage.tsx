import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeDollarSign, Edit, Eye, EyeOff, ImageIcon, Link2, PackageSearch, Trash2 } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { Modal } from '@/shared/components/ui/Modal';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useBulkUpdateStockProducts, useReorderStockProducts, useStockProducts, useUpdateStockProduct } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockProductGroups } from '@/features/stocks/hooks/stock-product-groups.hooks';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import {
  productSpecialPricingTypes,
  ProductSpecialPricingType,
  StockProduct,
  UpdateStockProductRequest,
} from '@/features/stocks/types/stock-product.types';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function StockProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [deleteFilter, setDeleteFilter] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [isSpecialPriceOpen, setIsSpecialPriceOpen] = useState(false);
  const [specialPriceProductId, setSpecialPriceProductId] = useState('ALL');
  const [specialPricingType, setSpecialPricingType] = useState<ProductSpecialPricingType>('INCREMENT');
  const [specialPriceValue, setSpecialPriceValue] = useState('');
  const [specialPriceNegativeValue, setSpecialPriceNegativeValue] = useState('');
  const [specialPriceAgentRatio, setSpecialPriceAgentRatio] = useState('');

  const filters = {
    page,
    limit,
    search: search || undefined,
    serviceId: serviceFilter || undefined,
    categoryId: categoryFilter || undefined,
    isVisible: visibilityFilter ? visibilityFilter === 'visible' : undefined,
    isDeleted: deleteFilter ? deleteFilter === 'deleted' : undefined,
  };

  const { data: productsResponse, isLoading } = useStockProducts(filters);
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: groupsResponse } = useStockProductGroups({ page: 1, limit: 300 });
  const { mutate: updateProduct } = useUpdateStockProduct();
  const { mutate: bulkUpdateProducts, isPending: isBulkUpdating } = useBulkUpdateStockProducts();
  const { mutate: reorderProducts } = useReorderStockProducts();

  useEffect(() => {
    setPageTitle(t('stocks.products.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.products.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const serviceOptions = useMemo(
    () => (servicesResponse?.data || []).map((service) => ({ value: service._id, label: getLocalizedValue(service.name) })),
    [servicesResponse?.data, language]
  );

  const categoryFilterOptions = useMemo(
    () =>
      (categoriesResponse?.data || [])
        .filter((category) => !serviceFilter || getCategoryServiceId(category) === serviceFilter)
        .map((category) => ({ value: category._id, label: getLocalizedValue(category.name) })),
    [categoriesResponse?.data, serviceFilter, language]
  );

  const groupOptions = useMemo(
    () => (groupsResponse?.data || []).map((group) => ({ value: group._id, label: getLocalizedValue(group.name) })),
    [groupsResponse?.data, language]
  );

  const currentProducts = productsResponse?.data || [];

  const selectedProductOptions = useMemo(
    () => [
      { value: 'ALL', label: t('stocks.products.allSelectedProducts') },
      ...selectedProductIds.map((productId) => {
        const product = currentProducts.find((item) => item._id === productId);
        return {
          value: productId,
          label: product ? getLocalizedValue(product.name) : productId,
        };
      }),
    ],
    [selectedProductIds, productsResponse?.data, language, t]
  );

  const specialPricingTypeOptions = useMemo(
    () =>
      productSpecialPricingTypes.map((type) => ({
        value: type,
        label: t(`stocks.productSpecialPricingTypes.${type}`),
      })),
    [t]
  );

  const resetPage = () => setPage(1);

  const productToUpdatePayload = (product: StockProduct, overrides: Partial<UpdateStockProductRequest> = {}): UpdateStockProductRequest => ({
    serviceId: getProductServiceId(product),
    categoryId: getProductCategoryId(product),
    groupId: getProductGroupId(product) || undefined,
    apiId: getProductApiId(product) || undefined,
    name: product.name,
    serviceNumber: product.serviceNumber,
    costPrice: product.costPrice,
    costManual: product.costManual,
    forQuantity: product.forQuantity,
    description: product.description,
    quantityMode: product.quantityMode,
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    customQuantities: product.customQuantities?.join(','),
    speed: product.speed,
    startTime: product.startTime,
    quantityAvailable: product.quantityAvailable,
    isVisible: product.isVisible,
    isDeleted: product.isDeleted,
    dripfeed: product.dripfeed,
    refill: product.refill,
    cancel: product.cancel,
    stock: product.stock,
    fulfillmentType: product.fulfillmentType || 'MANUAL',
    requirements: (product.requirements || []).map((requirement) => (typeof requirement === 'string' ? requirement : requirement._id)),
    ...overrides,
  });

  const handleSoftDelete = (product: StockProduct) => {
    updateProduct({ id: product._id, data: productToUpdatePayload(product, { isDeleted: true }) });
  };

  const allCurrentPageSelected = currentProducts.length > 0 && currentProducts.every((product) => selectedProductIds.includes(product._id));

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((current) => {
      if (checked) return current.includes(productId) ? current : [...current, productId];
      return current.filter((id) => id !== productId);
    });
  };

  const toggleCurrentPageSelection = (checked: boolean) => {
    const currentPageIds = currentProducts.map((product) => product._id);
    setSelectedProductIds((current) => {
      if (checked) return Array.from(new Set([...current, ...currentPageIds]));
      return current.filter((id) => !currentPageIds.includes(id));
    });
  };

  const handleBulkUpdate = (payload: { isVisible?: boolean; isDeleted?: boolean; groupId?: string }) => {
    if (selectedProductIds.length === 0) return;
    bulkUpdateProducts(
      { ids: selectedProductIds, ...payload },
      {
        onSuccess: () => {
          setSelectedProductIds([]);
          if (payload.groupId) setBulkGroupId('');
        },
      }
    );
  };

  const closeSpecialPriceModal = () => {
    setIsSpecialPriceOpen(false);
    setSpecialPriceProductId('ALL');
    setSpecialPricingType('INCREMENT');
    setSpecialPriceValue('');
    setSpecialPriceNegativeValue('');
    setSpecialPriceAgentRatio('');
  };

  const handleSpecialPriceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedProductIds.length === 0) return;

    const ids = specialPriceProductId === 'ALL' ? selectedProductIds : [specialPriceProductId];
    bulkUpdateProducts(
      {
        ids,
        specialSellPrice: {
          pricingType: specialPricingType,
          value: Number(specialPriceValue),
          negativeValue: Number(specialPriceNegativeValue),
          agentRatio: Number(specialPriceAgentRatio),
        },
      },
      {
        onSuccess: () => {
          setSelectedProductIds([]);
          closeSpecialPriceModal();
        },
      }
    );
  };

  const iconButtonClass = 'h-9 w-9 px-0';

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const products = [...(productsResponse?.data || [])];
    const [movedProduct] = products.splice(fromIndex, 1);
    if (!movedProduct) return;
    products.splice(toIndex, 0, movedProduct);
    reorderProducts(products.map((product) => product._id));
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allCurrentPageSelected}
          onChange={(event) => toggleCurrentPageSelection(event.target.checked)}
          className="h-4 w-4 accent-primary"
          aria-label={t('stocks.products.selectPage')}
        />
      ),
      render: (product: StockProduct) => (
        <input
          type="checkbox"
          checked={selectedProductIds.includes(product._id)}
          onChange={(event) => toggleProductSelection(product._id, event.target.checked)}
          className="h-4 w-4 accent-primary"
          aria-label={t('stocks.products.selectProduct')}
        />
      ),
    },
    {
      key: 'product',
      header: t('stocks.products.product'),
      render: (product: StockProduct) => (
        <div className="flex items-center gap-3">
          {product.image?.secureUrl ? (
            <img src={product.image.secureUrl} alt={getLocalizedValue(product.name)} className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(product.name)}</div>
            <div className="max-w-md truncate text-xs text-slate-400">{stripHtml(getLocalizedValue(product.description))}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: t('stocks.products.service'),
      render: (product: StockProduct) => (
        <Badge variant="info">
          {typeof product.serviceId === 'string' ? t('stocks.products.unknownService') : getLocalizedValue(product.serviceId.name)}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: t('stocks.products.category'),
      render: (product: StockProduct) => (
        <Badge variant="outline">
          {typeof product.categoryId === 'string' ? t('stocks.products.unknownCategory') : getLocalizedValue(product.categoryId.name)}
        </Badge>
      ),
    },
    {
      key: 'group',
      header: t('stocks.products.group'),
      render: (product: StockProduct) => (
          <Badge variant="outline">
            {typeof product.groupId === 'string' || !product.groupId ? t('stocks.products.noGroup') : getLocalizedValue(product.groupId.name)}
          </Badge>
      ),
    },
    {
      key: 'cost',
      header: t('stocks.products.costPrice'),
      render: (product: StockProduct) => product.costPrice,
    },
    {
      key: 'mode',
      header: t('stocks.products.quantityMode'),
      render: (product: StockProduct) => t(`stocks.productQuantityModes.${product.quantityMode}`),
    },
    {
      key: 'status',
      header: t('stocks.products.status'),
      render: (product: StockProduct) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant={product.isVisible ? 'success' : 'default'}>
            {product.isVisible ? t('stocks.products.visible') : t('stocks.products.hidden')}
          </Badge>
          <Badge variant={product.isDeleted ? 'danger' : 'outline'}>
            {product.isDeleted ? t('stocks.products.softDeleted') : t('stocks.products.active')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (product: StockProduct) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/stocks/products/${product._id}/edit`)}
            className={iconButtonClass}
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleSoftDelete(product)}
            disabled={product.isDeleted}
            className={iconButtonClass}
            title={t('stocks.products.softDelete')}
            aria-label={t('stocks.products.softDelete')}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.products.title')} description={t('stocks.products.listDescription')} />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('stocks.products.title')}</h1>
        <PackageSearch size={24} className="text-primary" />
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-secondary p-4 lg:grid-cols-5">
        <Input
          label={t('common.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
        />
        <Select
          label={t('stocks.products.service')}
          value={serviceFilter}
          options={[{ value: '', label: t('stocks.products.allServices') }, ...serviceOptions]}
          onChange={(event) => {
            setServiceFilter(event.target.value);
            setCategoryFilter('');
            resetPage();
          }}
        />
        <Select
          label={t('stocks.products.category')}
          value={categoryFilter}
          options={[{ value: '', label: t('stocks.products.allCategories') }, ...categoryFilterOptions]}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            resetPage();
          }}
        />
        <Select
          label={t('adminSettings.visibility')}
          value={visibilityFilter}
          options={[
            { value: '', label: t('stocks.products.allVisibility') },
            { value: 'visible', label: t('stocks.products.visible') },
            { value: 'hidden', label: t('stocks.products.hidden') },
          ]}
          onChange={(event) => {
            setVisibilityFilter(event.target.value);
            resetPage();
          }}
        />
        <Select
          label={t('adminSettings.deleteStatus')}
          value={deleteFilter}
          options={[
            { value: '', label: t('stocks.products.allDeleteStatuses') },
            { value: 'active', label: t('stocks.products.active') },
            { value: 'deleted', label: t('stocks.products.softDeleted') },
          ]}
          onChange={(event) => {
            setDeleteFilter(event.target.value);
            resetPage();
          }}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-secondary p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-bold">{t('stocks.products.bulkActions')}</div>
          <div className="text-xs text-slate-400">{t('stocks.products.selectedCount', { count: selectedProductIds.length })}</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Button
            variant="outline"
            disabled={selectedProductIds.length === 0 || isBulkUpdating}
            onClick={() => handleBulkUpdate({ isVisible: true })}
            className={iconButtonClass}
            title={t('stocks.products.bulkShow')}
            aria-label={t('stocks.products.bulkShow')}
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="outline"
            disabled={selectedProductIds.length === 0 || isBulkUpdating}
            onClick={() => handleBulkUpdate({ isVisible: false })}
            className={iconButtonClass}
            title={t('stocks.products.bulkHide')}
            aria-label={t('stocks.products.bulkHide')}
          >
            <EyeOff size={16} />
          </Button>
          <Button
            variant="danger"
            disabled={selectedProductIds.length === 0 || isBulkUpdating}
            onClick={() => handleBulkUpdate({ isDeleted: true })}
            className={iconButtonClass}
            title={t('stocks.products.bulkSoftDelete')}
            aria-label={t('stocks.products.bulkSoftDelete')}
          >
            <Trash2 size={16} />
          </Button>
          <Select
            label={t('stocks.products.group')}
            value={bulkGroupId}
            options={[{ value: '', label: t('stocks.products.selectGroup') }, ...groupOptions]}
            onChange={(event) => setBulkGroupId(event.target.value)}
            className="min-w-56"
          />
          <Button
            disabled={selectedProductIds.length === 0 || !bulkGroupId || isBulkUpdating}
            onClick={() => handleBulkUpdate({ groupId: bulkGroupId })}
            className={iconButtonClass}
            title={t('stocks.products.assignGroup')}
            aria-label={t('stocks.products.assignGroup')}
          >
            <Link2 size={16} />
          </Button>
          <Button
            variant="outline"
            disabled={selectedProductIds.length === 0 || isBulkUpdating}
            onClick={() => setIsSpecialPriceOpen(true)}
            className={iconButtonClass}
            title={t('stocks.products.specialSellPrice')}
            aria-label={t('stocks.products.specialSellPrice')}
          >
            <BadgeDollarSign size={16} />
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={productsResponse?.data || []}
        isLoading={isLoading}
        getRowKey={(product) => product._id}
        onRowDragEnd={handleReorder}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.products.rowsPerPage')}</span>
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
        <Pagination total={productsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal
        isOpen={isSpecialPriceOpen}
        onClose={closeSpecialPriceModal}
        title={t('stocks.products.specialSellPrice')}
        size="lg"
      >
        <form onSubmit={handleSpecialPriceSubmit} className="space-y-6">
          <Select
            label={t('stocks.products.product')}
            value={specialPriceProductId}
            options={selectedProductOptions}
            onChange={(event) => setSpecialPriceProductId(event.target.value)}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label={t('stocks.products.pricingType')}
              value={specialPricingType}
              options={specialPricingTypeOptions}
              onChange={(event) => setSpecialPricingType(event.target.value as ProductSpecialPricingType)}
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.value')}
              value={specialPriceValue}
              onChange={(event) => setSpecialPriceValue(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.negativeValue')}
              value={specialPriceNegativeValue}
              onChange={(event) => setSpecialPriceNegativeValue(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.agentRatio')}
              value={specialPriceAgentRatio}
              onChange={(event) => setSpecialPriceAgentRatio(event.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isBulkUpdating}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

const getCategoryServiceId = (category: StockCategory) =>
  typeof category.serviceId === 'string' ? category.serviceId : category.serviceId._id;

const getProductServiceId = (product: StockProduct) =>
  typeof product.serviceId === 'string' ? product.serviceId : product.serviceId._id;

const getProductCategoryId = (product: StockProduct) =>
  typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;

const getProductGroupId = (product: StockProduct) =>
  !product.groupId ? '' : typeof product.groupId === 'string' ? product.groupId : product.groupId._id;

const getProductApiId = (product: StockProduct) =>
  !product.apiId ? '' : typeof product.apiId === 'string' ? product.apiId : product.apiId._id;
