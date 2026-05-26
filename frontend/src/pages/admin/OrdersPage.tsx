import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Plus, RotateCw, UserCheck, XCircle } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { useCancelOrder, useOrders, useTakeOrder } from '@/features/orders/hooks/orders.hooks';
import { AdminOrder, OrderFulfillmentSource, OrderStatus } from '@/features/orders/types/order.types';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';

const orderStatuses: OrderStatus[] = ['PENDING_MANUAL', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
const fulfillmentSources: OrderFulfillmentSource[] = ['WAREHOUSE', 'API', 'MANUAL'];

export default function OrdersPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [needsAdminAction, setNeedsAdminAction] = useState('');

  const { data: ordersResponse, isLoading } = useOrders({
    page,
    limit,
    search: search || undefined,
    status: status as OrderStatus || undefined,
    fulfillmentSource: source as OrderFulfillmentSource || undefined,
    needsAdminAction: needsAdminAction ? needsAdminAction === 'yes' : undefined,
  });
  const { mutate: takeOrder } = useTakeOrder();
  const { mutate: cancelOrder } = useCancelOrder();

  useEffect(() => {
    setPageTitle(t('orders.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('orders.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const localized = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value?.[key] || value?.en || '';
  };

  const clientLabel = (order: AdminOrder) => {
    if (typeof order.clientId === 'string') return order.clientId;
    return order.clientId.name || order.clientId.username || order.clientId.email;
  };

  const columns = [
    { key: 'orderNumber', header: t('orders.orderNumber') },
    { key: 'client', header: t('orders.client'), render: clientLabel },
    { key: 'product', header: t('orders.product'), render: (order: AdminOrder) => localized(order.productName) },
    { key: 'source', header: t('orders.fulfillmentSource'), render: (order: AdminOrder) => t(`orders.sources.${order.fulfillmentSource}`) },
    { key: 'status', header: t('orders.status'), render: (order: AdminOrder) => <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'FAILED' || order.status === 'CANCELLED' ? 'danger' : 'warning'}>{t(`orders.statuses.${order.status}`)}</Badge> },
    { key: 'total', header: t('orders.totalPrice'), render: (order: AdminOrder) => order.totalPrice.toFixed(4) },
    { key: 'needsAdminAction', header: t('orders.needsAdminAction'), render: (order: AdminOrder) => order.needsAdminAction ? t('common.yes') : t('common.no') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (order: AdminOrder) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/orders/${order._id}`} title={t('common.view')} className="inline-flex h-8 items-center justify-center rounded-md px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <Eye size={16} />
          </Link>
          <Link to={`/admin/orders/add?copyFrom=${order._id}`} title={t('orders.createSame')} className="inline-flex h-8 items-center justify-center rounded-md px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <RotateCw size={16} />
          </Link>
          {order.needsAdminAction && (
            <Button variant="ghost" size="sm" title={t('orders.take')} onClick={() => takeOrder(order._id)}>
              <UserCheck size={16} />
            </Button>
          )}
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <Button variant="ghost" size="sm" title={t('orders.cancel')} onClick={() => cancelOrder(order._id)}>
              <XCircle size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <SEO title={t('orders.title')} />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold">{t('orders.title')}</h1>
          <Link to="/admin/orders/add" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">
            <Plus size={18} />{t('orders.addNew')}
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('common.search')} />
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={[{ value: '', label: t('orders.allStatuses') }, ...orderStatuses.map((item) => ({ value: item, label: t(`orders.statuses.${item}`) }))]} />
          <Select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }} options={[{ value: '', label: t('orders.allSources') }, ...fulfillmentSources.map((item) => ({ value: item, label: t(`orders.sources.${item}`) }))]} />
          <Select value={needsAdminAction} onChange={(event) => { setNeedsAdminAction(event.target.value); setPage(1); }} options={[{ value: '', label: t('orders.allWork') }, { value: 'yes', label: t('orders.needsAdminAction') }, { value: 'no', label: t('orders.noAdminAction') }]} />
          <Select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} options={[10, 50, 100, 300].map((item) => ({ value: item, label: String(item) }))} />
        </div>

        <Table columns={columns} data={ordersResponse?.data || []} isLoading={isLoading} emptyMessage={t('orders.empty')} getRowKey={(order) => order._id} />
        <Pagination total={ordersResponse?.meta?.total || 0} page={page} limit={limit} onChange={setPage} />
      </div>
    </>
  );
}
