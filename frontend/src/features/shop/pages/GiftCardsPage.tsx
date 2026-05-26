import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Badge, Btn, ProductTile } from '../components/primitives';
import { useShopCategories, useShopCategoryItems, useShopProducts, useShopServices } from '../hooks/shop.hooks';
import { ShopCategoryCatalogItem, ShopCategoryItem, ShopProductGroupItem, ShopProductItem } from '../types/shop.types';
import { categoryName, localized, productQuantityLabel, serviceFromProduct } from '../utils/shop-format';
import { Pagination } from '@/shared/components/ui/Pagination';

const PAGE_LIMIT = 12;

export default function GiftCardsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const groupId = searchParams.get('groupId') || undefined;
  const categoryPage = Number(searchParams.get('categoryPage') || 1);
  const itemPage = Number(searchParams.get('itemPage') || 1);
  const productPage = Number(searchParams.get('productPage') || 1);

  const { data: servicesResponse } = useShopServices({ page: 1, limit: 100 });
  const { data: categoriesResponse, isLoading: categoriesLoading } = useShopCategories(
    { page: categoryPage, limit: PAGE_LIMIT, serviceId },
    { enabled: Boolean(serviceId) },
  );
  const { data: itemsResponse, isLoading: itemsLoading } = useShopCategoryItems(
    { page: itemPage, limit: PAGE_LIMIT, serviceId, categoryId },
    { enabled: Boolean(serviceId && categoryId && !groupId) },
  );
  const { data: productsResponse, isLoading: productsLoading } = useShopProducts(
    { page: productPage, limit: PAGE_LIMIT, serviceId, categoryId, groupId },
    { enabled: Boolean(serviceId && categoryId && groupId) },
  );

  const selectedService = servicesResponse?.data.find((service) => service._id === serviceId);
  const categories = categoriesResponse?.data || [];
  const items = itemsResponse?.data || [];
  const products = productsResponse?.data || [];
  const stage: 'categories' | 'items' | 'products' = groupId ? 'products' : categoryId ? 'items' : 'categories';
  const title = selectedService ? localized(selectedService.name, i18n.language, t('shopGiftCards.title')) : t('shopGiftCards.title');
  const description = selectedService
    ? localized(selectedService.description, i18n.language, t('shopGiftCards.description'))
    : t('shopGiftCards.description');
  const total = stage === 'categories'
    ? categoriesResponse?.meta?.total || 0
    : stage === 'items'
      ? itemsResponse?.meta?.total || 0
      : productsResponse?.meta?.total || 0;

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex min-h-[220px] items-center justify-between overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-9">
        <div className="relative max-w-[540px]">
          <Badge kind="primary" className="mb-4">
            {t(`shopGiftCards.stage.${stage}`, { count: total })}
          </Badge>
          <div className="mb-3 text-3xl font-black md:text-[44px]" style={{ lineHeight: 1 }}>
            {title}
          </div>
          <div className="max-w-[460px] text-[15px] text-white/65">
            {description}
          </div>
          {(categoryId || groupId) && (
            <div className="mt-4 flex gap-2">
              {groupId && (
                <Btn kind="outlineLight" size="sm" icon="arrowL" onClick={() => updateParams({ groupId: undefined, productPage: undefined })}>
                  {t('shopGiftCards.backToItems')}
                </Btn>
              )}
              {categoryId && (
                <Btn kind="outlineLight" size="sm" icon="arrowL" onClick={() => updateParams({ categoryId: undefined, groupId: undefined, itemPage: undefined, productPage: undefined })}>
                  {t('shopGiftCards.backToCategories')}
                </Btn>
              )}
            </div>
          )}
        </div>
        <div className="absolute right-9 top-9 bottom-9 hidden w-[380px] gap-3 md:flex">
          <div className="w-[170px] self-start" style={{ transform: 'rotate(-6deg)' }}>
            <ProductTile name={localized(products[0]?.name, i18n.language, title)} sub={products[0]?.quantityMode || t('shopGiftCards.category')} denom={products[0] ? productQuantityLabel(products[0]) : String(total)} />
          </div>
          <div className="w-[170px] self-end" style={{ transform: 'rotate(4deg)' }}>
            <ProductTile name={localized(products[1]?.name, i18n.language, t('shopGiftCards.products'))} sub={products[1]?.quantityMode || t('shopGiftCards.group')} denom={products[1] ? productQuantityLabel(products[1]) : String(total)} />
          </div>
        </div>
      </div>

      {stage === 'categories' && (
        <CatalogGrid
          isLoading={categoriesLoading}
          items={categories}
          emptyText={t('shopGiftCards.emptyCategories')}
          render={(category) => (
            <CategoryCard
              key={category._id}
              category={category}
              onClick={() => updateParams({ categoryId: category._id, categoryPage: undefined, itemPage: undefined, productPage: undefined })}
            />
          )}
        />
      )}

      {stage === 'items' && (
        <CatalogGrid
          isLoading={itemsLoading}
          items={items}
          emptyText={t('shopGiftCards.emptyItems')}
          render={(item, index) => (
            <CategoryItemCard
              key={item.type === 'GROUP' ? `group-${item.group._id}` : `product-${item.product._id}`}
              item={item}
              promo={item.type === 'PRODUCT' ? (index === 1 ? 12 : index === 4 ? 8 : undefined) : undefined}
              onGroupClick={(group) => navigate(`/shop/product-group/${group._id}?serviceId=${serviceId || ''}&categoryId=${categoryId || ''}`)}
            />
          )}
        />
      )}

      {stage === 'products' && (
        <CatalogGrid
          isLoading={productsLoading}
          items={products}
          emptyText={t('shopGiftCards.emptyProducts')}
          render={(product, index) => (
            <GiftCardCard
              key={product._id}
              p={product}
              promo={index === 1 ? 12 : index === 4 ? 8 : undefined}
            />
          )}
        />
      )}

      <Pagination
        total={total}
        page={stage === 'categories' ? categoryPage : stage === 'items' ? itemPage : productPage}
        limit={PAGE_LIMIT}
        onChange={(page) => {
          if (stage === 'categories') updateParams({ categoryPage: String(page) });
          if (stage === 'items') updateParams({ itemPage: String(page) });
          if (stage === 'products') updateParams({ productPage: String(page) });
        }}
      />
    </div>
  );
}

