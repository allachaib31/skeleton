import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  Field,
  ProductTile,
  SectionHead,
} from '../components/primitives';
import { useCreateShopOrder, useShopProduct, useShopProducts } from '../hooks/shop.hooks';
import { ShopProductItem, ShopProductRequirementItem } from '../types/shop.types';
import { categoryName, localized, productQuantityLabel, serviceFromProduct } from '../utils/shop-format';
import { useProfile } from '@/features/users/hooks/useProfile';

export default function ProductPage() {
  const { t } = useTranslation();
  const { id, groupId } = useParams<{ id?: string; groupId?: string }>();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const [selectedProductId, setSelectedProductId] = useState(id || '');

  const { data: groupProductsResponse, isLoading: isGroupProductsLoading } = useShopProducts(
    { page: 1, limit: 100, serviceId, categoryId, groupId },
    { enabled: Boolean(groupId) },
  );
  const groupProducts = groupProductsResponse?.data || [];
  const effectiveProductId = groupId ? selectedProductId || groupProducts[0]?._id : id;
  const { data: productResponse, isLoading: isProductLoading } = useShopProduct(effectiveProductId);
  const product = productResponse?.data;

  useEffect(() => {
    if (id) setSelectedProductId(id);
  }, [id]);

  useEffect(() => {
    if (!groupId || selectedProductId || !groupProducts[0]) return;
    setSelectedProductId(groupProducts[0]._id);
  }, [groupId, groupProducts, selectedProductId]);

  if (isProductLoading || isGroupProductsLoading) {
    return <div className="h-[420px] rounded-3xl border border-gray-200 bg-white" />;
  }

  if (!product) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
        <div className="text-xl font-black">{t('shopProduct.notFound')}</div>
        <Link to="/shop/giftcards" className="mt-4 inline-block">
          <Btn kind="dark">{t('shopProduct.backToShop')}</Btn>
        </Link>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      groupProducts={groupProducts}
      selectedProductId={effectiveProductId || ''}
      onSelectProduct={setSelectedProductId}
    />
  );
}

