import { ReactNode, UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Icon } from '../components/Icon';
import { Badge, Btn, Field, Input } from '../components/primitives';
import { useShopCategories, useShopProducts, useShopServices } from '../hooks/shop.hooks';
import { ShopProductItem } from '../types/shop.types';
import { categoryName, localized, productQuantityLabel } from '../utils/shop-format';

type PlatformId = 'all' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'snapchat' | 'telegram' | 'x' | 'website';

interface PlatformConfig {
  id: PlatformId;
  nameKey: string;
  color: string;
  iconColor?: string;
  icon: ReactNode;
  terms: readonly string[];
}

const PLATFORM_ICONS: Record<PlatformId, ReactNode> = {
  all: <path d="M12 2 14.2 9.8 22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />,
  instagram: <>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
  </>,
  tiktok: <path d="M16.6 5.82a4.28 4.28 0 0 1-2.65-1.6 4.27 4.27 0 0 1-.85-2.22h-3v13.36a2.55 2.55 0 0 1-2.55 2.55 2.55 2.55 0 0 1-2.55-2.55 2.55 2.55 0 0 1 2.55-2.55c.27 0 .53.04.77.12V9.9a5.55 5.55 0 0 0-.77-.06 5.6 5.6 0 0 0-5.6 5.6 5.6 5.6 0 0 0 5.6 5.6 5.6 5.6 0 0 0 5.6-5.6V9.46a7.27 7.27 0 0 0 4.23 1.35V7.84a4.28 4.28 0 0 1-.78-.07Z" />,
  youtube: <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42a2.5 2.5 0 0 0-1.76 1.77A26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z" />,
  snapchat: <path d="M12 2.2c2.74 0 4.54 1.7 4.54 4.66 0 1.5-.06 2.42-.18 3.04.2.12.5.22.84.22.4 0 .8-.12 1.08-.26.18-.08.36-.14.5-.14.42 0 .78.3.78.66 0 .42-.5.66-1.1.86-.32.1-.64.2-.86.32-.16.08-.16.22.04.62.5.96 1.34 1.92 2.46 2.3.36.12.5.36.5.6 0 .56-1.04.96-2.32 1.14-.06.12-.14.5-.22.8-.06.22-.18.34-.4.34-.2 0-.42-.06-.7-.12a4.6 4.6 0 0 0-.96-.14c-.38 0-.7.08-1.02.22-.78.34-1.66 1.6-3.0 1.6-1.34 0-2.18-1.26-3-1.6-.32-.14-.66-.22-1.02-.22-.36 0-.7.08-.96.14-.28.06-.5.12-.7.12-.22 0-.34-.12-.4-.34-.08-.3-.16-.68-.22-.8-1.28-.18-2.32-.58-2.32-1.14 0-.24.14-.48.5-.6 1.12-.38 1.96-1.34 2.46-2.3.2-.4.2-.54.04-.62-.22-.12-.54-.22-.86-.32-.6-.2-1.1-.44-1.1-.86 0-.36.36-.66.78-.66.14 0 .32.06.5.14.28.14.68.26 1.08.26.34 0 .64-.1.84-.22-.12-.62-.18-1.54-.18-3.04C7.46 3.9 9.26 2.2 12 2.2Z" />,
  telegram: <path d="m21.5 4.3-3.18 15c-.24 1.05-.86 1.31-1.74.82l-4.81-3.54-2.32 2.23c-.26.26-.47.47-.97.47l.35-4.93 8.97-8.1c.39-.35-.08-.54-.6-.19l-11.08 6.97-4.78-1.49c-1.04-.32-1.06-1.04.22-1.54l18.7-7.21c.87-.32 1.62.19 1.34 1.51Z" />,
  x: <path d="M17.5 3h3.4l-7.43 8.49L22 21h-6.81l-5.33-6.97L3.76 21H.36l7.94-9.07L0 3h6.98l4.82 6.37L17.5 3Zm-1.2 16h1.88L6.79 4.9H4.78L16.3 19Z" />,
  website: <>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </>,
};

