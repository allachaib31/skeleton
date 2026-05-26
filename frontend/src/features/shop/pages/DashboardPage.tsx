import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Btn,
  Dot,
  OrderStatusBadge,
  ProductTile,
  SectionHead,
  ServiceTile,
  brandColor,
} from '../components/primitives';
import { useShopOrders, useShopProducts, useShopServices } from '../hooks/shop.hooks';
import { localized, productQuantityLabel, serviceColor, serviceGlyph, serviceFromProduct, serviceShopPath } from '../utils/shop-format';
import { useProfile } from '@/features/users/hooks/useProfile';
import { useMyLevels } from '@/features/users/hooks/useMySessions';
import { AdminOrder, OrderStatus } from '@/features/orders/types/order.types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: profileResponse } = useProfile();
  const { data: levelsResponse } = useMyLevels();
  const { data: ordersResponse, isLoading: ordersLoading } = useShopOrders({ page: 1, limit: 5 });
  const { data: servicesResponse, isLoading: servicesLoading } = useShopServices({ page: 1, limit: 14 });
  const { data: productsResponse, isLoading: productsLoading } = useShopProducts({ page: 1, limit: 10 });
  const user = profileResponse?.data;
  const services = servicesResponse?.data || [];
  const products = productsResponse?.data || [];
  const orders = ordersResponse?.data || [];
  const levels = levelsResponse?.data.levels || [];
  const displayName = user?.firstName || user?.username || user?.name || t('shopDashboard.clientFallback');
  const topLevel = levels
    .filter((level) => level.groupId)
    .sort((left, right) => (right.points || 0) - (left.points || 0))[0];
  const totalProducts = productsResponse?.meta?.total || products.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Hello + wallet card */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-[#100E22] p-7 text-white">
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -right-5 -top-5 h-[280px] w-[280px] opacity-[0.08]"
          >
            <circle cx="100" cy="100" r="80" stroke="#fdf001" strokeWidth="20" fill="none" />
          </svg>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-white/60">{t('shopDashboard.hello', { name: displayName })}</div>
              <div className="mt-1 text-2xl font-extrabold md:text-[28px]" style={{ letterSpacing: '-0.02em' }}>
                {t('shopDashboard.ready')}
              </div>
            </div>
            <Badge kind="primary">{topLevel?.groupId?.name || user?.role?.name || t('shopDashboard.levelFallback')}</Badge>
          </div>
          <div className="relative mt-7 grid grid-cols-3 gap-4">
            <Stat label={t('shopDashboard.walletBalance')} value={formatMoney(user?.balance || 0)} />
            <Stat label={t('shopDashboard.openCredit')} value={formatMoney(user?.openCredit || 0)} valueColor="#F59E0B" />
            <Stat label={t('shopDashboard.totalExpenses')} value={formatMoney(user?.totalExpenses || 0)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Btn kind="primary" icon="plus" onClick={() => navigate('/shop/wallet')}>
              {t('payments.addBalance')}
            </Btn>
            <Btn kind="outlineLight" icon="qr" onClick={() => navigate('/shop/wallet')}>
              {t('payments.redeemPaymentCode')}
            </Btn>
            <Btn kind="ghostLight" icon="upload" onClick={() => navigate('/shop/wallet')}>{t('shopDashboard.uploadProof')}</Btn>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <Badge kind="info" dot className="!normal-case">{t('shopDashboard.account')}</Badge>
            <div className="mono text-[11px] text-gray-500">{user?.status || '-'}</div>
          </div>
          <div className="mt-3.5 text-2xl font-extrabold leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {t('shopDashboard.referralTitle')}<br />{user?.invitationCode || t('shopDashboard.noInvitationCode')}
          </div>
          <div className="mt-1.5 flex-1 text-[13px] text-gray-500">
            {t('shopDashboard.referralDescription', { amount: formatMoney(user?.totalReferralWin || 0) })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="mono text-[11px] text-gray-500">{user?.email || '-'}</div>
            <Btn size="sm" iconRight="arrowR" onClick={() => navigate('/shop/profile')}>{t('profile.title')}</Btn>
          </div>
        </div>
      </div>

      {/* Service grid */}
      <div>
        <SectionHead title={t('shopDashboard.browseByService')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {servicesLoading && Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-[132px] rounded-2xl border border-gray-200 bg-white" />
          ))}
          {!servicesLoading && services.map((s, index) => {
            const name = localized(s.name, i18n.language, t('shopDashboard.serviceFallback'));
            return (
            <Link
              key={s._id}
              to={serviceShopPath(s)}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <ServiceTile name={name} glyph={serviceGlyph(s, i18n.language)} color={serviceColor(index)} size={42} />
              <div>
                <div className="text-sm font-bold">{name}</div>
                <div className="mono text-[11px] text-gray-500">{t('shopDashboard.productCount', { count: s.productCount })}</div>
              </div>
            </Link>
          );
          })}
        </div>
      </div>

      {/* Popular shelf */}
      <div>
        <SectionHead
          title={t('shopDashboard.popularProducts')}
          sub={t('shopDashboard.stockDatabase')}
          cta={t('shopDashboard.seeAll')}
          onCta={() => navigate('/shop/giftcards')}
        />
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
          {productsLoading && Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[210px] rounded-2xl border border-gray-200 bg-white" />
          ))}
          {!productsLoading && products.slice(0, 5).map((p) => {
            const name = localized(p.name, i18n.language, t('shopProduct.productFallback'));
            const service = serviceFromProduct(p);
            const sub = service ? localized(service.name, i18n.language) : p.quantityMode;
            return (
            <Link
              key={p._id}
              to={`/shop/product/${p._id}`}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              {p.image?.secureUrl ? (
                <img src={p.image.secureUrl} alt="" className="h-28 w-full object-cover" />
              ) : (
                <div className="p-2">
                  <ProductTile name={name} sub={sub} denom={productQuantityLabel(p)} size="sm" />
                </div>
              )}
              <div className="px-3 pb-3 pt-1">
                <div className="text-[13px] font-bold" style={{ letterSpacing: '-0.01em' }}>
                  {name}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="mono text-[11px] text-gray-500">{p.quantityMode}</div>
                  <div className="text-sm font-extrabold">{productQuantityLabel(p)}</div>
                </div>
              </div>
            </Link>
          );
          })}
        </div>
      </div>

      {/* Recent orders + levels */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
                <div className="text-lg font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                {t('shopDashboard.recentOrders')}
              </div>
              <div className="text-xs text-gray-500">{t('shopDashboard.recentOrdersDescription')}</div>
            </div>
            <Btn kind="ghost" size="sm" iconRight="arrowR" onClick={() => navigate('/shop/orders')}>
              {t('shopDashboard.allOrders')}
            </Btn>
          </div>
          <div className="flex flex-col">
            {ordersLoading && Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[58px] border-t border-gray-200" />
            ))}
            {!ordersLoading && orders.map((o) => (
              <div
                key={o._id}
                className="grid grid-cols-[40px_1fr_80px_110px_70px] items-center gap-3.5 border-t border-gray-200 py-2.5"
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg text-[13px] font-extrabold text-white"
                  style={{ background: brandColor(getOrderProductName(o, i18n.language))[0] }}
                >
                  {getInitials(getOrderProductName(o, i18n.language))}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{getOrderProductName(o, i18n.language)}</div>
                  <div className="mono text-[11px] text-gray-500">#{o.orderNumber} · {formatDate(o.createdAt, i18n.language)}</div>
                </div>
                <div className="text-sm font-bold">{formatMoney(o.totalPrice)}</div>
                <OrderStatusBadge status={toShopOrderStatus(o.status)} />
                <Btn kind="outline" size="sm" onClick={() => navigate(`/shop/orders/${o._id}`)}>{t('common.view')}</Btn>
              </div>
            ))}
            {!ordersLoading && !orders.length && (
              <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                {t('shopDashboard.noOrders')}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6">
          <div>
            <div className="text-lg font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {t('shopDashboard.serviceLevels')}
            </div>
            <div className="text-xs text-gray-500">{t('shopDashboard.serviceLevelsDescription')}</div>
          </div>
          {levels.slice(0, 4).map((level) => {
            const nextGroup = level.availableGroups
              .filter((group) => group.entitlementValue > level.points)
              .sort((left, right) => left.entitlementValue - right.entitlementValue)[0];
            const nextPoints = nextGroup?.entitlementValue || Math.max(level.points, level.groupId?.entitlementValue || 1);
            const percent = nextPoints > 0 ? Math.min(100, (level.points / nextPoints) * 100) : 100;
            return (
            <div key={level._id}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <div className="font-bold">{localized(level.serviceId.name, i18n.language, t('shopDashboard.serviceFallback'))}</div>
                <div className="mono text-gray-500">{level.groupId?.name || t('shopDashboard.noLevel')}</div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-[#F8FAFC]">
                <div
                  className="h-full rounded-sm bg-[#100E22]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mono mt-1 text-[10px] text-gray-500">
                {nextGroup
                  ? t('shopDashboard.pointsToNext', { points: level.points, next: nextPoints })
                  : t('shopDashboard.highestLevel', { points: level.points })}
              </div>
            </div>
            );
          })}
          {!levels.length && <div className="text-sm text-gray-500">{t('shopDashboard.noLevels')}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Dot color="#16A34A" pulse />
        {t('shopDashboard.liveSummary', { services: services.length, products: totalProducts })}
      </div>
    </div>
  );
}

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value: string, language: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const getInitials = (value: string) => value.split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

const toShopOrderStatus = (status: OrderStatus) => {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'PROCESSING') return 'processing';
  if (status === 'FAILED') return 'failed';
  if (status === 'CANCELLED') return 'cancelled';
  return 'pending';
};

const getOrderProductName = (order: AdminOrder, language: string) => localized(order.productName, language, order.orderNumber);

function Stat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold uppercase text-white/50"
        style={{ letterSpacing: 0.4 }}
      >
        {label}
      </div>
      <div
        className="mt-0.5 text-2xl font-extrabold md:text-[32px]"
        style={{ letterSpacing: '-0.03em', color: valueColor }}
      >
        {value}
        {sub && <span className="text-lg text-white/50">{sub}</span>}
      </div>
    </div>
  );
}
