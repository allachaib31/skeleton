import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  Dot,
  ProductTile,
} from '../components/primitives';
import { useShopOrder } from '../hooks/shop.hooks';
import { localized } from '../utils/shop-format';
import { AdminOrder, OrderStatus } from '@/features/orders/types/order.types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: orderResponse, isLoading } = useShopOrder(id);
  const order = orderResponse?.data;

  if (isLoading) {
    return <div className="h-[520px] rounded-2xl border border-gray-200 bg-white" />;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="text-xl font-black">{t('shopOrders.detailNotFound')}</div>
        <Btn kind="dark" className="mt-4" onClick={() => navigate('/shop/orders')}>
          {t('shopOrders.backToOrders')}
        </Btn>
      </div>
    );
  }

  const productName = localized(order.productName, i18n.language, order.orderNumber);
  const productImage = getProductImage(order);
  const serviceName = typeof order.serviceId === 'string' ? '-' : localized(order.serviceId.name, i18n.language, '-');
  const categoryName = typeof order.categoryId === 'string' ? '-' : localized(order.categoryId.name, i18n.language, '-');
  const deliveredText = order.deliveredItems
    .map((item) => item.code || item.pin || item.serialNumber)
    .filter(Boolean)
    .join('\n');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/shop/orders')}
          className="grid h-9 w-9 place-items-center rounded-[10px] border border-gray-200 bg-white"
        >
          <Icon name="chevronL" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mono text-xs font-semibold text-gray-500">
            {t('shopOrders.order')} · #{order.orderNumber}
          </div>
          <div className="break-words text-2xl font-black leading-tight md:text-[26px]" style={{ letterSpacing: '-0.02em' }}>
            {productName}
          </div>
        </div>
        <ShopOrderStatusBadge status={order.status} />
        <Btn kind="outline" size="sm" icon="download" className="hidden md:inline-flex">{t('shopOrders.pdf')}</Btn>
        <Btn kind="ghost" size="sm" icon="headphones" className="hidden md:inline-flex">{t('shopOrders.getHelp')}</Btn>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[#100E22] p-6 text-white">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <Badge kind="primary">{order.status === 'COMPLETED' ? t('shopOrders.deliveredItems') : t('orders.status')}</Badge>
              <div className="mono text-[11px] text-white/50">{formatDate(order.updatedAt, i18n.language)}</div>
            </div>
            {deliveredText ? (
              <pre className="mono whitespace-pre-wrap break-words text-xl font-bold md:text-[28px]" style={{ letterSpacing: '0.08em' }}>
                {deliveredText}
              </pre>
            ) : (
              <div className="text-sm text-white/65">{order.issueReason ? t(`orders.issueReasons.${order.issueReason}`, { defaultValue: order.issueReason }) : t('shopOrders.noDeliveredItems')}</div>
            )}
            {deliveredText && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Btn kind="primary" size="md" icon="copy">{t('common.copy')}</Btn>
                <Btn kind="outlineLight" size="md" icon="download">{t('shopOrders.downloadReceipt')}</Btn>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 text-base font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {t('shopOrders.statusTimeline')}
            </div>
            <div className="relative">
              <div className="absolute bottom-4 left-[11px] top-4 w-0.5 bg-gray-200" />
              {buildTimeline(order, t, i18n.language).map((step) => (
                <div key={step.key} className="relative flex gap-3.5 py-2">
                  <div
                    className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border-2"
                    style={{
                      background: step.accent ? '#fdf001' : step.done ? '#100E22' : '#fff',
                      borderColor: step.done ? (step.accent ? '#fdf001' : '#100E22') : '#E5E7EB',
                      zIndex: 1,
                    }}
                  >
                    <Icon
                      name={step.icon}
                      size={11}
                      style={{ color: step.accent ? '#100E22' : step.done ? '#fff' : '#6B7280' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${step.accent ? 'font-extrabold' : 'font-semibold'} ${step.done ? 'text-[#111827]' : 'text-gray-500'}`}>
                      {step.title}
                    </div>
                    <div className="mono text-[11px] text-gray-500">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 text-base font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {t('shopOrders.orderDetails')}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [t('orders.product'), productName],
                [t('orders.service'), serviceName],
                [t('orders.category'), categoryName],
                [t('orders.quantity'), String(order.quantity)],
                [t('orders.fulfillmentSource'), t(`orders.sources.${order.fulfillmentSource}`)],
                [t('orders.fulfillmentType'), typeof order.productId === 'string' ? order.fulfillmentSource : order.productId.fulfillmentType],
              ].map(([label, value]) => (
                <DetailPair key={label} label={label} value={value} />
              ))}
            </div>

            {order.requirementSnapshots.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-extrabold">{t('orders.requirements')}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {order.requirementSnapshots.map((requirement) => (
                    <DetailPair
                      key={requirement.paramsName}
                      label={localized(requirement.message, i18n.language, requirement.paramsName)}
                      value={requirement.value}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 text-base font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {t('shopOrders.receipt')}
            </div>
            <div className="flex flex-col gap-2">
              <ReceiptRow label={t('orders.unitPrice')} value={formatMoney(order.unitPrice)} />
              <ReceiptRow label={t('orders.quantity')} value={String(order.quantity)} />
              <ReceiptRow label={t('orders.discountAmount')} value={formatMoney(order.discountAmount)} positive />
              <div className="mt-1 flex justify-between border-t border-gray-200 pt-2.5">
                <span className="text-sm font-bold">{t('shopOrders.totalPaid')}</span>
                <span className="text-[22px] font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                  {formatMoney(order.totalPrice)}
                </span>
              </div>
            </div>
            <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[10px] bg-[#F8FAFC] p-3 text-xs text-gray-500">
              <span>{t('shopOrders.paidFromWallet')}</span>
              <span className="mono font-bold text-[#100E22]">{formatMoney(order.balanceBefore)} → {formatMoney(order.balanceAfter)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-3 text-base font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {t('orders.product')}
            </div>
            <div className="flex items-center gap-3">
              {productImage ? (
                <img src={productImage} alt="" className="h-16 w-24 rounded-xl object-cover" />
              ) : (
                <div className="w-24">
                  <ProductTile name={productName} sub={serviceName} denom={String(order.quantity)} size="sm" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="break-words text-[13px] font-bold leading-snug">{productName}</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Dot color={order.status === 'COMPLETED' ? '#16A34A' : '#F59E0B'} pulse /> {t(`orders.statuses.${order.status}`)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-2.5 text-sm font-extrabold">{t('shopOrders.needSomething')}</div>
            <Btn kind="outline" size="md" full icon="package" className="mb-2">
              {t('shopOrders.reportProblem')}
            </Btn>
            <Btn kind="ghost" size="md" full icon="refresh" onClick={() => navigate(`/shop/product/${typeof order.productId === 'string' ? order.productId : order.productId._id}`)}>
              {t('shopOrders.buyAgain')}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopOrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const kind = status === 'COMPLETED'
    ? 'success'
    : status === 'PROCESSING'
      ? 'info'
      : status === 'PENDING_MANUAL'
        ? 'warning'
        : 'danger';

  return (
    <Badge kind={kind} dot>
      {t(`orders.statuses.${status}`)}
    </Badge>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-200 py-2">
      <div className="text-[13px] text-gray-500">{label}</div>
      <div className="text-right text-[13px] font-bold">{value || '-'}</div>
    </div>
  );
}

function ReceiptRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className={`flex justify-between text-[13px] ${positive ? 'text-green-600' : 'text-[#111827]'}`}>
      <span>{label}</span>
      <span className="font-semibold">{positive ? `-${value}` : value}</span>
    </div>
  );
}

type TimelineIcon = 'plus' | 'wallet' | 'package' | 'check' | 'clock';

const buildTimeline = (order: AdminOrder, t: (key: string, options?: Record<string, unknown>) => string, language: string): Array<{
  key: string;
  title: string;
  detail: string;
  icon: TimelineIcon;
  done: boolean;
  accent?: boolean;
}> => [
  {
    key: 'created',
    title: t('shopOrders.timeline.created'),
    detail: formatDate(order.createdAt, language),
    icon: 'plus',
    done: true,
  },
  {
    key: 'charged',
    title: t('shopOrders.timeline.charged', { amount: formatMoney(order.totalPrice) }),
    detail: `${formatMoney(order.balanceBefore)} → ${formatMoney(order.balanceAfter)}`,
    icon: 'wallet',
    done: true,
  },
  {
    key: 'fulfillment',
    title: t('shopOrders.timeline.fulfillment', { source: t(`orders.sources.${order.fulfillmentSource}`) }),
    detail: order.providerOrderId || order.fulfillmentSource,
    icon: 'package',
    done: order.status !== 'PENDING_MANUAL',
  },
  {
    key: 'finished',
    title: t(`shopOrders.timeline.${order.status === 'COMPLETED' ? 'completed' : order.status === 'FAILED' ? 'failed' : order.status === 'CANCELLED' ? 'cancelled' : 'waiting'}`),
    detail: order.completedAt || order.cancelledAt ? formatDate(order.completedAt || order.cancelledAt || order.updatedAt, language) : formatDate(order.updatedAt, language),
    icon: order.status === 'COMPLETED' ? 'check' : 'clock',
    done: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(order.status),
    accent: order.status === 'COMPLETED',
  },
];

const getProductImage = (order: AdminOrder) => {
  if (typeof order.productId === 'string') return undefined;
  return order.productId.image?.secureUrl;
};

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value: string, language: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};
