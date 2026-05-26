import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  brandColor,
} from '../components/primitives';
import { useShopOrders } from '../hooks/shop.hooks';
import { localized } from '../utils/shop-format';
import { AdminOrder, OrderFulfillmentSource, OrderStatus } from '@/features/orders/types/order.types';
import { Pagination } from '@/shared/components/ui/Pagination';

const FILTERS: Array<'ALL' | OrderStatus> = ['ALL', 'PENDING_MANUAL', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
const SOURCES: Array<'ALL' | OrderFulfillmentSource> = ['ALL', 'WAREHOUSE', 'API', 'MANUAL'];
const PAGE_LIMIT = 10;
const FILTER_ICONS: Record<'ALL' | OrderStatus, 'list' | 'clock' | 'refresh' | 'check' | 'warning' | 'close'> = {
  ALL: 'list',
  PENDING_MANUAL: 'clock',
  PROCESSING: 'refresh',
  COMPLETED: 'check',
  FAILED: 'warning',
  CANCELLED: 'close',
};

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [source, setSource] = useState<'ALL' | OrderFulfillmentSource>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: ordersResponse, isLoading } = useShopOrders({
    page,
    limit: PAGE_LIMIT,
    status: filter === 'ALL' ? undefined : filter,
    fulfillmentSource: source === 'ALL' ? undefined : source,
    search: search || undefined,
  });
  const orders = ordersResponse?.data || [];
  const total = ordersResponse?.meta?.total || 0;

  const updateFilter = (next: 'ALL' | OrderStatus) => {
    setFilter(next);
    setPage(1);
  };

  const applyFilters = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setFilter('ALL');
    setSource('ALL');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-3xl font-black" style={{ letterSpacing: '-0.03em' }}>
            {t('orders.title')}
          </div>
          <div className="text-[13px] text-gray-500">
            {t('shopOrders.totalDescription', { count: total })}
          </div>
        </div>
        <div className="flex gap-2">
          <Btn kind="outline" size="sm" icon="filter" onClick={() => setShowFilters((current) => !current)}>{t('common.filter')}</Btn>
          <Btn kind="outline" size="sm" icon="download">{t('shopOrders.export')}</Btn>
        </div>
      </div>

      {showFilters && (
        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[1.3fr_1fr_auto_auto] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">{t('common.search')}</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters();
              }}
              placeholder={t('shopOrders.searchPlaceholder')}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">{t('orders.fulfillmentSource')}</span>
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value as 'ALL' | OrderFulfillmentSource);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#100E22]"
            >
              {SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? t('orders.allSources') : t(`orders.sources.${item}`)}
                </option>
              ))}
            </select>
          </label>
          <Btn size="md" icon="filter" onClick={applyFilters}>{t('common.filter')}</Btn>
          <Btn kind="outline" size="md" onClick={resetFilters}>{t('shopOrders.resetFilter')}</Btn>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-2 md:hidden">
        <div className="grid grid-cols-6 gap-1.5">
          {FILTERS.map((status) => {
            const active = filter === status;
            const label = status === 'ALL' ? t('common.all') : t(`orders.statuses.${status}`);
            return (
              <button
                key={status}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => updateFilter(status)}
                className={clsx(
                  'grid h-10 place-items-center rounded-xl transition',
                  active ? 'bg-[#100E22] text-primary shadow-sm' : 'bg-[#F8FAFC] text-gray-500 hover:bg-gray-100',
                )}
              >
                <Icon name={FILTER_ICONS[status]} size={18} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-center text-xs font-black text-[#100E22]">
          {filter === 'ALL' ? t('common.all') : t(`orders.statuses.${filter}`)}
        </div>
      </div>

      <div className="hide-scrollbar hidden w-fit gap-1.5 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 md:flex">
        {FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => updateFilter(status)}
            className={clsx(
              'rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap',
              filter === status ? 'bg-[#100E22] text-white' : 'text-[#111827] hover:bg-gray-100',
            )}
          >
            {status === 'ALL' ? t('common.all') : t(`orders.statuses.${status}`)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="divide-y divide-gray-200 md:hidden">
          {isLoading && Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[148px] bg-white" />
          ))}

          {!isLoading && orders.map((order) => {
            const productName = localized(order.productName, i18n.language, order.orderNumber);
            const imageUrl = getProductImage(order);
            return (
              <Link key={order._id} to={`/shop/orders/${order._id}`} className="block p-4 transition hover:bg-[#F8FAFC]">
                <div className="mb-3 flex items-start gap-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                      style={{ background: brandColor(productName)[0] }}
                    >
                      {getInitials(productName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mono text-[11px] font-bold text-gray-500">#{order.orderNumber}</div>
                    <div className="mt-1 break-words text-base font-black leading-snug text-[#100E22]">{productName}</div>
                  </div>
                  <Icon name="chevronR" size={16} className="mt-1 flex-shrink-0 text-gray-400" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge kind="soft">{t(`shopOrders.types.${getOrderType(order)}`)}</Badge>
                  <ShopOrderStatusBadge status={order.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-bold text-gray-500">{t('orders.totalPrice')}</div>
                    <div className="mt-0.5 font-black text-[#100E22]">{formatMoney(order.totalPrice)}</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-500">{t('problemReports.createdAt')}</div>
                    <div className="mt-0.5 font-semibold text-[#100E22]">{formatDate(order.createdAt, i18n.language)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-gray-500" style={{ letterSpacing: 0.4 }}>
              <tr>
                <th className="px-6 py-3.5 text-left">{t('orders.orderNumber')}</th>
                <th className="px-6 py-3.5 text-left">{t('orders.product')}</th>
                <th className="px-6 py-3.5 text-left">{t('orders.fulfillmentType')}</th>
                <th className="px-6 py-3.5 text-left">{t('orders.totalPrice')}</th>
                <th className="px-6 py-3.5 text-left">{t('orders.status')}</th>
                <th className="px-6 py-3.5 text-left" />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td colSpan={6} className="h-[66px] bg-white" />
                </tr>
              ))}

              {!isLoading && orders.map((order) => {
                const productName = localized(order.productName, i18n.language, order.orderNumber);
                const imageUrl = getProductImage(order);
                return (
                  <tr key={order._id} className="border-t border-gray-200 hover:bg-[#F8FAFC]">
                    <td className="px-6 py-3.5">
                      <div className="mono text-xs font-semibold">#{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Link to={`/shop/orders/${order._id}`} className="flex items-center gap-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div
                            className="grid h-9 w-9 place-items-center rounded-lg text-[13px] font-extrabold text-white"
                            style={{ background: brandColor(productName)[0] }}
                          >
                            {getInitials(productName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="max-w-[320px] break-words text-sm font-bold leading-snug">{productName}</div>
                          <div className="mono text-[11px] text-gray-500">{formatDate(order.createdAt, i18n.language)}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge kind="soft">{t(`shopOrders.types.${getOrderType(order)}`)}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-extrabold">{formatMoney(order.totalPrice)}</td>
                    <td className="px-6 py-3.5"><ShopOrderStatusBadge status={order.status} /></td>
                    <td className="px-6 py-3.5">
                      <Link to={`/shop/orders/${order._id}`} className="inline-flex">
                        <Icon name="chevronR" size={16} className="text-gray-500" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && orders.length === 0 && (
          <div className="px-6 py-16 text-center text-gray-500">
            <div className="mb-2 text-2xl">{t('shopOrders.empty')}</div>
            <Btn kind="outline" size="sm" onClick={resetFilters}>
              {t('shopOrders.resetFilter')}
            </Btn>
          </div>
        )}
      </div>

      <Pagination
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        onChange={setPage}
      />
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

const getProductImage = (order: AdminOrder) => {
  if (typeof order.productId === 'string') return undefined;
  return order.productId.image?.secureUrl;
};

const getOrderType = (order: AdminOrder) => {
  if (typeof order.serviceId !== 'string') {
    if (order.serviceId.type === 'SOCIAL_REINFORCERS') return 'social';
    if (order.serviceId.type === 'ESIM_NUMBER' || order.serviceId.type === 'PHONE_NUMBER_GENERATOR') return 'number';
  }
  return 'giftcard';
};

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value: string, language: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const getInitials = (value: string) => value.split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();
