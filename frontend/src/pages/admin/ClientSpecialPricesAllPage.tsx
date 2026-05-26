import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useLanguageStore } from '@/app/stores/language.store';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import {
  useAdminClients,
  useAllClientSpecialPrices,
  useBulkDeleteAllClientSpecialPrices,
  useUpdateClientSpecialPrice,
} from '@/features/clients/hooks/clients.hooks';
import { AdminClient, ClientProductSpecialPrice } from '@/features/clients/types/client.types';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { productSpecialPricingTypes, ProductSpecialPricingType } from '@/features/stocks/types/stock-product.types';

const getEntityId = (value: string | { _id: string } | undefined) => (typeof value === 'string' ? value : value?._id || '');

export default function ClientSpecialPricesAllPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, clientId: '', serviceId: '', categoryId: '', productId: '', pricingType: '' as ProductSpecialPricingType | '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPrice, setEditingPrice] = useState<ClientProductSpecialPrice | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [pricingType, setPricingType] = useState<ProductSpecialPricingType>('INCREMENT');
  const [value, setValue] = useState('');
  const [negativeValue, setNegativeValue] = useState('');

  const { data: pricesResponse, isLoading } = useAllClientSpecialPrices(params);
  const { data: clientsResponse } = useAdminClients({ page: 1, limit: 300, search: '' });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: filterProductsResponse } = useStockProducts(
    { page: 1, limit: 300, serviceId: params.serviceId, categoryId: params.categoryId, isDeleted: false },
    { enabled: Boolean(params.serviceId && params.categoryId) }
  );
  const { data: productsResponse } = useStockProducts(
    { page: 1, limit: 300, serviceId, categoryId, isDeleted: false },
    { enabled: Boolean(serviceId && categoryId) }
  );
  const { mutate: updatePrice, isPending: isUpdating } = useUpdateClientSpecialPrice();
  const { mutate: deletePrices, isPending: isDeleting } = useBulkDeleteAllClientSpecialPrices();

  const locale = language.split('-')[0] as 'en' | 'fr' | 'ar';
  const prices = pricesResponse?.data || [];

  useEffect(() => {
    setPageTitle(t('clients.specialPricesAll'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('clients.manage'), href: '/admin/clients' },
      { label: t('clients.specialPricesAll') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const localizedName = (valueObject?: { en: string; fr: string; ar: string }) => valueObject?.[locale] || valueObject?.en || t('stocks.products.notSelected');

  const clientOptions = useMemo(
    () => [
      { value: '', label: t('clients.allClients') },
      ...(clientsResponse?.data || []).map((client: AdminClient) => ({ value: client._id, label: `${client.name} (${client.email})` })),
    ],
    [clientsResponse?.data, t]
  );

  const serviceOptions = [
    { value: '', label: t('clients.selectService') },
    ...(servicesResponse?.data || []).map((service) => ({ value: service._id, label: localizedName(service.name) })),
  ];

  const filteredCategories = useMemo(
    () => (categoriesResponse?.data || []).filter((category) => getEntityId(category.serviceId) === serviceId),
    [categoriesResponse?.data, serviceId]
  );

  const filterCategories = useMemo(
    () => (categoriesResponse?.data || []).filter((category) => getEntityId(category.serviceId) === params.serviceId),
    [categoriesResponse?.data, params.serviceId]
  );

  const categoryOptions = [
    { value: '', label: t('clients.selectCategory') },
    ...filteredCategories.map((category) => ({ value: category._id, label: localizedName(category.name) })),
  ];

  const productOptions = [
    { value: '', label: t('clients.selectProduct') },
    ...(productsResponse?.data || []).map((product) => ({ value: product._id, label: localizedName(product.name) })),
  ];

  const filterCategoryOptions = [
    { value: '', label: t('clients.selectCategory') },
    ...filterCategories.map((category) => ({ value: category._id, label: localizedName(category.name) })),
  ];

  const filterProductOptions = [
    { value: '', label: t('clients.selectProduct') },
    ...(filterProductsResponse?.data || []).map((product) => ({ value: product._id, label: localizedName(product.name) })),
  ];

  const pricingOptions = [
    { value: '', label: t('common.all') },
    ...productSpecialPricingTypes.map((type) => ({ value: type, label: t(`stocks.productSpecialPricingTypes.${type}`) })),
  ];

  const openEdit = (price: ClientProductSpecialPrice) => {
    setEditingPrice(price);
    setServiceId(getEntityId(price.serviceId));
    setCategoryId(getEntityId(price.categoryId));
    setProductId(getEntityId(price.productId));
    setPricingType(price.pricingType);
    setValue(String(price.value));
    setNegativeValue(String(price.negativeValue ?? price.value));
  };

  const closeModal = () => {
    setEditingPrice(null);
    setServiceId('');
    setCategoryId('');
    setProductId('');
    setPricingType('INCREMENT');
    setValue('');
    setNegativeValue('');
  };

  const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPrice) return;
    updatePrice(
      { specialPriceId: editingPrice._id, data: { serviceId, categoryId, productId, pricingType, value: Number(value), negativeValue: Number(negativeValue) } },
      { onSuccess: closeModal }
    );
  };

  const toggleSelected = (priceId: string) => {
    setSelectedIds((current) => (current.includes(priceId) ? current.filter((idValue) => idValue !== priceId) : [...current, priceId]));
  };

  const allSelected = prices.length > 0 && prices.every((price) => selectedIds.includes(price._id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds((current) => current.filter((idValue) => !prices.some((price) => price._id === idValue)));
    else setSelectedIds((current) => Array.from(new Set([...current, ...prices.map((price) => price._id)])));
  };

  const removeSelected = (ids: string[]) => {
    deletePrices(ids, {
      onSuccess: () => setSelectedIds((current) => current.filter((idValue) => !ids.includes(idValue))),
    });
  };

  const columns = [
    {
      key: 'select',
      header: <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('clients.selectAllSpecialPrices')} className="h-4 w-4 rounded border-slate-300" />,
      render: (price: ClientProductSpecialPrice) => <input type="checkbox" checked={selectedIds.includes(price._id)} onChange={() => toggleSelected(price._id)} aria-label={t('clients.selectSpecialPrice')} className="h-4 w-4 rounded border-slate-300" />,
    },
    {
      key: 'client',
      header: t('clients.client'),
      render: (price: ClientProductSpecialPrice) => {
        const client = typeof price.clientId === 'string' ? undefined : price.clientId;
        return client ? `${client.countryFlag || ''} ${client.name} (${client.email})` : '-';
      },
    },
    { key: 'product', header: t('clients.product'), render: (price: ClientProductSpecialPrice) => localizedName(typeof price.productId === 'string' ? undefined : price.productId.name) },
    { key: 'service', header: t('clients.service'), render: (price: ClientProductSpecialPrice) => localizedName(typeof price.serviceId === 'string' ? undefined : price.serviceId.name) },
    { key: 'category', header: t('clients.category'), render: (price: ClientProductSpecialPrice) => localizedName(typeof price.categoryId === 'string' ? undefined : price.categoryId.name) },
    { key: 'pricingType', header: t('clients.pricingType'), render: (price: ClientProductSpecialPrice) => <Badge variant="info">{t(`stocks.productSpecialPricingTypes.${price.pricingType}`)}</Badge> },
    { key: 'value', header: t('clients.value'), render: (price: ClientProductSpecialPrice) => price.value },
    { key: 'negativeValue', header: t('clients.negativeValue'), render: (price: ClientProductSpecialPrice) => price.negativeValue ?? price.value },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (price: ClientProductSpecialPrice) => (
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(price)} aria-label={t('common.edit')} title={t('common.edit')}>
            <Edit size={16} />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeSelected([price._id])} disabled={isDeleting} aria-label={t('common.delete')} title={t('common.delete')}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('clients.specialPricesAll')} description={t('clients.specialPricesAllDescription')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('clients.specialPricesAll')}</h1>
          <p className="text-sm text-slate-500">{t('clients.specialPricesAllDescription')}</p>
        </div>
        {selectedIds.length > 0 && (
          <Button type="button" variant="danger" onClick={() => removeSelected(selectedIds)} isLoading={isDeleting} leftIcon={<Trash2 size={16} />}>
            {t('clients.removeSelected')}
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Select value={params.clientId} options={clientOptions} onChange={(event) => setParams((current) => ({ ...current, clientId: event.target.value, page: 1 }))} />
        <Select value={params.serviceId} options={serviceOptions} onChange={(event) => setParams((current) => ({ ...current, serviceId: event.target.value, categoryId: '', productId: '', page: 1 }))} />
        <Select value={params.categoryId} options={filterCategoryOptions} onChange={(event) => setParams((current) => ({ ...current, categoryId: event.target.value, productId: '', page: 1 }))} disabled={!params.serviceId} />
        <Select value={params.productId} options={filterProductOptions} onChange={(event) => setParams((current) => ({ ...current, productId: event.target.value, page: 1 }))} disabled={!params.categoryId} />
        <Select value={params.pricingType} options={pricingOptions} onChange={(event) => setParams((current) => ({ ...current, pricingType: event.target.value as ProductSpecialPricingType | '', page: 1 }))} />
        <Select value={String(params.limit)} options={[10, 50, 100, 300].map((item) => ({ value: item, label: String(item) }))} onChange={(event) => setParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
      </div>

      <Table columns={columns} data={prices} isLoading={isLoading} emptyMessage={t('clients.noSpecialPrices')} getRowKey={(price) => price._id} />
      <Pagination total={pricesResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />

      <Modal isOpen={Boolean(editingPrice)} onClose={closeModal} title={t('clients.updateSpecialPrice')} size="lg">
        <form onSubmit={submitUpdate} className="space-y-4">
          <Select label={t('clients.service')} value={serviceId} options={serviceOptions} onChange={(event) => { setServiceId(event.target.value); setCategoryId(''); setProductId(''); }} required />
          <Select label={t('clients.category')} value={categoryId} options={categoryOptions} onChange={(event) => { setCategoryId(event.target.value); setProductId(''); }} required disabled={!serviceId} />
          <Select label={t('clients.product')} value={productId} options={productOptions} onChange={(event) => setProductId(event.target.value)} required disabled={!categoryId} />
          <Select label={t('clients.pricingType')} value={pricingType} options={pricingOptions.filter((option) => option.value)} onChange={(event) => setPricingType(event.target.value as ProductSpecialPricingType)} required />
          <Input type="number" min="0" step="0.0001" label={t('clients.value')} value={value} onChange={(event) => setValue(event.target.value)} required />
          <Input type="number" min="0" step="0.0001" label={t('clients.negativeValue')} value={negativeValue} onChange={(event) => setNegativeValue(event.target.value)} required />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isUpdating}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
