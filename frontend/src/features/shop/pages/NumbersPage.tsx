import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  Dot,
  Field,
  SectionHead,
  ServiceTile,
} from '../components/primitives';
import { useShopCategories, useShopProducts, useShopServices } from '../hooks/shop.hooks';
import { ShopCategoryItem, ShopProductItem } from '../types/shop.types';
import { localized } from '../utils/shop-format';
import { getCountryByIso, getCountryName } from '@/shared/constants/countries';
import { Pagination } from '@/shared/components/ui/Pagination';

type Phase = 'idle' | 'active' | 'received';
type NumberCountry = { code: string; flag: string; name: string; mult: number; price?: number; count?: number };
type NumberApp = {
  id: string;
  name: string;
  glyph: string;
  color: string;
  avail: number;
  price: number;
  categoryId?: string;
  product?: ShopProductItem;
};

export default function NumbersPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const productLimit = 10;
  const { data: servicesResponse } = useShopServices({ page: 1, limit: 100 });
  const { data: categoriesResponse } = useShopCategories({ serviceId }, { enabled: Boolean(serviceId) });
  const { data: productsResponse, isLoading } = useShopProducts(
    { page: productPage, limit: productLimit, serviceId, categoryId: categoryId || undefined },
    { enabled: Boolean(serviceId) },
  );
  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const selectedCategory = categories.find((category) => category._id === categoryId);
  const selectedService = servicesResponse?.data.find((service) => service._id === serviceId);
  const apps = buildNumberApps(categories, products, i18n.language);
  const [appId, setAppId] = useState('');
  const selectedApp = apps.find((item) => item.id === appId) || apps[0] || buildFallbackApp(t('shopNumbers.serviceFallback'));
  const availableCountries = buildProductCountries(selectedApp.product, i18n.language);
  const [countryCode, setCountryCode] = useState('');
  const country = availableCountries.find((item) => item.code === countryCode) || availableCountries[0];

  const price = ((country?.price ?? selectedApp.price) * (country?.mult || 1)).toFixed(2);

  useEffect(() => {
    setProductPage(1);
    setAppId('');
    setPhase('idle');
  }, [categoryId, serviceId]);

  useEffect(() => {
    if (!selectedCategory) {
      setCategorySearch('');
      return;
    }
    setCategorySearch(localized(selectedCategory.name, i18n.language, selectedCategory._id));
  }, [i18n.language, selectedCategory]);

  useEffect(() => {
    if (!apps.length) return;
    if (!apps.some((item) => item.id === appId)) setAppId(apps[0].id);
  }, [appId, apps]);

  useEffect(() => {
    if (!availableCountries.length) return;
    if (!availableCountries.some((item) => item.code === countryCode)) setCountryCode(availableCountries[0].code);
  }, [availableCountries, countryCode]);

  useEffect(() => {
    if (phase !== 'active') return;
    const tickId = setInterval(() => setSeconds((s) => s + 1), 1000);
    const arriveId = setTimeout(() => {
      setCode(Math.floor(100000 + Math.random() * 900000).toString());
      setPhase('received');
    }, 6000);
    return () => {
      clearInterval(tickId);
      clearTimeout(arriveId);
    };
  }, [phase]);

  const start = () => {
    setSeconds(0);
    setCode(null);
    setPhase('active');
  };
  const cancel = () => {
    setPhase('idle');
    setSeconds(0);
    setCode(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-3xl bg-[#100E22] p-6 text-white md:p-8">
        <Badge kind="primary" className="mb-3">Live · 64 apps · 180 countries</Badge>
        <div className="text-3xl font-black md:text-4xl" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
          {selectedService ? localized(selectedService.name, i18n.language, t('shopNumbers.title')) : t('shopNumbers.title')}
        </div>
        <div className="mt-2 max-w-[600px] text-sm text-white/65">
          {selectedService ? localized(selectedService.description, i18n.language, t('shopNumbers.description')) : t('shopNumbers.description')}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* App selector */}
        <div>
          <SectionHead title={t('shopNumbers.chooseApp')} sub={t('shopNumbers.chooseAppDescription')} />
          <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <input
                value={categorySearch}
                list="shop-number-categories"
                onChange={(event) => {
                  const value = event.target.value;
                  setCategorySearch(value);
                  const matched = categories.find((category) => localized(category.name, i18n.language, category._id) === value);
                  setCategoryId(matched?._id || '');
                }}
                placeholder={t('shopNumbers.allCategories')}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#100E22]"
              />
              <datalist id="shop-number-categories">
                {categories.map((category) => (
                  <option key={category._id} value={localized(category.name, i18n.language, category._id)} />
                ))}
              </datalist>
            </div>
            <Btn kind="outline" size="sm" icon="filter" onClick={() => { setCategoryId(''); setCategorySearch(''); }}>
              {t('shopNumbers.resetFilters')}
            </Btn>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {isLoading && Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[76px] rounded-2xl border border-gray-200 bg-white" />
            ))}
            {!isLoading && apps.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAppId(a.id);
                  setPhase('idle');
                }}
                className={clsx(
                  'flex items-center gap-3 rounded-2xl border-[1.5px] bg-white p-3.5 text-left',
                  selectedApp.id === a.id ? 'border-[#100E22]' : 'border-gray-200',
                )}
              >
                <ServiceTile name={a.name} glyph={a.glyph} color={a.color} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-extrabold">{a.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Dot color={a.avail > 30 ? '#16A34A' : '#F59E0B'} pulse={a.avail < 30} />
                    {t('shopNumbers.numbersAvailable', { count: a.avail })}
                  </div>
                </div>
                <div className="text-[15px] font-extrabold">${a.price}</div>
              </button>
            ))}
            {!isLoading && !apps.length && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm font-semibold text-gray-500 sm:col-span-2">
                {t('shopNumbers.empty')}
              </div>
            )}
          </div>
          <Pagination
            total={productsResponse?.meta?.total || 0}
            page={productPage}
            limit={productLimit}
            onChange={(page) => {
              setProductPage(page);
              setAppId('');
              setPhase('idle');
            }}
            className="mt-4"
          />
        </div>

        {/* Activation panel */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-4">
          {phase === 'idle' && (
            <>
              <div className="text-lg font-extrabold">Activate a number</div>
              <div className="mb-5 mt-1 text-[13px] text-gray-500">
                Select country, confirm price, get number.
              </div>

              <Field label="Service">
                <div className="flex items-center gap-2.5 rounded-[10px] bg-[#F8FAFC] p-2.5">
                  <ServiceTile name={selectedApp.name} glyph={selectedApp.glyph} color={selectedApp.color} size={36} />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{selectedApp.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Dot color="#16A34A" /> {t('shopNumbers.numbersAvailable', { count: selectedApp.avail })}
                    </div>
                  </div>
                </div>
              </Field>

              <Field label="Country" className="mt-3.5">
                <div className="grid grid-cols-5 gap-1.5">
                  {availableCountries.slice(0, 10).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCountryCode(c.code)}
                      className={clsx(
                        'flex flex-col items-center gap-0.5 rounded-[10px] border-[1.5px] p-2 text-sm',
                        country?.code === c.code ? 'border-[#100E22] bg-[#100E22] text-white' : 'border-gray-200 bg-white text-[#111827]',
                      )}
                    >
                      <CountryFlag country={c} />
                      <span className="text-[10px] font-bold">{c.code}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="mt-4 rounded-xl bg-[#F8FAFC] p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="text-[13px] text-gray-500">Live price</div>
                  <button
                    onClick={() => setRefreshTick((t) => t + 1)}
                    className="flex items-center gap-1 text-[11px] text-blue-600"
                  >
                    <Icon name="refresh" size={11} /> refresh
                  </button>
                </div>
                <div className="text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                  ${price}
                </div>
                <div className="mono mt-1 text-[11px] text-gray-500">
                  updated {refreshTick * 3}s ago · {country?.flag} {country?.name}
                </div>
              </div>

              <Btn size="lg" full icon="bolt" className="mt-4" onClick={start} disabled={!selectedApp.product || !country}>
                Get number · ${price}
              </Btn>
              <div className="mt-2 text-center text-[11px] text-gray-500">
                Refunded automatically if no SMS arrives in 20 min.
              </div>
            </>
          )}

          {phase === 'active' && country && (
            <ActivePanel app={selectedApp} country={country} seconds={seconds} onCancel={cancel} />
          )}

          {phase === 'received' && code && country && (
            <ReceivedPanel app={selectedApp} country={country} code={code} seconds={seconds} onFinish={cancel} />
          )}
        </div>
      </div>
    </div>
  );
}