const SOCIAL_PLATFORMS: readonly PlatformConfig[] = [
  { id: 'all', nameKey: 'shopSmm.platforms.all', color: '#100E22', icon: PLATFORM_ICONS.all, terms: [] },
  { id: 'facebook', nameKey: 'shopSmm.platforms.facebook', color: '#1877F2', icon: PLATFORM_ICONS.facebook, terms: ['facebook', 'fb'] },
  { id: 'instagram', nameKey: 'shopSmm.platforms.instagram', color: '#E1306C', icon: PLATFORM_ICONS.instagram, terms: ['instagram', 'insta', 'ig'] },
  { id: 'tiktok', nameKey: 'shopSmm.platforms.tiktok', color: '#111827', icon: PLATFORM_ICONS.tiktok, terms: ['tiktok', 'tik tok'] },
  { id: 'youtube', nameKey: 'shopSmm.platforms.youtube', color: '#FF0000', icon: PLATFORM_ICONS.youtube, terms: ['youtube', 'yt'] },
  { id: 'snapchat', nameKey: 'shopSmm.platforms.snapchat', color: '#FFFC00', iconColor: '#111827', icon: PLATFORM_ICONS.snapchat, terms: ['snapchat', 'snap'] },
  { id: 'telegram', nameKey: 'shopSmm.platforms.telegram', color: '#229ED9', icon: PLATFORM_ICONS.telegram, terms: ['telegram'] },
  { id: 'x', nameKey: 'shopSmm.platforms.x', color: '#111827', icon: PLATFORM_ICONS.x, terms: ['twitter', ' x ', 'x.com'] },
  { id: 'website', nameKey: 'shopSmm.platforms.website', color: '#16A34A', icon: PLATFORM_ICONS.website, terms: ['traffic', 'website', 'web traffic'] },
];

function PlatformGlyph({ platform, size = 28 }: { platform: PlatformConfig; size?: number }) {
  return (
    <div
      className="grid flex-shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: platform.color,
        color: platform.iconColor || '#FFFFFF',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {platform.icon}
      </svg>
    </div>
  );
}

