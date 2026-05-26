import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useAdminClients } from '@/features/clients/hooks/clients.hooks';
import { useCreateOrder, useOrder } from '@/features/orders/hooks/orders.hooks';
import { useCalculatePricingSimulation } from '@/features/settings/hooks/settings.hooks';
import { PricingSimulationResult } from '@/features/settings/types/settings.types';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProduct, useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import { StockProduct } from '@/features/stocks/types/stock-product.types';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';

export default function OrderCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyFromOrderId = searchParams.get('copyFrom') || '';
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [requirements, setRequirements] = useState<Record<string, string>>({});
  const [pricingResult, setPricingResult] = useState<PricingSimulationResult | null>(null);
  const [prefilledOrderId, setPrefilledOrderId] = useState('');

  const { data: clientsResponse } = useAdminClients({ page: 1, limit: 300 });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({
    page: 1,
    all: 'true',
    serviceId: serviceId || undefined,
    isVisible: 'true',
    isDeleted: 'false',
  });
  const { data: productsResponse } = useStockProducts({
    page: 1,
    all: 'true',
    serviceId: serviceId || undefined,
    categoryId: categoryId || undefined,
    isVisible: true,
    isDeleted: false,
  });
  const { data: productResponse } = useStockProduct(productId);
  const { data: copyOrderResponse } = useOrder(copyFromOrderId);
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { mutate: calculatePricing, isPending: isPricingPending } = useCalculatePricingSimulation();

  useEffect(() => {
    setPageTitle(t('orders.addTitle'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('orders.title'), href: '/admin/orders' },
      { label: t('orders.addTitle') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const localized = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value?.[key] || value?.en || '';
  };

  const clientOptions = useMemo(
    () => [{ value: '', label: t('orders.chooseClient') }, ...(clientsResponse?.data || []).map((client) => ({ value: client._id, label: `${client.name || client.username || client.email} (${client.email})` }))],
    [clientsResponse?.data, t]
  );

  const serviceOptions = useMemo(
    () => [{ value: '', label: t('orders.chooseService') }, ...(servicesResponse?.data || []).map((service) => ({ value: service._id, label: localized(service.name) }))],
    [servicesResponse?.data, language, t]
  );

  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.data || [])
        .filter((category) => !serviceId || getCategoryServiceId(category) === serviceId)
        .map((category) => ({ value: category._id, label: localized(category.name) })),
    [categoriesResponse?.data, serviceId, language, t]
  );

  const productOptions = useMemo(
    () =>
      (categoryId ? (productsResponse?.data || []).filter((product) => getProductCategoryId(product) === categoryId) : [])
        .map((product) => ({ value: product._id, label: localized(product.name) })),
    [productsResponse?.data, categoryId, language, t]
  );

  const handleCategorySearch = (value: string) => {
    setPrefilledOrderId('');
    setCategorySearch(value);
    const selected = categoryOptions.find((category) => category.label === value);
    setCategoryId(selected?.value || '');
    setProductId('');
    setProductSearch('');
    setRequirements({});
  };

  const handleProductSearch = (value: string) => {
    setPrefilledOrderId('');
    setProductSearch(value);
    const selected = productOptions.find((product) => product.label === value);
    setProductId(selected?.value || '');
    setRequirements({});
  };

  const product = productResponse?.data;
  const productRequirements = (product?.requirements || []).filter((requirement) => typeof requirement !== 'string');
  const productCountryOptions = useMemo(
    () => getProductCountryOptions(product),
    [product]
  );

  useEffect(() => {
    const copyOrder = copyOrderResponse?.data;
    if (!copyOrder || prefilledOrderId === copyOrder._id) return;

    setClientId(getEntityId(copyOrder.clientId));
    setServiceId(getEntityId(copyOrder.serviceId));
    setCategoryId(getEntityId(copyOrder.categoryId));
    setCategorySearch(typeof copyOrder.categoryId === 'string' ? '' : localized(copyOrder.categoryId.name));
    setProductId(getEntityId(copyOrder.productId));
    setProductSearch(localized(copyOrder.productName));
    setQuantity(copyOrder.quantity);
    setRequirements(
      copyOrder.requirementSnapshots.reduce<Record<string, string>>((values, requirement) => {
        values[requirement.paramsName] = requirement.value;
        return values;
      }, {})
    );
    setPricingResult(null);
    setPrefilledOrderId(copyOrder._id);
  }, [copyOrderResponse?.data, prefilledOrderId, language]);

  useEffect(() => {
    if (!product) return;
    if (prefilledOrderId) return;
    if ((product.quantityMode === 'QUANTITY' || product.quantityMode === 'COUNTER') && product.minQuantity !== undefined) {
      setQuantity(product.minQuantity);
    } else {
      setQuantity(1);
    }
    setPricingResult(null);
  }, [product?._id, product?.quantityMode, product?.minQuantity]);

  useEffect(() => {
    if (!clientId || !productId || !quantity) {
      setPricingResult(null);
      return;
    }
    calculatePricing(
      { clientId, productId, quantity },
      { onSuccess: (response) => setPricingResult(response.data) }
    );
  }, [clientId, productId, quantity, calculatePricing]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId || !productId) return;
    createOrder(
      { clientId, productId, quantity, requirements },
      { onSuccess: (response) => navigate(`/admin/orders/${response.data._id}`) }
    );
  };

  return (
    <>
      <SEO title={t('orders.addTitle')} />
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('orders.addTitle')}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label={t('orders.client')} value={clientId} onChange={(event) => setClientId(event.target.value)} options={clientOptions} required />
          <Select label={t('orders.service')} value={serviceId} onChange={(event) => { setPrefilledOrderId(''); setServiceId(event.target.value); setCategoryId(''); setCategorySearch(''); setProductId(''); setProductSearch(''); setRequirements({}); }} options={serviceOptions} required />
          <Input label={t('orders.category')} list="order-category-options" value={categorySearch} onChange={(event) => handleCategorySearch(event.target.value)} placeholder={t('orders.chooseCategory')} required disabled={!serviceId} />
          <datalist id="order-category-options">
            {categoryOptions.map((category) => <option key={category.value} value={category.label} />)}
          </datalist>
          <Input label={t('orders.product')} list="order-product-options" value={productSearch} onChange={(event) => handleProductSearch(event.target.value)} placeholder={categoryId ? t('orders.chooseProduct') : t('orders.chooseCategoryFirst')} required disabled={!categoryId} />
          <datalist id="order-product-options">
            {productOptions.map((product) => <option key={product.value} value={product.label} />)}
          </datalist>
          <Input
            label={t('orders.quantity')}
            type="number"
            min={(product?.quantityMode === 'QUANTITY' || product?.quantityMode === 'COUNTER') ? product.minQuantity ?? 1 : 1}
            max={(product?.quantityMode === 'QUANTITY' || product?.quantityMode === 'COUNTER') ? product.maxQuantity : undefined}
            value={quantity}
            onChange={(event) => { setPrefilledOrderId(''); setQuantity(Number(event.target.value)); }}
            required
          />
        </div>

        {product && (
          <div className="grid gap-3 rounded-lg border border-white/10 p-4 md:grid-cols-5">
            <div><div className="text-sm text-slate-500">{t('orders.fulfillmentType')}</div><div className="font-medium">{product.fulfillmentType}</div></div>
            <div><div className="text-sm text-slate-500">{t('orders.costPrice')}</div><div className="font-medium">{isPricingPending ? t('common.loading') : pricingResult?.unitCost ?? '-'}</div></div>
            <div><div className="text-sm text-slate-500">{t('orders.costManual')}</div><div className="font-medium">{product.costManual ?? '-'}</div></div>
            <div><div className="text-sm text-slate-500">{t('orders.finalUnitPrice')}</div><div className="font-medium">{isPricingPending ? t('common.loading') : pricingResult?.finalUnitPrice ?? '-'}</div></div>
            <div><div className="text-sm text-slate-500">{t('orders.finalTotalPrice')}</div><div className="font-medium">{isPricingPending ? t('common.loading') : pricingResult?.finalTotalPrice ?? '-'}</div></div>
            <div><div className="text-sm text-slate-500">{t('orders.canBuy')}</div><div className="font-medium">{pricingResult ? (pricingResult.canBuyWithOpenCredit ? t('common.yes') : t('common.no')) : '-'}</div></div>
          </div>
        )}

        {productRequirements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('orders.requirements')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {productRequirements.map((requirement) => {
                const key = requirement.paramsName;
                const label = localized(requirement.message) || requirement.paramsName;
                if (key === 'countryCode' && productCountryOptions.length > 0) {
                  return (
                    <Select
                      key={requirement._id}
                      label={label}
                      value={requirements[key] || ''}
                      options={[{ value: '', label: t('orders.chooseCountry') }, ...productCountryOptions]}
                      onChange={(event) => {
                        setPrefilledOrderId('');
                        setRequirements((current) => ({ ...current, [key]: event.target.value }));
                      }}
                      required={requirement.isRequired}
                    />
                  );
                }
                if (requirement.inputType === 'TEXTAREA') {
                  return <Textarea key={requirement._id} label={label} value={requirements[key] || ''} onChange={(event) => { setPrefilledOrderId(''); setRequirements((current) => ({ ...current, [key]: event.target.value })); }} required={requirement.isRequired} />;
                }
                return <Input key={requirement._id} label={label} type={requirement.inputType === 'NUMBER' ? 'number' : 'text'} value={requirements[key] || ''} onChange={(event) => { setPrefilledOrderId(''); setRequirements((current) => ({ ...current, [key]: event.target.value })); }} required={requirement.isRequired} />;
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>{t('orders.create')}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')}>{t('common.cancel')}</Button>
        </div>
      </form>
    </>
  );
}

function getCategoryServiceId(category: StockCategory) {
  return typeof category.serviceId === 'string' ? category.serviceId : category.serviceId._id;
}

function getProductCategoryId(product: StockProduct) {
  return typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;
}

function getEntityId(value: { _id: string } | string) {
  return typeof value === 'string' ? value : value._id;
}

interface ProviderCountryOption {
  countryCode: string;
  countryName: string;
  flag?: string;
  price?: number;
  count?: number;
}

function getProductCountryOptions(product?: StockProduct) {
  const countries = product?.apiPayload?.countries;
  if (!Array.isArray(countries)) return [];

  const visibleCodes = new Set(product?.visibleCountryCodes || []);
  return countries
    .map((country): ProviderCountryOption | null => {
      if (!country || typeof country !== 'object') return null;
      const record = country as Record<string, unknown>;
      const countryCode = String(record.countryCode || record.country || '').trim();
      if (!countryCode) return null;
      if (visibleCodes.size > 0 && !visibleCodes.has(countryCode)) return null;
      return {
        countryCode,
        countryName: String(record.countryName || record.name || countryCode),
        flag: typeof record.flag === 'string' ? record.flag : undefined,
        price: typeof record.price === 'number' ? record.price : undefined,
        count: typeof record.count === 'number' ? record.count : undefined,
      };
    })
    .filter((country): country is ProviderCountryOption => Boolean(country))
    .sort((left, right) => left.countryName.localeCompare(right.countryName))
    .map((country) => ({
      value: country.countryCode,
      label: [
        country.flag,
        country.countryName,
        `(${country.countryCode})`,
        country.count !== undefined ? `- ${country.count}` : '',
      ].filter(Boolean).join(' '),
    }));
}
