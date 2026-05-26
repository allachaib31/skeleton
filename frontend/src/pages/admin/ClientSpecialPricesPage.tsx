import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
  useAdminClient,
  useBulkDeleteClientSpecialPrices,
  useClientSpecialPrices,
  useCreateClientSpecialPrice,
} from '@/features/clients/hooks/clients.hooks';
import { ClientProductSpecialPrice } from '@/features/clients/types/client.types';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { productSpecialPricingTypes, ProductSpecialPricingType } from '@/features/stocks/types/stock-product.types';

const getEntityId = (value: string | { _id: string } | undefined) => (typeof value === 'string' ? value : value?._id || '');

export default function ClientSpecialPricesPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [pricingType, setPricingType] = useState<ProductSpecialPricingType>('INCREMENT');
  const [value, setValue] = useState('');
  const [negativeValue, setNegativeValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: clientResponse } = useAdminClient(id, { page: 1, limit: 10 });
  const { data: specialPricesResponse, isLoading } = useClientSpecialPrices(id, { page, limit });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: productsResponse } = useStockProducts(
    { page: 1, limit: 300, serviceId, categoryId, isDeleted: false },
    { enabled: Boolean(serviceId && categoryId) }
  );
  const { mutate: createSpecialPrice, isPending: isCreating } = useCreateClientSpecialPrice(id);
  const { mutate: deleteSpecialPrices, isPending: isDeleting } = useBulkDeleteClientSpecialPrices(id);

  const client = clientResponse?.data.client;
  const specialPrices = specialPricesResponse?.data || [];
  const meta = specialPricesResponse?.meta;
  const locale = language.split('-')[0] as 'en' | 'fr' | 'ar';

  useEffect(() => {
    setPageTitle(t('clients.specialPrices'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('clients.title'), href: '/admin/clients' },
      { label: client ? client.name : t('clients.details'), href: `/admin/clients/${id}` },
      { label: t('clients.specialPrices') },
    ]);
  }, [client, id, setPageTitle, setBreadcrumbs, t]);

  const localizedName = (value?: { en: string; fr: string; ar: string }) => value?.[locale] || value?.en || t('stocks.products.notSelected');

  const serviceOptions = useMemo(
    () => [
      { value: '', label: t('clients.selectService') },
      ...(servicesResponse?.data || []).map((service) => ({ value: service._id, label: localizedName(service.name) })),
    ],
    [servicesResponse?.data, t, locale]
  );

  const filteredCategories = useMemo(
    () => (categoriesResponse?.data || []).filter((category) => getEntityId(category.serviceId) === serviceId),
    [categoriesResponse?.data, serviceId]
  );

  const categoryDatalistId = `client-special-price-categories-${id}`;
  const productDatalistId = `client-special-price-products-${id}`;
  const categoryDatalistOptions = filteredCategories.map((category) => ({ value: category._id, label: localizedName(category.name) }));
  const productDatalistOptions = (productsResponse?.data || []).map((product) => ({ value: product._id, label: localizedName(product.name) }));

  const pricingOptions = productSpecialPricingTypes.map((type) => ({ value: type, label: t(`stocks.productSpecialPricingTypes.${type}`) }));

  const closeModal = () => {
    setModalOpen(false);
    setServiceId('');
    setCategoryId('');
    setCategorySearch('');
    setProductId('');
    setProductSearch('');
    setPricingType('INCREMENT');
    setValue('');
    setNegativeValue('');
  };

  const submitSpecialPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId || !productId) return;
    createSpecialPrice(
      { serviceId, categoryId, productId, pricingType, value: Number(value), negativeValue: Number(negativeValue) },
      { onSuccess: closeModal }
    );
  };

  const toggleSelected = (priceId: string) => {
    setSelectedIds((current) => (current.includes(priceId) ? current.filter((idValue) => idValue !== priceId) : [...current, priceId]));
  };

  const allSelected = specialPrices.length > 0 && specialPrices.every((price) => selectedIds.includes(price._id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((current) => current.filter((idValue) => !specialPrices.some((price) => price._id === idValue)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...specialPrices.map((price) => price._id)])));
    }
  };

  const removeSelected = (ids: string[]) => {
    deleteSpecialPrices(ids, {
      onSuccess: () => setSelectedIds((current) => current.filter((idValue) => !ids.includes(idValue))),
    });
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          aria-label={t('clients.selectAllSpecialPrices')}
          className="h-4 w-4 rounded border-slate-300"
        />
      ),
      render: (price: ClientProductSpecialPrice) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(price._id)}
          onChange={() => toggleSelected(price._id)}
          aria-label={t('clients.selectSpecialPrice')}
          className="h-4 w-4 rounded border-slate-300"
        />
      ),
    },
    {
      key: 'product',
      header: t('clients.product'),
      render: (price: ClientProductSpecialPrice) => {
        const product = typeof price.productId === 'string' ? undefined : price.productId;
        return localizedName(product?.name);
      },
    },
    {
      key: 'service',
      header: t('clients.service'),
      render: (price: ClientProductSpecialPrice) => {
        const service = typeof price.serviceId === 'string' ? undefined : price.serviceId;
        return localizedName(service?.name);
      },
    },
    {
      key: 'category',
      header: t('clients.category'),
      render: (price: ClientProductSpecialPrice) => {
        const category = typeof price.categoryId === 'string' ? undefined : price.categoryId;
        return localizedName(category?.name);
      },
    },
    {
      key: 'pricingType',
      header: t('clients.pricingType'),
      render: (price: ClientProductSpecialPrice) => <Badge variant="info">{t(`stocks.productSpecialPricingTypes.${price.pricingType}`)}</Badge>,
    },
    { key: 'value', header: t('clients.value'), render: (price: ClientProductSpecialPrice) => price.value },
    { key: 'negativeValue', header: t('clients.negativeValue'), render: (price: ClientProductSpecialPrice) => price.negativeValue ?? price.value },
    { key: 'createdAt', header: t('clients.date'), render: (price: ClientProductSpecialPrice) => new Date(price.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (price: ClientProductSpecialPrice) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeSelected([price._id])}
          disabled={isDeleting}
          aria-label={t('common.delete')}
          title={t('common.delete')}
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('clients.specialPrices')} description={t('clients.specialPricesDescription')} />
      <Link to={`/admin/clients/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> {t('clients.backToClient')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('clients.specialPrices')}</h1>
          <p className="text-sm text-slate-500">{client?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <Button type="button" variant="danger" onClick={() => removeSelected(selectedIds)} isLoading={isDeleting} leftIcon={<Trash2 size={16} />}>
              {t('clients.removeSelected')}
            </Button>
          )}
          <Button type="button" onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
            {t('clients.addSpecialPrice')}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Select value={String(limit)} options={[10, 50, 100, 300].map((item) => ({ value: item, label: String(item) }))} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="w-28" />
      </div>

      <Table columns={columns} data={specialPrices} isLoading={isLoading} emptyMessage={t('clients.noSpecialPrices')} getRowKey={(price) => price._id} />
      <Pagination total={meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={t('clients.addSpecialPrice')} size="lg">
        <form onSubmit={submitSpecialPrice} className="space-y-4">
          <Select label={t('clients.service')} value={serviceId} options={serviceOptions} onChange={(event) => { setServiceId(event.target.value); setCategoryId(''); setCategorySearch(''); setProductId(''); setProductSearch(''); }} required />
          <Input
            label={t('clients.category')}
            value={categorySearch}
            list={categoryDatalistId}
            onChange={(event) => {
              const nextValue = event.target.value;
              const selected = categoryDatalistOptions.find((option) => option.label === nextValue);
              setCategorySearch(nextValue);
              setCategoryId(selected?.value || '');
              setProductId('');
              setProductSearch('');
            }}
            required
            disabled={!serviceId}
            placeholder={t('clients.selectCategory')}
          />
          <datalist id={categoryDatalistId}>
            {categoryDatalistOptions.map((option) => (
              <option key={option.value} value={option.label} />
            ))}
          </datalist>
          <Input
            label={t('clients.product')}
            value={productSearch}
            list={productDatalistId}
            onChange={(event) => {
              const nextValue = event.target.value;
              const selected = productDatalistOptions.find((option) => option.label === nextValue);
              setProductSearch(nextValue);
              setProductId(selected?.value || '');
            }}
            required
            disabled={!categoryId}
            placeholder={t('clients.selectProduct')}
          />
          <datalist id={productDatalistId}>
            {productDatalistOptions.map((option) => (
              <option key={option.value} value={option.label} />
            ))}
          </datalist>
          <Select label={t('clients.pricingType')} value={pricingType} options={pricingOptions} onChange={(event) => setPricingType(event.target.value as ProductSpecialPricingType)} required />
          <Input type="number" min="0" step="0.0001" label={t('clients.value')} value={value} onChange={(event) => setValue(event.target.value)} required />
          <Input type="number" min="0" step="0.0001" label={t('clients.negativeValue')} value={negativeValue} onChange={(event) => setNegativeValue(event.target.value)} required />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isCreating} leftIcon={<Plus size={16} />}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