export default function SmmPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const [platform, setPlatform] = useState<PlatformId>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [loadedProducts, setLoadedProducts] = useState<ShopProductItem[]>([]);
  const orderPanelRef = useRef<HTMLDivElement>(null);

  const handleSelectFromCard = (id: string) => {
    setSelectedProductId(id);
    requestAnimationFrame(() => {
      orderPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const { data: servicesResponse } = useShopServices({ page: 1, limit: 100 });
  const { data: categoriesResponse } = useShopCategories({ serviceId }, { enabled: Boolean(serviceId) });
  const { data: productsResponse, isLoading, isFetching } = useShopProducts({ page: productPage, limit: 100, serviceId });

  useEffect(() => {
    setProductPage(1);
    setLoadedProducts([]);
    setSelectedProductId(null);
    setCategoryId('all');
    setCategoryQuery('');
    setProductSearch('');
  }, [serviceId]);

  useEffect(() => {
    const nextProducts = productsResponse?.data || [];
    if (!nextProducts.length) return;

    setLoadedProducts((current) => {
      if (productPage === 1) return nextProducts;
      const byId = new Map(current.map((product) => [product._id, product]));
      nextProducts.forEach((product) => byId.set(product._id, product));
      return Array.from(byId.values());
    });
  }, [productPage, productsResponse]);

  const products = loadedProducts;
  const initialLoading = isLoading && productPage === 1 && loadedProducts.length === 0;
  const selectedService = servicesResponse?.data.find((service) => service._id === serviceId);
  const categories = useMemo(() => {
    const source = categoriesResponse?.data || [];
    return source
      .map((category) => ({
        _id: category._id,
        name: localized(category.name, i18n.language, category._id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesResponse, i18n.language]);

  const filteredProducts = useMemo(() => {
    const platformConfig = SOCIAL_PLATFORMS.find((item) => item.id === platform);
    const search = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const productCategoryId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id;
      if (categoryId !== 'all' && productCategoryId !== categoryId) return false;

      const haystack = [
        localized(product.name, i18n.language, ''),
        categoryName(product, i18n.language),
        typeof product.serviceId === 'string' ? '' : localized(product.serviceId.name, i18n.language, ''),
      ].join(' ').toLowerCase();

      if (search && !haystack.includes(search)) return false;
      if (!platformConfig || platformConfig.id === 'all') return true;
      return platformConfig.terms.some((term) => haystack.includes(term));
    });
  }, [categoryId, i18n.language, platform, productSearch, products]);
  const selectedProduct = filteredProducts.find((product) => product._id === selectedProductId)
    || filteredProducts[0]
    || null;

  const title = selectedService
    ? localized(selectedService.name, i18n.language, t('shopSmm.title'))
    : t('shopSmm.title');
  const description = selectedService
    ? localized(selectedService.description, i18n.language, t('shopSmm.description'))
    : t('shopSmm.description');

  const handleProductsScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom && productsResponse?.meta?.hasNext && !isFetching) {
      setProductPage((current) => current + 1);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge kind="primary" className="mb-3">
              {t('shopSmm.productCount', { count: productsResponse?.meta?.total || 0 })}
            </Badge>
            <div className="text-3xl font-black md:text-4xl" style={{ lineHeight: 1 }}>
              {title}
            </div>
            <div className="mt-2 max-w-[540px] text-sm text-white/65">
              {description}
            </div>
          </div>
          <div className="min-w-[260px] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="mono mb-1 text-[11px] text-white/50">
              {t('shopSmm.statsTitle')}
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-extrabold">{categories.length}</div>
                <div className="text-[11px] text-white/55">{t('shopSmm.categories')}</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">{filteredProducts.length}</div>
                <div className="text-[11px] text-white/55">{t('shopSmm.visibleProducts')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {SOCIAL_PLATFORMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPlatform(item.id)}
            className={clsx(
              'flex flex-shrink-0 items-center gap-2.5 rounded-xl border-[1.5px] py-2 pr-3.5 pl-2 text-sm font-bold whitespace-nowrap',
              platform === item.id ? 'border-[#100E22] bg-white' : 'border-gray-200 bg-[#F8FAFC]',
            )}
          >
            <PlatformGlyph platform={item} size={28} />
            {t(item.nameKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:flex-row md:items-center">
        <div>
          <div className="text-sm font-extrabold">{t('shopSmm.filters')}</div>
          <div className="text-xs text-gray-500">{t('shopSmm.filtersDescription')}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-[640px] md:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              list="smm-category-options"
              value={categoryQuery}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryQuery(value);
                if (!value.trim()) {
                  setCategoryId('all');
                  return;
                }
                const match = categories.find((category) => category.name === value);
                setCategoryId(match ? match._id : 'all');
              }}
              placeholder={t('shopSmm.allCategories')}
              className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#100E22]"
            />
            <datalist id="smm-category-options">
              {categories.map((category) => (
                <option key={category._id} value={category.name} />
              ))}
            </datalist>
          </div>
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder={t('shopSmm.searchPlaceholder')}
              className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm font-bold outline-none focus:border-[#100E22]"
            />
          </div>
          <Btn
            kind="outline"
            icon="filter"
            onClick={() => {
              setPlatform('all');
              setCategoryId('all');
              setCategoryQuery('');
              setProductSearch('');
            }}
          >
            {t('shopSmm.resetFilters')}
          </Btn>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleProductsScroll}>
            <table className="hidden w-full table-fixed border-collapse text-left lg:table">
              <colgroup>
                <col />
                <col className="w-[64px]" />
                <col className="w-[84px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">{t('shopSmm.service')}</th>
                  <th className="px-2 py-3.5">{t('shopSmm.min')}</th>
                  <th className="px-2 py-3.5">{t('shopSmm.max')}</th>
                  <th className="px-2 py-3.5">{t('shopSmm.ratePerThousand')}</th>
                  <th className="px-2 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {initialLoading && Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="h-[54px] border-t border-gray-200 bg-white">
                    <td colSpan={5} />
                  </tr>
                ))}

                {!initialLoading && filteredProducts.map((product) => (
                  <SmmProductRow
                    key={product._id}
                    product={product}
                    selected={selectedProduct?._id === product._id}
                    onSelect={() => setSelectedProductId(product._id)}
                  />
                ))}

                {!initialLoading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-semibold text-gray-500">
                      {t('shopSmm.empty')}
                    </td>
                  </tr>
                )}

                {isFetching && productPage > 1 && (
                  <tr>
                    <td colSpan={5} className="border-t border-gray-200 p-4 text-center text-sm font-semibold text-gray-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex flex-col gap-3 p-3 lg:hidden">
              {initialLoading && Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-[112px] rounded-2xl border border-gray-200 bg-[#F8FAFC]" />
              ))}

              {!initialLoading && filteredProducts.map((product) => (
                <SmmProductCard
                  key={product._id}
                  product={product}
                  selected={selectedProduct?._id === product._id}
                  onSelect={() => handleSelectFromCard(product._id)}
                />
              ))}

              {!initialLoading && filteredProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-500">
                  {t('shopSmm.empty')}
                </div>
              )}

              {isFetching && productPage > 1 && (
                <div className="rounded-xl bg-[#F8FAFC] p-3 text-center text-sm font-semibold text-gray-500">
                  {t('common.loading')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={orderPanelRef}
          className="h-fit scroll-mt-4 rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-4"
        >
          {selectedProduct ? (
            <SmmOrderPanel product={selectedProduct} />
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#F8FAFC] text-gray-500">
                <Icon name="list" size={24} />
              </div>
              <div className="mb-1 text-base font-bold">{t('shopSmm.pickProduct')}</div>
              <div className="text-[13px] text-gray-500">{t('shopSmm.pickProductDescription')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmmProductRow({
  product,
  selected,
  onSelect,
}: {
  product: ShopProductItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, i18n } = useTranslation();
  const name = localized(product.name, i18n.language, t('shopSmm.product'));
  const min = product.minQuantity || 1;
  const max = product.maxQuantity || product.customQuantities?.length || 1;

  return (
    <tr
      onClick={onSelect}
      className={clsx(
        'cursor-pointer border-t border-gray-200 transition',
        selected ? 'bg-[#FEFBE0]' : 'bg-white hover:bg-[#F8FAFC]',
      )}
    >
      <td className="min-w-0 px-5 py-2 align-middle">
        <div className="text-[13px] font-bold leading-tight break-words [overflow-wrap:anywhere]">{name}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {product.refill && <Badge kind="success">{t('shopSmm.refill')}</Badge>}
          {product.cancel && <Badge kind="info">{t('shopSmm.cancel')}</Badge>}
          {product.dripfeed && <Badge kind="warning">{t('shopSmm.dripfeed')}</Badge>}
          <Badge kind={product.quantityAvailable && product.stock ? 'success' : 'danger'} dot className="!py-[1px] !text-[10px] !normal-case">
            {product.quantityAvailable && product.stock ? t('shopSmm.available') : t('shopSmm.unavailable')}
          </Badge>
          <Badge kind="outline" className="!py-[1px] !text-[10px] !normal-case">
            {product.quantityMode}
          </Badge>
        </div>
      </td>
      <td className="mono px-2 py-2 text-[13px] align-middle">{min}</td>
      <td className="mono px-2 py-2 text-[13px] align-middle">{max.toLocaleString()}</td>
      <td className="px-2 py-2 text-[15px] font-extrabold align-middle">-</td>
      <td className="px-2 py-2 align-middle">
        <Btn size="sm" kind={selected ? 'primary' : 'outline'} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
          {t('shopSmm.order')}
        </Btn>
      </td>
    </tr>
  );
}

function SmmProductCard({
  product,
  selected,
  onSelect,
}: {
  product: ShopProductItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, i18n } = useTranslation();
  const name = localized(product.name, i18n.language, t('shopSmm.product'));
  const min = product.minQuantity || 1;
  const max = product.maxQuantity || product.customQuantities?.length || 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex w-full flex-col gap-3 rounded-2xl border p-3.5 text-left transition',
        selected
          ? 'border-[#100E22] bg-[#FEFBE0]'
          : 'border-gray-200 bg-white hover:bg-[#F8FAFC]',
      )}
    >
      <div className="text-[13px] font-bold leading-tight break-words [overflow-wrap:anywhere]">
        {name}
      </div>

      <div className="flex flex-wrap gap-1">
        {product.refill && <Badge kind="success">{t('shopSmm.refill')}</Badge>}
        {product.cancel && <Badge kind="info">{t('shopSmm.cancel')}</Badge>}
        {product.dripfeed && <Badge kind="warning">{t('shopSmm.dripfeed')}</Badge>}
        <Badge
          kind={product.quantityAvailable && product.stock ? 'success' : 'danger'}
          dot
          className="!py-[1px] !text-[10px] !normal-case"
        >
          {product.quantityAvailable && product.stock
            ? t('shopSmm.available')
            : t('shopSmm.unavailable')}
        </Badge>
        <Badge kind="outline" className="!py-[1px] !text-[10px] !normal-case">
          {product.quantityMode}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F8FAFC] p-2.5 text-center text-[11px] font-semibold text-gray-500">
        <div>
          <div className="text-[10px] uppercase">{t('shopSmm.min')}</div>
          <div className="mono mt-0.5 text-[13px] font-bold text-[#111827]">{min}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase">{t('shopSmm.max')}</div>
          <div className="mono mt-0.5 text-[13px] font-bold text-[#111827]">{max.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase">{t('shopSmm.ratePerThousand')}</div>
          <div className="mt-0.5 text-[13px] font-extrabold text-[#111827]">-</div>
        </div>
      </div>

      <Btn
        size="sm"
        full
        kind={selected ? 'primary' : 'outline'}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        {t('shopSmm.order')}
      </Btn>
    </button>
  );
}

function SmmOrderPanel({ product }: { product: ShopProductItem }) {
  const { t, i18n } = useTranslation();
  const name = localized(product.name, i18n.language, t('shopSmm.product'));
  const category = categoryName(product, i18n.language) || '-';
  const minQuantity = product.minQuantity || 1;
  const maxQuantity = product.maxQuantity || minQuantity;
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState(minQuantity);
  const [notes, setNotes] = useState('');

  return (
    <div className="tc-slideup flex flex-col gap-3.5">
      <div>
        <div className="mb-1 flex justify-between gap-2">
          <Badge className='text-[0.6rem] px-[0.3rem]' kind="dark">{category}</Badge>
          <div className="flex gap-1">
            {product.refill && <Badge kind="success">{t('shopSmm.refill')}</Badge>}
            {product.cancel && <Badge kind="info">{t('shopSmm.cancel')}</Badge>}
          </div>
        </div>
        <div className="mt-2 text-sm font-extrabold leading-snug">{name}</div>
      </div>

      <Field label={t('shopSmm.link')} hint={t('shopSmm.linkHint')}>
        <Input icon="globe" value={link} onChange={(event) => setLink(event.target.value)} />
      </Field>

      {product.quantityMode !== 'WITHOUT_QUANTITY' && (
        <Field label={t('shopSmm.quantity')} hint={t('shopSmm.quantityHint', { min: minQuantity, max: maxQuantity })}>
          <Input
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            suffix={<div className="mono px-2 text-[11px] text-gray-500">{t('shopSmm.units')}</div>}
          />
        </Field>
      )}

      <Field label={t('shopSmm.notes')}>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-[92px] w-full rounded-[10px] border border-gray-200 p-3 text-sm outline-none focus:border-[#100E22]"
          style={{ fontFamily: 'Zain', resize: 'vertical' }}
        />
      </Field>

      <div className="mt-1 rounded-xl bg-[#F8FAFC] p-3.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-500">{t('shopSmm.quantityMode')}</span>
          <span className="mono">{product.quantityMode}</span>
        </div>
        <div className="mt-1 flex justify-between text-[13px]">
          <span className="text-gray-500">{t('shopSmm.quantity')}</span>
          <span className="mono">{productQuantityLabel(product)}</span>
        </div>
      </div>

      <Link to={`/shop/product/${product._id}`}>
        <Btn size="lg" full icon="bolt">{t('shopSmm.submitOrder')}</Btn>
      </Link>
    </div>
  );
}
