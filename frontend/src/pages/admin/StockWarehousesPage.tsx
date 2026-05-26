import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, PackageOpen, Plus, Trash2 } from 'lucide-react';
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
import { Switch } from '@/shared/components/ui/Switch';
import { Table } from '@/shared/components/ui/Table';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import { StockProduct } from '@/features/stocks/types/stock-product.types';
import { useCreateStockWarehouse, useStockWarehouses, useUpdateStockWarehouse } from '@/features/stocks/hooks/stock-warehouses.hooks';
import { StockWarehouse, stockWarehouseTypes, StockWarehouseType } from '@/features/stocks/types/stock-warehouse.types';

export default function StockWarehousesPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', productId: '', type: '' as StockWarehouseType | '' });
  const [isOpen, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockWarehouse | null>(null);
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [type, setType] = useState<StockWarehouseType>('CODE');
  const [costPrice, setCostPrice] = useState('');
  const [sellNote, setSellNote] = useState('');
  const [isVisible, setVisible] = useState(true);

  const { data: warehousesResponse, isLoading } = useStockWarehouses(params);
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: productsResponse } = useStockProducts({ page: 1, limit: 300, isDeleted: false });
  const { data: formProductsResponse } = useStockProducts(
    { page: 1, limit: 300, serviceId: serviceId || undefined, categoryId: categoryId || undefined, isDeleted: false },
    { enabled: Boolean(serviceId && categoryId) }
  );
  const { mutate: createWarehouse, isPending: isCreating } = useCreateStockWarehouse();
  const { mutate: updateWarehouse, isPending: isUpdating } = useUpdateStockWarehouse();
  const locale = language.split('-')[0] as 'en' | 'fr' | 'ar';

  useEffect(() => {
    setPageTitle(t('stocks.warehouses.title'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('stocks.title') }, { label: t('stocks.warehouses.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const localizedName = (value?: { en: string; fr: string; ar: string }) => value?.[locale] || value?.en || t('stocks.products.notSelected');
  const filterProductOptions = useMemo(
    () => [
      { value: '', label: t('stocks.warehouses.selectProduct') },
      ...(productsResponse?.data || []).map((product) => ({ value: product._id, label: localizedName(product.name) })),
    ],
    [productsResponse?.data, language, t]
  );
  const serviceOptions = useMemo(
    () => (servicesResponse?.data || []).map((service) => ({ value: service._id, label: localizedName(service.name) })),
    [servicesResponse?.data, language, t]
  );
  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.data || [])
        .filter((category) => !serviceId || getCategoryServiceId(category) === serviceId)
        .map((category) => ({ value: category._id, label: localizedName(category.name) })),
    [categoriesResponse?.data, serviceId, language, t]
  );
  const productOptions = useMemo(
    () =>
      (categoryId ? (formProductsResponse?.data || []).filter((product) => getProductCategoryId(product) === categoryId) : [])
        .map((product) => ({ value: product._id, label: localizedName(product.name) })),
    [formProductsResponse?.data, categoryId, language, t]
  );

  const handleServiceSearch = (value: string) => {
    setServiceSearch(value);
    const selected = serviceOptions.find((service) => service.label === value);
    setServiceId(selected?.value || '');
    setCategoryId('');
    setCategorySearch('');
    setProductId('');
    setProductSearch('');
  };

  const handleCategorySearch = (value: string) => {
    setCategorySearch(value);
    const selected = categoryOptions.find((category) => category.label === value);
    setCategoryId(selected?.value || '');
    setProductId('');
    setProductSearch('');
  };

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    const selected = productOptions.find((product) => product.label === value);
    setProductId(selected?.value || '');
  };

  const reset = () => {
    setEditing(null);
    setName('');
    setServiceId('');
    setServiceSearch('');
    setCategoryId('');
    setCategorySearch('');
    setProductId('');
    setProductSearch('');
    setType('CODE');
    setCostPrice('');
    setSellNote('');
    setVisible(true);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const openEdit = (warehouse: StockWarehouse) => {
    setEditing(warehouse);
    setName(warehouse.name);
    setServiceId(getEntityId(warehouse.serviceId));
    setServiceSearch(typeof warehouse.serviceId === 'string' ? '' : localizedName(warehouse.serviceId.name));
    setCategoryId(getEntityId(warehouse.categoryId));
    setCategorySearch(typeof warehouse.categoryId === 'string' ? '' : localizedName(warehouse.categoryId.name));
    setProductId(typeof warehouse.productId === 'string' ? warehouse.productId : warehouse.productId._id);
    setProductSearch(typeof warehouse.productId === 'string' ? '' : localizedName(warehouse.productId.name));
    setType(warehouse.type);
    setCostPrice(String(warehouse.costPrice));
    setSellNote(warehouse.sellNote || '');
    setVisible(warehouse.isVisible);
    setOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { name, productId, type, costPrice: Number(costPrice || 0), sellNote, isVisible };
    if (editing) updateWarehouse({ id: editing._id, data }, { onSuccess: close });
    else createWarehouse(data, { onSuccess: close });
  };

  const columns = [
    { key: 'name', header: t('stocks.warehouses.name'), render: (warehouse: StockWarehouse) => <span className="font-semibold">{warehouse.name}</span> },
    { key: 'product', header: t('clients.product'), render: (warehouse: StockWarehouse) => localizedName(typeof warehouse.productId === 'string' ? undefined : warehouse.productId.name) },
    { key: 'type', header: t('stocks.warehouses.type'), render: (warehouse: StockWarehouse) => <Badge variant="info">{t(`stocks.warehouseTypes.${warehouse.type}`)}</Badge> },
    { key: 'available', header: t('stocks.warehouses.available'), render: (warehouse: StockWarehouse) => warehouse.availableQuantity },
    { key: 'reserved', header: t('stocks.warehouses.reserved'), render: (warehouse: StockWarehouse) => warehouse.reservedQuantity },
    { key: 'sold', header: t('stocks.warehouses.sold'), render: (warehouse: StockWarehouse) => warehouse.soldQuantity },
    { key: 'disabled', header: t('stocks.warehouses.disabled'), render: (warehouse: StockWarehouse) => warehouse.disabledQuantity },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (warehouse: StockWarehouse) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(warehouse)} aria-label={t('common.edit')} title={t('common.edit')}><Edit size={16} /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => updateWarehouse({ id: warehouse._id, data: { isDeleted: true } })} aria-label={t('common.delete')} title={t('common.delete')}><Trash2 size={16} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.warehouses.title')} description={t('stocks.warehouses.description')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.warehouses.title')}</h1>
          <PackageOpen size={24} className="text-primary" />
        </div>
        <Button type="button" onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>{t('stocks.warehouses.create')}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input value={params.search} onChange={(event) => setParams((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder={t('common.search')} />
        <Select value={params.productId} options={filterProductOptions} onChange={(event) => setParams((current) => ({ ...current, productId: event.target.value, page: 1 }))} />
        <Select value={params.type} options={[{ value: '', label: t('common.all') }, ...stockWarehouseTypes.map((item) => ({ value: item, label: t(`stocks.warehouseTypes.${item}`) }))]} onChange={(event) => setParams((current) => ({ ...current, type: event.target.value as StockWarehouseType | '', page: 1 }))} />
        <Select value={String(params.limit)} options={[10, 50, 100, 300].map((item) => ({ value: item, label: String(item) }))} onChange={(event) => setParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
      </div>

      <Table columns={columns} data={warehousesResponse?.data || []} isLoading={isLoading} emptyMessage={t('stocks.warehouses.empty')} getRowKey={(warehouse) => warehouse._id} />
      <Pagination total={warehousesResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />

      <Modal isOpen={isOpen} onClose={close} title={editing ? t('stocks.warehouses.update') : t('stocks.warehouses.create')} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Input label={t('stocks.warehouses.name')} value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label={t('clients.service')} list="warehouse-service-options" value={serviceSearch} onChange={(event) => handleServiceSearch(event.target.value)} placeholder={t('stocks.products.selectService')} required />
          <datalist id="warehouse-service-options">
            {serviceOptions.map((service) => <option key={service.value} value={service.label} />)}
          </datalist>
          <Input label={t('clients.category')} list="warehouse-category-options" value={categorySearch} onChange={(event) => handleCategorySearch(event.target.value)} placeholder={serviceId ? t('stocks.products.selectCategory') : t('orders.chooseService')} required disabled={!serviceId} />
          <datalist id="warehouse-category-options">
            {categoryOptions.map((category) => <option key={category.value} value={category.label} />)}
          </datalist>
          <Input label={t('clients.product')} list="warehouse-product-options" value={productSearch} onChange={(event) => handleProductSearch(event.target.value)} placeholder={categoryId ? t('stocks.warehouses.selectProduct') : t('orders.chooseCategoryFirst')} required disabled={!categoryId} />
          <datalist id="warehouse-product-options">
            {productOptions.map((product) => <option key={product.value} value={product.label} />)}
          </datalist>
          <Select label={t('stocks.warehouses.type')} value={type} options={stockWarehouseTypes.map((item) => ({ value: item, label: t(`stocks.warehouseTypes.${item}`) }))} onChange={(event) => setType(event.target.value as StockWarehouseType)} />
          <Input label={t('stocks.products.costPrice')} type="number" min="0" step="0.0001" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
          <Textarea label={t('stocks.warehouses.sellNote')} value={sellNote} onChange={(event) => setSellNote(event.target.value)} />
          <Switch label={t('stocks.services.show')} checked={isVisible} onChange={(event) => setVisible(event.target.checked)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={!productId} isLoading={isCreating || isUpdating}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const getEntityId = (value: { _id: string } | string) => (typeof value === 'string' ? value : value._id);

const getCategoryServiceId = (category: StockCategory) =>
  typeof category.serviceId === 'string' ? category.serviceId : category.serviceId._id;

const getProductCategoryId = (product: StockProduct) =>
  typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;