function CatalogGrid<T>({
  isLoading,
  items,
  emptyText,
  render,
}: {
  isLoading: boolean;
  items: T[];
  emptyText: string;
  render: (item: T, index: number) => ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-[260px] rounded-2xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => render(item, index))}
    </div>
  );
}

function CategoryCard({ category, onClick }: { category: ShopCategoryItem; onClick: () => void }) {
  const { t, i18n } = useTranslation();
  const name = localized(category.name, i18n.language, t('shopGiftCards.category'));
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:shadow-xl"
    >
      {category.image?.secureUrl ? (
        <img src={category.image.secureUrl} alt="" className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <ProductTile name={name} sub={t('shopGiftCards.category')} denom="CAT" />
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold">{name}</div>
          <div className="text-xs text-gray-500">{t('shopGiftCards.openCategory')}</div>
        </div>
        <Icon name="arrowR" size={18} className="text-gray-400 transition group-hover:text-[#100E22]" />
      </div>
    </button>
  );
}

function GroupCard({ group, onClick }: { group: ShopProductGroupItem; onClick: () => void }) {
  const { t, i18n } = useTranslation();
  const name = localized(group.name, i18n.language, t('shopGiftCards.group'));
  const description = localized(group.description, i18n.language, '');
  const imageUrl = group.coverImage?.secureUrl || group.image?.secureUrl;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition hover:-translate-y-1 hover:shadow-xl"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="p-4">
          <ProductTile name={name} sub={t('shopGiftCards.group')} denom={String(group.productCount)} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold">{name}</div>
            <div className="mt-1 line-clamp-2 text-xs text-gray-500">{description || t('shopGiftCards.openGroup')}</div>
          </div>
          {group.image?.secureUrl && group.image.secureUrl !== imageUrl && <img src={group.image.secureUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge kind="soft" className="!normal-case">{t('shopGiftCards.productCount', { count: group.productCount })}</Badge>
          <Icon name="arrowR" size={18} className="text-gray-400 transition group-hover:text-[#100E22]" />
        </div>
      </div>
    </button>
  );
}

function CategoryItemCard({
  item,
  promo,
  onGroupClick,
}: {
  item: ShopCategoryCatalogItem;
  promo?: number;
  onGroupClick: (group: ShopProductGroupItem) => void;
}) {
  if (item.type === 'GROUP') {
    return <GroupCard group={item.group} onClick={() => onGroupClick(item.group)} />;
  }
  return <GiftCardCard p={item.product} promo={promo} />;
}

function GiftCardCard({ p, promo }: { p: ShopProductItem; promo?: number }) {
  const { t, i18n } = useTranslation();
  const name = localized(p.name, i18n.language, t('shopGiftCards.product'));
  const service = serviceFromProduct(p);
  const sub = service ? localized(service.name, i18n.language) : categoryName(p, i18n.language);
  const quantity = productQuantityLabel(p);

  return (
    <Link
      to={`/shop/product/${p._id}`}
      className="relative block overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      {promo && (
        <div className="absolute left-3.5 top-3.5 z-10 rounded-md bg-red-600 px-2 py-1 text-[11px] font-extrabold text-white">
          -{promo}%
        </div>
      )}
      {p.image?.secureUrl ? (
        <img src={p.image.secureUrl} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="p-3.5">
          <ProductTile name={name} sub={sub || p.quantityMode} denom={quantity} />
        </div>
      )}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <Badge kind={p.quantityAvailable && p.stock ? 'success' : 'danger'} dot className="!normal-case">
            {p.quantityAvailable && p.stock ? t('shopGiftCards.inStock') : t('shopGiftCards.unavailable')}
          </Badge>
          <div className="mono text-[11px] text-gray-500">{p.fulfillmentType}</div>
        </div>
        <div className="mt-2.5 text-base font-extrabold">
          {name}
        </div>
        <div className="mt-0.5 text-xs text-gray-500">{p.quantityMode}</div>
        <div className="mt-3.5 flex items-end justify-between">
          <div>
            <div className="mono text-[11px] text-gray-500">{t('shopGiftCards.quantity')}</div>
            <div className="text-[22px] font-extrabold">
              {quantity}
            </div>
          </div>
          <Btn size="sm" kind="dark">{t('shopGiftCards.buy')}</Btn>
        </div>
      </div>
    </Link>
  );
}