function ProductDetail({
  product,
  groupProducts,
  selectedProductId,
  onSelectProduct,
}: {
  product: ShopProductItem;
  groupProducts: ShopProductItem[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: profileResponse } = useProfile();
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateShopOrder();
  const user = profileResponse?.data;
  const service = serviceFromProduct(product);
  const currentCategoryId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id;
  const name = localized(product.name, i18n.language, t('shopProduct.productFallback'));
  const sub = service ? localized(service.name, i18n.language) : categoryName(product, i18n.language);
  const description = localized(product.description, i18n.language, '');
  const quantityLabel = productQuantityLabel(product);
  const minQuantity = product.minQuantity || 1;
  const maxQuantity = product.maxQuantity || minQuantity;
  const [quantity, setQuantity] = useState(minQuantity);
  const [requirements, setRequirements] = useState<Record<string, string>>({});
  const { data: relatedResponse } = useShopProducts(
    { page: 1, limit: 12, serviceId: service?._id, categoryId: currentCategoryId },
    { enabled: Boolean(currentCategoryId) },
  );
  const related = (relatedResponse?.data || []).filter((item) => item._id !== product._id).slice(0, 10);
  const balance = user?.balance || 0;
  const openCredit = user?.openCredit || 0;

  useEffect(() => {
    setQuantity(product.minQuantity || 1);
    const initialValues: Record<string, string> = {};
    product.requirements?.forEach((requirement) => {
      if (typeof requirement !== 'string' && requirement.defaultValue) {
        initialValues[requirement.paramsName] = requirement.defaultValue;
      }
    });
    setRequirements(initialValues);
  }, [product]);

  const productChoices = useMemo(() => groupProducts.filter((item) => item._id), [groupProducts]);
  const isAvailable = product.quantityAvailable && product.stock;
  const updateRequirement = (name: string, value: string) => {
    setRequirements((current) => ({ ...current, [name]: value }));
  };

  const onQuantityInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) return;
    setQuantity(Math.min(Math.max(next, minQuantity), maxQuantity));
  };

  const submitOrder = () => {
    createOrder(
      { productId: product._id, quantity, requirements },
      {
        onSuccess: (response) => {
          navigate(`/shop/orders/${response.data._id}`);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
        <Link to="/shop/dashboard" className="hover:text-[#100E22]">{t('shopProduct.marketplace')}</Link>
        <Icon name="chevronR" size={12} />
        <Link to={`/shop/giftcards${service ? `?serviceId=${service._id}` : ''}`} className="hover:text-[#100E22]">
          {sub || t('shopGiftCards.products')}
        </Link>
        <Icon name="chevronR" size={12} />
        <span className="font-semibold text-[#111827]">{name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <div className="mx-auto max-w-[520px]">
              {product.image?.secureUrl ? (
                <img src={product.image.secureUrl} alt="" className="h-[320px] w-full rounded-2xl object-cover" />
              ) : (
                <ProductTile name={name} sub={sub || product.fulfillmentType} denom={quantityLabel} size="lg" />
              )}
            </div>
          </div>

          {productChoices.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <SectionHead title={t('shopProduct.chooseProduct')} />
              <div className="grid gap-2 sm:grid-cols-2">
                {productChoices.map((choice) => {
                  const choiceName = localized(choice.name, i18n.language, t('shopProduct.productFallback'));
                  return (
                    <button
                      key={choice._id}
                      type="button"
                      onClick={() => onSelectProduct(choice._id)}
                      className={clsx(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-[#100E22]',
                        selectedProductId === choice._id ? 'border-[#100E22] bg-[#100E22] text-white' : 'border-gray-200 bg-white',
                      )}
                    >
                      {choice.image?.secureUrl ? (
                        <img src={choice.image.secureUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16">
                          <ProductTile name={choiceName} sub={choice.quantityMode} denom={productQuantityLabel(choice)} size="sm" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold">{choiceName}</div>
                        <div className={clsx('text-xs', selectedProductId === choice._id ? 'text-white/60' : 'text-gray-500')}>
                          {choice.quantityMode} · {productQuantityLabel(choice)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-3 text-base font-extrabold">{t('shopProduct.about')}</div>
            <p className="m-0 text-sm text-gray-500" style={{ lineHeight: 1.6 }}>
              {description || name}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoTile label={t('shopProduct.fulfillment')} value={product.fulfillmentType} />
              <InfoTile label={t('shopProduct.quantityMode')} value={product.quantityMode} />
              <InfoTile label={t('shopProduct.availableQuantity')} value={quantityLabel} />
              <InfoTile label={t('shopProduct.delivery')} value={product.stock ? t('shopProduct.stockDelivery') : t('shopProduct.providerDelivery')} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <Badge kind={isAvailable ? 'success' : 'danger'} dot className="!normal-case">
                {isAvailable ? t('shopGiftCards.inStock') : t('shopGiftCards.unavailable')}
              </Badge>
              <Badge kind="dark">{product.fulfillmentType}</Badge>
            </div>
            <div className="mt-2 text-[26px] font-extrabold leading-tight">{name}</div>
            <div className="mt-1 text-sm text-gray-500">{sub || categoryName(product, i18n.language)}</div>

            <div className="my-5 border-t border-gray-200 pt-5">
              <Field label={t('shopProduct.productMode')}>
                <div className="mt-1 rounded-[10px] border-[1.5px] border-[#100E22] bg-[#100E22] px-4 py-3 text-base font-extrabold text-white">
                  {product.quantityMode} · {quantityLabel}
                </div>
              </Field>
            </div>

            {product.quantityMode !== 'WITHOUT_QUANTITY' && (
              <Field label={t('shopGiftCards.quantity')}>
                {product.quantityMode === 'CUSTOMIZE' && product.customQuantities?.length ? (
                  <select
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 font-bold outline-none focus:border-[#100E22]"
                  >
                    {product.customQuantities.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={quantity}
                    min={minQuantity}
                    max={maxQuantity}
                    onChange={onQuantityInput}
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 font-bold outline-none focus:border-[#100E22]"
                  />
                )}
                <div className="mono mt-1 text-center text-[11px] text-gray-500">
                  {t('shopProduct.quantityBounds', { min: minQuantity, max: maxQuantity })}
                </div>
              </Field>
            )}

            {product.requirements?.length ? (
              <div className="mt-5 border-t border-gray-200 pt-5">
                <div className="mb-3 text-sm font-extrabold">{t('shopProduct.requirements')}</div>
                <div className="flex flex-col gap-3">
                  {product.requirements.map((requirement) => (
                    typeof requirement === 'string' ? null : (
                      <RequirementField
                        key={requirement._id}
                        requirement={requirement}
                        product={product}
                        value={requirements[requirement.paramsName] || ''}
                        onChange={(value) => updateRequirement(requirement.paramsName, value)}
                      />
                    )
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-gray-200 pt-4.5">
              <PriceRow label={t('shopProduct.finalPrice')} value={t('shopProduct.calculatedAtOrder')} />
              <PriceRow label={t('shopProduct.walletBalance')} value={`$${balance.toFixed(2)}`} />
              <PriceRow label={t('shopProduct.openCredit')} value={`$${openCredit.toFixed(2)}`} />
            </div>

            <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-gray-200 bg-[#F8FAFC] p-3.5">
              <Icon name="wallet" size={20} className="text-[#100E22]" />
              <div className="flex-1">
                <div className="text-[13px] font-bold">{t('shopProduct.readyForOrder')}</div>
                <div className="text-[11px] text-gray-500">
                  {t('shopProduct.orderWorkflowNote')}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Btn size="lg" full icon="bolt" disabled={!isAvailable || isCreatingOrder} onClick={submitOrder}>
                {isCreatingOrder ? t('common.loading') : t('shopProduct.continueToOrder')}
              </Btn>
              <Btn kind="outline" size="md" full icon="heart">{t('shopProduct.saveForLater')}</Btn>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="w-full">
          <SectionHead title={t('shopProduct.relatedProducts')} />
          <div className="flex snap-x gap-3.5 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.map((relatedProduct) => {
              const relatedName = localized(relatedProduct.name, i18n.language, t('shopProduct.productFallback'));
              const relatedService = serviceFromProduct(relatedProduct);
              return (
                <Link
                  key={relatedProduct._id}
                  to={`/shop/product/${relatedProduct._id}`}
                  className="block w-[210px] flex-none snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl sm:w-[230px] lg:w-[245px]"
                >
                  {relatedProduct.image?.secureUrl ? (
                    <img src={relatedProduct.image.secureUrl} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="p-2">
                      <ProductTile name={relatedName} sub={relatedService ? localized(relatedService.name, i18n.language) : relatedProduct.quantityMode} denom={productQuantityLabel(relatedProduct)} size="sm" />
                    </div>
                  )}
                  <div className="px-3 pb-3 pt-2">
                    <div className="truncate text-[13px] font-bold">{relatedName}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="mono text-[11px] text-gray-500">{relatedProduct.quantityMode}</div>
                      <div className="text-sm font-extrabold">{productQuantityLabel(relatedProduct)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementField({
  requirement,
  product,
  value,
  onChange,
}: {
  requirement: ShopProductRequirementItem;
  product: ShopProductItem;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const label = localized(requirement.message, i18n.language, requirement.paramsName);
  const description = localized(requirement.description, i18n.language, '');
  const isCountryCode = requirement.paramsName.toLowerCase() === 'countrycode';

  return (
    <Field label={label} hint={description || (requirement.isRequired ? t('common.required') : undefined)}>
      {isCountryCode && product.numberCountries?.length ? (
        <select
          value={value}
          required={requirement.isRequired}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 font-bold outline-none focus:border-[#100E22]"
        >
          <option value="">{t('shopProduct.chooseCountry')}</option>
          {product.numberCountries.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.countryName || country.countryCode}
            </option>
          ))}
        </select>
      ) : requirement.inputType === 'TEXTAREA' ? (
        <textarea
          value={value}
          required={requirement.isRequired}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[96px] w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 font-bold outline-none focus:border-[#100E22]"
        />
      ) : requirement.inputType === 'CHECKBOX' ? (
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={value === 'true'}
            required={requirement.isRequired}
            onChange={(event) => onChange(String(event.target.checked))}
          />
          {label}
        </label>
      ) : (
        <input
          type={requirement.inputType === 'NUMBER' ? 'number' : 'text'}
          value={value}
          required={requirement.isRequired}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 font-bold outline-none focus:border-[#100E22]"
        />
      )}
    </Field>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[#F8FAFC] p-3">
      <div className="mono text-[10px] font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold">{value}</div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm text-[#111827]">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
