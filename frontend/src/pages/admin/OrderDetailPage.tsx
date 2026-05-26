import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useLanguageStore } from '@/app/stores/language.store';
import { useCancelOrder, useCompleteOrder, useFailOrder, useOrder, useSwitchOrderApi, useTakeOrder } from '@/features/orders/hooks/orders.hooks';
import { useStockProductApiConnections } from '@/features/stocks/hooks/stock-products.hooks';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: orderResponse, isLoading } = useOrder(id);
  const { mutate: takeOrder } = useTakeOrder();
  const { mutate: cancelOrder } = useCancelOrder();
  const { mutate: completeOrder } = useCompleteOrder(id);
  const { mutate: failOrder } = useFailOrder(id);
  const { mutate: switchApi, isPending: isSwitchingApi } = useSwitchOrderApi(id);
  const [manualCode, setManualCode] = useState('');
  const [issueReason, setIssueReason] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [requirementValues, setRequirementValues] = useState<Record<string, string>>({});

  const order = orderResponse?.data;
  const orderProductId = order ? getEntityId(order.productId) : '';
  const { data: connectionsResponse } = useStockProductApiConnections(orderProductId);
  const connections = useMemo(
    () => (connectionsResponse?.data || []).filter((connection) => !connection.isLegacy && connection.quantityAvailable),
    [connectionsResponse?.data]
  );
  const selectedConnection = connections.find((connection) => connection._id === connectionId);
  const apiRequirements = useMemo(() => selectedConnection?.requirements || [], [selectedConnection?.requirements]);
  const previousInputOptions = useMemo(
    () => order?.requirementSnapshots.map((requirement) => ({ value: requirement.paramsName, label: `${requirement.paramsName}: ${requirement.value}` })) || [],
    [order?.requirementSnapshots]
  );

  useEffect(() => {
    setPageTitle(t('orders.detailTitle'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('orders.title'), href: '/admin/orders' },
      { label: order?.orderNumber || t('orders.detailTitle') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t, order?.orderNumber]);

  const handleComplete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    completeOrder({ deliveredItems: manualCode ? [{ code: manualCode }] : undefined });
  };

  const handleFail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (issueReason) failOrder(issueReason);
  };

  const localized = (value?: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value?.[key] || value?.en || '';
  };

  useEffect(() => {
    if (!connectionId || !order) return;
    setRequirementValues(
      apiRequirements.reduce<Record<string, string>>((values, requirement) => {
        const previousValue = order.requirementSnapshots.find((item) => item.paramsName === requirement.paramsName)?.value;
        values[requirement.paramsName] = previousValue || requirement.defaultValue || '';
        return values;
      }, {})
    );
  }, [connectionId, apiRequirements, order?._id]);

  const handleRequirementSourceChange = (paramsName: string, previousParamsName: string) => {
    const previousValue = order?.requirementSnapshots.find((requirement) => requirement.paramsName === previousParamsName)?.value || '';
    setRequirementValues((current) => ({ ...current, [paramsName]: previousValue }));
  };

  const handleSwitchApi = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!connectionId) return;
    switchApi({ connectionId, requirements: requirementValues });
  };

  if (isLoading || !order) return <div>{t('common.loading')}</div>;

  return (
    <>
      <SEO title={order.orderNumber} />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <div className="mt-2 flex gap-2">
              <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'FAILED' || order.status === 'CANCELLED' ? 'danger' : 'warning'}>{t(`orders.statuses.${order.status}`)}</Badge>
              <Badge>{t(`orders.sources.${order.fulfillmentSource}`)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {order.needsAdminAction && <Button onClick={() => takeOrder(order._id)}>{t('orders.take')}</Button>}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && <Button variant="outline" onClick={() => cancelOrder(order._id)}>{t('orders.cancel')}</Button>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Info label={t('orders.quantity')} value={order.quantity} />
          <Info label={t('orders.unitPrice')} value={order.unitPrice.toFixed(4)} />
          <Info label={t('orders.totalPrice')} value={order.totalPrice.toFixed(4)} />
          <Info label={t('orders.balanceAfter')} value={order.balanceAfter.toFixed(4)} />
        </div>

        {order.issueReason && <div className="rounded-lg border border-red-500/30 p-4 text-red-500">{t(`orders.issueReasons.${order.issueReason}`, { defaultValue: order.issueReason })}</div>}

        {order.fulfillmentSource === 'API' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <form onSubmit={handleSwitchApi} className="space-y-4 rounded-lg border border-white/10 p-4">
            <div>
              <h2 className="text-lg font-semibold">{t('orders.switchApi')}</h2>
              <p className="text-sm text-slate-500">{t('orders.switchApiDescription')}</p>
            </div>
            <Select
              label={t('orders.apiConnection')}
              value={connectionId}
              onChange={(event) => setConnectionId(event.target.value)}
              options={[
                { value: '', label: t('orders.chooseApiConnection') },
                ...connections.map((connection) => ({
                  value: connection._id,
                  label: `${typeof connection.apiId === 'string' ? connection.apiGroup : connection.apiId.name} - ${String((connection.apiPayload || {}).name || connection.apiProductId)}`,
                })),
              ]}
              required
            />
            {connectionId && apiRequirements.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {apiRequirements.map((requirement) => (
                  <div key={requirement._id} className="space-y-2">
                    <Select
                      label={`${t('orders.previousInputFor')} ${localized(requirement.message) || requirement.paramsName}`}
                      value=""
                      onChange={(event) => handleRequirementSourceChange(requirement.paramsName, event.target.value)}
                      options={[{ value: '', label: t('orders.choosePreviousInput') }, ...previousInputOptions]}
                    />
                    <Input
                      label={localized(requirement.message) || requirement.paramsName}
                      value={requirementValues[requirement.paramsName] || ''}
                      onChange={(event) => setRequirementValues((current) => ({ ...current, [requirement.paramsName]: event.target.value }))}
                      required={requirement.isRequired}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button type="submit" isLoading={isSwitchingApi} disabled={!connectionId}>{t('orders.switchApiSubmit')}</Button>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('orders.requirements')}</h2>
            {order.requirementSnapshots.length === 0 ? <p className="text-sm text-slate-500">{t('orders.noRequirements')}</p> : order.requirementSnapshots.map((requirement) => (
              <Info key={requirement.paramsName} label={requirement.paramsName} value={requirement.value} />
            ))}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('orders.deliveredItems')}</h2>
            {order.deliveredItems.length === 0 ? <p className="text-sm text-slate-500">{t('orders.noDeliveredItems')}</p> : order.deliveredItems.map((item, index) => (
              <div key={`${item.code}-${index}`} className="rounded-lg border border-white/10 p-3 text-sm">
                <div>{item.code}</div>
                {item.serialNumber && <div>{item.serialNumber}</div>}
                {item.pin && <div>{item.pin}</div>}
              </div>
            ))}
          </section>
        </div>

        {order.needsAdminAction && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleComplete} className="space-y-3 rounded-lg border border-white/10 p-4">
              <h2 className="text-lg font-semibold">{t('orders.complete')}</h2>
              <Input label={t('orders.manualCode')} value={manualCode} onChange={(event) => setManualCode(event.target.value)} />
              <Button type="submit">{t('orders.complete')}</Button>
            </form>
            <form onSubmit={handleFail} className="space-y-3 rounded-lg border border-white/10 p-4">
              <h2 className="text-lg font-semibold">{t('orders.fail')}</h2>
              <Textarea label={t('orders.issueReason')} value={issueReason} onChange={(event) => setIssueReason(event.target.value)} required />
              <Button type="submit" variant="danger">{t('orders.fail')}</Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

function getEntityId(value: { _id: string } | string) {
  return typeof value === 'string' ? value : value._id;
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
