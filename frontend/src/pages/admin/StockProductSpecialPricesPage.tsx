import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDollarSign, Edit, ImageIcon, Trash2 } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { useBulkUpdateStockProducts, useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import {
  productSpecialPricingTypes,
  ProductSpecialPricingType,
  StockProduct,
} from '@/features/stocks/types/stock-product.types';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function StockProductSpecialPricesPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
  const [pricingType, setPricingType] = useState<ProductSpecialPricingType>('INCREMENT');
  const [value, setValue] = useState('');
  const [negativeValue, setNegativeValue] = useState('');
  const [agentRatio, setAgentRatio] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { data: productsResponse, isLoading } = useStockProducts({ page, limit, hasSpecialSellPrice: true });
  const { mutate: bulkUpdateProducts, isPending } = useBulkUpdateStockProducts();
  const currentProducts = productsResponse?.data || [];
  const allCurrentPageSelected = currentProducts.length > 0 && currentProducts.every((product) => selectedProductIds.includes(product._id));

  useEffect(() => {
    setPageTitle(t('stocks.specialPrices.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.specialPrices.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (localizedValue: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return localizedValue[key] || localizedValue.en;
  };

  const pricingTypeOptions = useMemo(
    () =>
      productSpecialPricingTypes.map((type) => ({
        value: type,
        label: t(`stocks.productSpecialPricingTypes.${type}`),
      })),
    [t]
  );

  const closeModal = () => {
    setEditingProduct(null);
    setPricingType('INCREMENT');
    setValue('');
    setNegativeValue('');
    setAgentRatio('');
  };

  const openEditModal = (product: StockProduct) => {
    setEditingProduct(product);
    setPricingType(product.specialSellPrice?.pricingType || 'INCREMENT');
    setValue(String(product.specialSellPrice?.value ?? ''));
    setNegativeValue(String(product.specialSellPrice?.negativeValue ?? ''));
    setAgentRatio(String(product.specialSellPrice?.agentRatio ?? ''));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;

    bulkUpdateProducts(
      {
        ids: [editingProduct._id],
        specialSellPrice: {
          pricingType,
          value: Number(value),
          negativeValue: Number(negativeValue),
          agentRatio: Number(agentRatio),
        },
      },
      { onSuccess: closeModal }
    );
  };

  const handleDelete = (product: StockProduct) => {
    bulkUpdateProducts({ ids: [product._id], specialSellPrice: null });
  };

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

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    bulkUpdateProducts(
      { ids: selectedProductIds, specialSellPrice: null },
      { onSuccess: () => setSelectedProductIds([]) }
    );
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
      key: 'pricingType',
      header: t('stocks.products.pricingType'),
      render: (product: StockProduct) => (
        <Badge variant="info">
          {product.specialSellPrice ? t(`stocks.productSpecialPricingTypes.${product.specialSellPrice.pricingType}`) : t('stocks.products.notSelected')}
        </Badge>
      ),
    },
    {
      key: 'value',
      header: t('stocks.products.value'),
      render: (product: StockProduct) => product.specialSellPrice?.value ?? t('stocks.products.notSelected'),
    },
    {
      key: 'negativeValue',
      header: t('stocks.products.negativeValue'),
      render: (product: StockProduct) => product.specialSellPrice?.negativeValue ?? t('stocks.products.notSelected'),
    },
    {
      key: 'agentRatio',
      header: t('stocks.products.agentRatio'),
      render: (product: StockProduct) => product.specialSellPrice?.agentRatio ?? t('stocks.products.notSelected'),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (product: StockProduct) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            title={t('common.edit')}
            aria-label={t('common.edit')}
            onClick={() => openEditModal(product)}
          >
            <Edit size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0 text-red-500 hover:text-red-600"
            title={t('common.delete')}
            aria-label={t('common.delete')}
            onClick={() => handleDelete(product)}
            disabled={isPending}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.specialPrices.title')} description={t('stocks.specialPrices.description')} />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('stocks.specialPrices.title')}</h1>
        <BadgeDollarSign size={24} className="text-primary" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold">{t('stocks.products.bulkActions')}</div>
          <div className="text-xs text-slate-400">{t('stocks.products.selectedCount', { count: selectedProductIds.length })}</div>
        </div>
        <Button
          type="button"
          variant="danger"
          disabled={selectedProductIds.length === 0 || isPending}
          onClick={handleBulkDelete}
          leftIcon={<Trash2 size={16} />}
        >
          {t('stocks.specialPrices.deleteSelected')}
        </Button>
      </div>

      <Table
        columns={columns}
        data={productsResponse?.data || []}
        isLoading={isLoading}
        getRowKey={(product) => product._id}
        emptyMessage={t('stocks.specialPrices.empty')}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.products.rowsPerPage')}</span>
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
        <Pagination total={productsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal
        isOpen={Boolean(editingProduct)}
        onClose={closeModal}
        title={t('stocks.specialPrices.update')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label={t('stocks.products.pricingType')}
            value={pricingType}
            options={pricingTypeOptions}
            onChange={(event) => setPricingType(event.target.value as ProductSpecialPricingType)}
          />
          <div className="grid gap-6 md:grid-cols-3">
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.value')}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.negativeValue')}
              value={negativeValue}
              onChange={(event) => setNegativeValue(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.products.agentRatio')}
              value={agentRatio}
              onChange={(event) => setAgentRatio(event.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