function buildNumberApps(categories: ShopCategoryItem[], products: ShopProductItem[], language: string): NumberApp[] {
  if (!products.length) return [];
  const productsByCategory = new Map<string, ShopProductItem[]>();
  for (const product of products) {
    const categoryId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id || product._id;
    productsByCategory.set(categoryId, [...(productsByCategory.get(categoryId) || []), product]);
  }

  const categoryApps = categories
    .map((category) => {
      const categoryProducts = productsByCategory.get(category._id) || [];
      const product = categoryProducts[0];
      if (!product) return null;
      const name = localized(category.name, language, localized(product.name, language, 'Service'));
      return {
        id: category._id,
        categoryId: category._id,
        name,
        glyph: buildGlyph(name),
        color: colorFromSeed(category._id),
        avail: getProductAvailableCount(product),
        price: getProductMinPrice(product),
        product,
      };
    })
    .filter(Boolean) as NumberApp[];

  if (categoryApps.length) return categoryApps;

  return products.map((product) => {
    const name = localized(product.name, language, 'Service');
    return {
      id: product._id,
      name,
      glyph: buildGlyph(name),
      color: colorFromSeed(product._id),
      avail: getProductAvailableCount(product),
      price: getProductMinPrice(product),
      product,
    };
  });
}

function buildProductCountries(product: ShopProductItem | undefined, language: string): NumberCountry[] {
  if (product?.numberCountries?.length) {
    return product.numberCountries
      .map((country) => {
        const code = String(country.countryCode || '').toUpperCase();
        const catalogCountry = code.length === 2 ? getCountryByIso(code) : undefined;
        return {
          code,
          flag: country.flag || catalogCountry?.flag || (code.length === 2 ? isoToFlag(code) : ''),
          name: country.countryName || (code.length === 2 ? getCountryName(code, language) : code),
          mult: 1,
          price: country.price,
          count: country.count,
        };
      })
      .filter((country) => country.code && country.code !== 'IL');
  }

  const codes = product?.visibleCountryCodes || [];

  return codes
    .map((code) => {
      const iso = code.toUpperCase();
      const country = iso.length === 2 ? getCountryByIso(iso) : undefined;
      return {
        code: iso,
        flag: country?.flag || (iso.length === 2 ? isoToFlag(iso) : ''),
        name: iso.length === 2 ? getCountryName(iso, language) : iso,
        mult: 1,
      };
    })
    .filter((country) => country.code !== 'IL');
}

