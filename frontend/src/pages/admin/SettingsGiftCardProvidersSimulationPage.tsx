import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Play } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { useSettingsApis, useSimulateGiftCardProvidersApi } from '@/features/settings/hooks/settings.hooks';
import { GiftCardProvidersAction, giftCardProvidersActions, GiftCardProvidersSimulationRequest } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseParams = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split('=');
      if (key?.trim()) acc[key.trim()] = rest.join('=').trim();
      return acc;
    }, {});

interface SettingsGiftCardProvidersSimulationPageProps {
  embedded?: boolean;
}

export default function SettingsGiftCardProvidersSimulationPage({ embedded = false }: SettingsGiftCardProvidersSimulationPageProps) {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [apiId, setApiId] = useState('');
  const [action, setAction] = useState<GiftCardProvidersAction>('PROFILE');
  const [productsId, setProductsId] = useState('');
  const [productsBase, setProductsBase] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [quantityValuesState, setQuantityValuesState] = useState<'ANY' | 'NULL' | 'NOT_NULL'>('ANY');
  const [parentId, setParentId] = useState('0');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [orderUuid, setOrderUuid] = useState('');
  const [orderParams, setOrderParams] = useState('');
  const [orders, setOrders] = useState('');
  const [byUuid, setByUuid] = useState(false);

  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { mutate: simulate, data: simulationResponse, isPending } = useSimulateGiftCardProvidersApi();

  useEffect(() => {
    if (embedded) return;
    setPageTitle(t('adminSettings.giftCardProvidersSimulation.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.giftCardProvidersSimulation.title') },
    ]);
  }, [embedded, setPageTitle, setBreadcrumbs, t]);

  const apiOptions = useMemo(() => {
    const apis = (apisResponse?.data || []).filter(
      (api) => api.group === 'GIFT_CARD_PROVIDERS' && api.isVisible && !api.isDeleted
    );
    return [
      { value: '', label: t('adminSettings.giftCardProvidersSimulation.selectApi') },
      ...apis.map((api) => ({ value: api._id, label: api.name })),
    ];
  }, [apisResponse?.data, t]);

  const productResponse = simulationResponse?.data?.action === 'PRODUCTS' && Array.isArray(simulationResponse.data.response)
    ? simulationResponse.data.response
    : [];

  const productTypeOptions = useMemo(() => {
    const types = Array.from(new Set(
      productResponse
        .map((product) => product && typeof product === 'object' ? String((product as Record<string, unknown>).product_type || '') : '')
        .filter(Boolean)
    )).sort();
    return [
      { value: '', label: t('adminSettings.giftCardProvidersSimulation.allProductTypes') },
      ...types.map((type) => ({ value: type, label: type })),
    ];
  }, [productResponse, t]);

  const displayedResponse = useMemo(() => {
    if (simulationResponse?.data?.action !== 'PRODUCTS' || !Array.isArray(simulationResponse.data.response)) {
      return simulationResponse?.data?.response;
    }

    return simulationResponse.data.response.filter((product) => {
      if (!product || typeof product !== 'object') return false;
      const record = product as Record<string, unknown>;
      if (productTypeFilter && record.product_type !== productTypeFilter) return false;
      if (quantityValuesState === 'NULL' && record.qty_values !== null) return false;
      if (quantityValuesState === 'NOT_NULL' && record.qty_values === null) return false;
      return true;
    });
  }, [productTypeFilter, quantityValuesState, simulationResponse?.data]);

  const buildPayload = (): GiftCardProvidersSimulationRequest | null => {
    if (!apiId) {
      toast.error(t('adminSettings.giftCardProvidersSimulation.apiRequired'));
      return null;
    }

    if (action === 'PRODUCTS') {
      return {
        apiId,
        action,
        products: {
          productsId: splitList(productsId),
          base: productsBase,
        },
      };
    }

    if (action === 'CONTENT') {
      return { apiId, action, content: { parentId: Number(parentId || 0) } };
    }

    if (action === 'CREATE_ORDER') {
      if (!productId) {
        toast.error(t('adminSettings.giftCardProvidersSimulation.productRequired'));
        return null;
      }
      return {
        apiId,
        action,
        order: {
          productId: Number(productId),
          quantity: Number(quantity || 1),
          ...(orderUuid ? { orderUuid } : {}),
          params: parseParams(orderParams),
        },
      };
    }

    if (action === 'CHECK_ORDERS') {
      const orderList = splitList(orders);
      if (orderList.length === 0) {
        toast.error(t('adminSettings.giftCardProvidersSimulation.ordersRequired'));
        return null;
      }
      return { apiId, action, check: { orders: orderList, byUuid } };
    }

    return { apiId, action };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (payload) simulate(payload);
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <>
          <SEO title={t('adminSettings.giftCardProvidersSimulation.title')} description={t('adminSettings.giftCardProvidersSimulation.description')} />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t('adminSettings.giftCardProvidersSimulation.title')}</h1>
            <Gift size={24} className="text-primary" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-5">
        <Select label={t('adminSettings.giftCardProvidersSimulation.api')} value={apiId} options={apiOptions} onChange={(event) => setApiId(event.target.value)} required />
        <Select
          label={t('adminSettings.giftCardProvidersSimulation.action')}
          value={action}
          options={giftCardProvidersActions.map((item) => ({ value: item, label: t(`adminSettings.giftCardProvidersSimulation.actions.${item}`) }))}
          onChange={(event) => setAction(event.target.value as GiftCardProvidersAction)}
        />
        <div className="xl:col-span-3 rounded-md border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
          {t(`adminSettings.giftCardProvidersSimulation.actionDescriptions.${action}`)}
        </div>

        {action === 'PRODUCTS' && (
          <>
            <Textarea className="xl:col-span-2" label={t('adminSettings.giftCardProvidersSimulation.productsId')} value={productsId} onChange={(event) => setProductsId(event.target.value)} placeholder={t('adminSettings.giftCardProvidersSimulation.productsIdPlaceholder')} />
            <div className="flex items-end pb-2">
              <Switch label={t('adminSettings.giftCardProvidersSimulation.baseProducts')} checked={productsBase} onChange={(event) => setProductsBase(event.target.checked)} />
            </div>
          </>
        )}

        {action === 'CONTENT' && (
          <Input type="number" min="0" label={t('adminSettings.giftCardProvidersSimulation.parentId')} value={parentId} onChange={(event) => setParentId(event.target.value)} required />
        )}

        {action === 'CREATE_ORDER' && (
          <>
            <Input type="number" min="1" label={t('adminSettings.giftCardProvidersSimulation.productId')} value={productId} onChange={(event) => setProductId(event.target.value)} required />
            <Input type="number" min="1" label={t('adminSettings.giftCardProvidersSimulation.quantity')} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            <Input label={t('adminSettings.giftCardProvidersSimulation.orderUuid')} value={orderUuid} onChange={(event) => setOrderUuid(event.target.value)} placeholder={t('adminSettings.giftCardProvidersSimulation.autoUuid')} />
            <Textarea className="xl:col-span-2" label={t('adminSettings.giftCardProvidersSimulation.orderParams')} value={orderParams} onChange={(event) => setOrderParams(event.target.value)} placeholder={t('adminSettings.giftCardProvidersSimulation.orderParamsPlaceholder')} />
          </>
        )}

        {action === 'CHECK_ORDERS' && (
          <>
            <Textarea className="xl:col-span-2" label={t('adminSettings.giftCardProvidersSimulation.orders')} value={orders} onChange={(event) => setOrders(event.target.value)} placeholder={t('adminSettings.giftCardProvidersSimulation.ordersPlaceholder')} required />
            <div className="flex items-end pb-2">
              <Switch label={t('adminSettings.giftCardProvidersSimulation.byUuid')} checked={byUuid} onChange={(event) => setByUuid(event.target.checked)} />
            </div>
          </>
        )}

        <div className="flex items-end">
          <Button type="submit" isLoading={isPending} leftIcon={<Play size={16} />}>
            {t('adminSettings.giftCardProvidersSimulation.simulate')}
          </Button>
        </div>
      </form>

      {action === 'CREATE_ORDER' && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
          {t('adminSettings.giftCardProvidersSimulation.orderWarning')}
        </div>
      )}

      {simulationResponse?.data && (
        <div className="space-y-3">
          <Badge variant="info">{t(`adminSettings.giftCardProvidersSimulation.actions.${simulationResponse.data.action}`)}</Badge>
          {simulationResponse.data.action === 'PRODUCTS' && Array.isArray(simulationResponse.data.response) && (
            <div className="grid gap-4 rounded-md border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-3">
              <Select
                label={t('adminSettings.giftCardProvidersSimulation.productType')}
                value={productTypeFilter}
                options={productTypeOptions}
                onChange={(event) => setProductTypeFilter(event.target.value)}
              />
              <Select
                label={t('adminSettings.giftCardProvidersSimulation.quantityValuesState')}
                value={quantityValuesState}
                options={[
                  { value: 'ANY', label: t('adminSettings.giftCardProvidersSimulation.quantityValuesStates.ANY') },
                  { value: 'NULL', label: t('adminSettings.giftCardProvidersSimulation.quantityValuesStates.NULL') },
                  { value: 'NOT_NULL', label: t('adminSettings.giftCardProvidersSimulation.quantityValuesStates.NOT_NULL') },
                ]}
                onChange={(event) => setQuantityValuesState(event.target.value as 'ANY' | 'NULL' | 'NOT_NULL')}
              />
              <div className="flex items-end text-sm text-slate-500">
                {t('adminSettings.giftCardProvidersSimulation.displayedProducts', {
                  count: Array.isArray(displayedResponse) ? displayedResponse.length : 0,
                  total: simulationResponse.data.response.length,
                })}
              </div>
            </div>
          )}
          {simulationResponse.data.errorInfo && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
              <div className="font-semibold">{t('adminSettings.giftCardProvidersSimulation.decodedError')}</div>
              <div className="mt-1 font-mono">
                {simulationResponse.data.errorInfo.code} - {simulationResponse.data.errorInfo.key}
              </div>
              <div className="mt-1">
                {t('adminSettings.giftCardProvidersSimulation.retryable')}: {simulationResponse.data.errorInfo.retryable ? t('common.yes') : t('common.no')}
              </div>
            </div>
          )}
          <pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs text-slate-50 dark:border-slate-800">
            {JSON.stringify(displayedResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
