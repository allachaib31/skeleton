import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useLanguageStore } from '@/app/stores/language.store';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { useAdminClients } from '@/features/clients/hooks/clients.hooks';
import { useCalculatePricingSimulation } from '@/features/settings/hooks/settings.hooks';
import { PricingSimulationResult } from '@/features/settings/types/settings.types';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';

const getEntityId = (value: string | { _id: string } | undefined) => (typeof value === 'string' ? value : value?._id || '');

export default function SettingsPricingSimulationPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [result, setResult] = useState<PricingSimulationResult | null>(null);

  const { data: clientsResponse } = useAdminClients({ page: 1, limit: 300 });
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: productsResponse } = useStockProducts(
    { page: 1, limit: 300, serviceId, categoryId, isDeleted: false },
    { enabled: Boolean(serviceId && categoryId) }
  );
  const { mutate: calculate, isPending } = useCalculatePricingSimulation();

  const locale = language.split('-')[0] as 'en' | 'fr' | 'ar';
  const localizedName = (value?: { en: string; fr: string; ar: string }) => value?.[locale] || value?.en || t('stocks.products.notSelected');

  useEffect(() => {
    setPageTitle(t('adminSettings.simulation.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.simulation.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const clientOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.simulation.selectClient') },
      ...(clientsResponse?.data || []).map((client) => ({ value: client._id, label: `${client.name} (${client.email})` })),
    ],
    [clientsResponse?.data, t]
  );

  const serviceOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.simulation.selectService') },
      ...(servicesResponse?.data || []).map((service) => ({ value: service._id, label: localizedName(service.name) })),
    ],
    [servicesResponse?.data, locale, t]
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.simulation.selectCategory') },
      ...(categoriesResponse?.data || [])
        .filter((category) => getEntityId(category.serviceId) === serviceId)
        .map((category) => ({ value: category._id, label: localizedName(category.name) })),
    ],
    [categoriesResponse?.data, serviceId, locale, t]
  );

  const productOptions = useMemo(
    () => [
      { value: '', label: t('adminSettings.simulation.selectProduct') },
      ...(productsResponse?.data || []).map((product) => ({ value: product._id, label: localizedName(product.name) })),
    ],
    [productsResponse?.data, locale, t]
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    calculate(
      { clientId, productId, quantity: Number(quantity) },
      { onSuccess: (response) => setResult(response.data) }
    );
  };

  const ruleColumns = [
    {
      key: 'source',
      header: t('adminSettings.simulation.rule'),
      render: (rule: PricingSimulationResult['appliedRules'][number]) => t(`adminSettings.simulation.ruleSources.${rule.source}`),
    },
    {
      key: 'type',
      header: t('adminSettings.simulation.type'),
      render: (rule: PricingSimulationResult['appliedRules'][number]) => rule.pricingType || rule.promotionType || '-',
    },
    {
      key: 'appliedValue',
      header: t('adminSettings.simulation.appliedValue'),
      render: (rule: PricingSimulationResult['appliedRules'][number]) => rule.appliedValue ?? rule.value,
    },
    {
      key: 'before',
      header: t('adminSettings.simulation.before'),
      render: (rule: PricingSimulationResult['appliedRules'][number]) => rule.beforeUnitPrice,
    },
    {
      key: 'after',
      header: t('adminSettings.simulation.after'),
      render: (rule: PricingSimulationResult['appliedRules'][number]) => rule.afterUnitPrice,
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.simulation.title')} description={t('adminSettings.simulation.description')} />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('adminSettings.simulation.title')}</h1>
        <Calculator size={24} className="text-primary" />
      </div>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
        <Select label={t('adminSettings.simulation.client')} value={clientId} options={clientOptions} onChange={(event) => setClientId(event.target.value)} required />
        <Select label={t('adminSettings.simulation.service')} value={serviceId} options={serviceOptions} onChange={(event) => { setServiceId(event.target.value); setCategoryId(''); setProductId(''); setResult(null); }} required />
        <Select label={t('adminSettings.simulation.category')} value={categoryId} options={categoryOptions} onChange={(event) => { setCategoryId(event.target.value); setProductId(''); setResult(null); }} required disabled={!serviceId} />
        <Select label={t('adminSettings.simulation.product')} value={productId} options={productOptions} onChange={(event) => { setProductId(event.target.value); setResult(null); }} required disabled={!categoryId} />
        <Input type="number" min="1" label={t('adminSettings.simulation.quantity')} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        <div className="lg:col-span-5">
          <Button type="submit" isLoading={isPending}>
            {t('adminSettings.simulation.calculate')}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <div className="text-sm text-slate-500">{t('adminSettings.simulation.balanceMode')}</div>
              <div className="mt-3"><Badge variant={result.pricingBalanceMode === 'NEGATIVE_BALANCE' ? 'warning' : 'success'}>{t(`adminSettings.simulation.balanceModes.${result.pricingBalanceMode}`)}</Badge></div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">{t('adminSettings.simulation.unitCost')}</div>
              <div className="mt-3 text-2xl font-bold">{result.unitCost}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">{t('adminSettings.simulation.finalUnitPrice')}</div>
              <div className="mt-3 text-2xl font-bold">{result.finalUnitPrice}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">{t('adminSettings.simulation.finalTotalPrice')}</div>
              <div className="mt-3 text-2xl font-bold">{result.finalTotalPrice}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">{t('adminSettings.simulation.canBuy')}</div>
              <div className="mt-3"><Badge variant={result.canBuyWithOpenCredit ? 'success' : 'danger'}>{result.canBuyWithOpenCredit ? t('common.yes') : t('common.no')}</Badge></div>
            </Card>
          </div>

          <Table columns={ruleColumns} data={result.appliedRules} getRowKey={(rule) => `${rule.source}-${rule.afterUnitPrice}`} />
        </div>
      )}
    </div>
  );
}