function CountryFlag({ country }: { country: NumberCountry }) {
  if (country.flag.startsWith('http')) {
    return <img src={country.flag} alt="" className="h-5 w-5 rounded-full object-cover" />;
  }
  return <span className="text-lg">{country.flag || country.code}</span>;
}

function getProductMinPrice(product: ShopProductItem | undefined) {
  const prices = (product?.numberCountries || [])
    .map((country) => country.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));
  return prices.length ? Math.min(...prices) : 0;
}

function getProductAvailableCount(product: ShopProductItem | undefined) {
  const counts = (product?.numberCountries || [])
    .map((country) => country.count)
    .filter((count): count is number => typeof count === 'number' && Number.isFinite(count));
  if (counts.length) return counts.reduce((sum, count) => sum + count, 0);
  return product?.visibleCountryCodes?.length || 0;
}

function buildFallbackApp(name: string): NumberApp {
  return {
    id: 'fallback',
    name,
    glyph: buildGlyph(name),
    color: '#100E22',
    avail: 0,
    price: 0,
  };
}

function buildGlyph(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'S';
}

function colorFromSeed(seed: string) {
  const colors = ['#1877F2', '#E1306C', '#229ED9', '#16A34A', '#FF6B00', '#7B5BFF', '#100E22'];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

function isoToFlag(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function ActivePanel({
  app,
  country,
  seconds,
  onCancel,
}: {
  app: NumberApp;
  country: NumberCountry;
  seconds: number;
  onCancel: () => void;
}) {
  const phone = '+1 (415) 555-0' + ((182 + seconds) % 999).toString().padStart(3, '0');
  return (
    <div className="tc-slideup">
      <div className="mb-4 flex items-center gap-2.5">
        <ServiceTile name={app.name} glyph={app.glyph} color={app.color} size={36} />
        <div className="flex-1">
          <div className="text-base font-extrabold">{app.name} · {country.flag}</div>
          <div className="text-xs text-gray-500">
            Activation ID #ACT-{((Date.now() % 100000) + seconds).toString().padStart(6, '0')}
          </div>
        </div>
        <Badge kind="info" dot>Active</Badge>
      </div>

      <div className="rounded-2xl bg-[#F8FAFC] p-5 text-center">
        <div className="mono mb-1 text-[11px] text-gray-500" style={{ letterSpacing: 0.5 }}>
          YOUR NUMBER
        </div>
        <div className="mono text-[26px] font-bold" style={{ letterSpacing: '0.05em' }}>
          {phone}
        </div>
        <Btn kind="outline" size="sm" icon="copy" className="mt-3">Copy number</Btn>
      </div>

      <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-[#100E22] p-4 text-white">
        <Icon name="refresh" size={20} className="tc-spin text-primary" />
        <div className="flex-1">
          <div className="text-sm font-bold">Waiting for SMS…</div>
          <div className="text-[11px] text-white/60">
            Send the verification request from {app.name} to this number.
          </div>
        </div>
        <div className="mono text-lg font-bold">0:{seconds.toString().padStart(2, '0')}</div>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <Btn kind="outline" size="sm" icon="refresh">Refresh</Btn>
        <Btn kind="outline" size="sm" icon="sms">Resend</Btn>
        <Btn kind="danger" size="sm" icon="close" onClick={onCancel}>Cancel</Btn>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-xs">
        {[
          { t: 'Number reserved', d: 'just now', done: true, active: false },
          { t: 'Waiting for SMS', d: 'in progress', done: false, active: true },
          { t: 'Code received', d: '—', done: false, active: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className={clsx(
                'grid h-[18px] w-[18px] place-items-center rounded-full',
                step.done ? 'bg-green-600' : step.active ? 'bg-primary' : 'bg-gray-200',
              )}
            >
              {step.done && <Icon name="check" size={11} className="text-white" />}
              {step.active && <div className="h-2 w-2 rounded-full bg-[#100E22]" />}
            </div>
            <div className={clsx('flex-1', step.active ? 'font-bold' : 'font-medium', !step.done && !step.active && 'text-gray-500')}>
              {step.t}
            </div>
            <div className="mono text-[11px] text-gray-500">{step.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceivedPanel({
  app,
  country,
  code,
  seconds,
  onFinish,
}: {
  app: NumberApp;
  country: NumberCountry;
  code: string;
  seconds: number;
  onFinish: () => void;
}) {
  return (
    <div className="tc-slideup">
      <div className="mb-4 flex items-center gap-2.5">
        <ServiceTile name={app.name} glyph={app.glyph} color={app.color} size={36} />
        <div className="flex-1">
          <div className="text-base font-extrabold">{app.name} · {country.flag}</div>
          <div className="text-xs text-gray-500">Code received in {seconds}s</div>
        </div>
        <Badge kind="success" dot>Received</Badge>
      </div>

      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #DCFCE7 0%, #FEFCE8 100%)' }}
      >
        <div className="mono text-[11px] font-bold text-green-700" style={{ letterSpacing: 0.6 }}>
          SMS CODE
        </div>
        <div
          className="mono mt-1 text-[44px] font-extrabold text-[#100E22]"
          style={{ letterSpacing: '0.18em' }}
        >
          {code.slice(0, 3)} {code.slice(3)}
        </div>
        <Btn kind="dark" size="sm" icon="copy" className="mt-3.5">Copy code</Btn>
      </div>

      <div className="mt-3.5 rounded-[10px] bg-[#F8FAFC] p-3 text-xs text-gray-500" style={{ lineHeight: 1.5 }}>
        <Icon name="info" size={14} className="mr-1 inline-block align-[-2px]" />
        Codes from {app.name} typically arrive in 4–12 seconds. You can request a second code or finish the activation.
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <Btn kind="outline" size="md" icon="refresh">Get another code</Btn>
        <Btn kind="primary" size="md" icon="check" onClick={onFinish}>Finish</Btn>
      </div>
    </div>
  );
}
