import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  Dot,
  ProductTile,
  ServiceTile,
  Wordmark,
} from '../components/primitives';
import { useShopProducts, useShopServices } from '../hooks/shop.hooks';
import { ShopProductItem, ShopServiceItem } from '../types/shop.types';
import {
  categoryName,
  localized,
  productQuantityLabel,
  serviceColor,
  serviceFromProduct,
  serviceGlyph,
  serviceShopPath,
} from '../utils/shop-format';

/* =====================================================================
 * Static decoration data (non-product, generic copy)
 * =================================================================== */

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
];

const TESTIMONIALS = [
  {
    name: 'Layan H.',
    role: 'Pulse creator',
    text:
      'I top up once a month and run my whole creator workflow — gift cards for ads, growth services for my channels, SMS for new accounts. The wallet is the killer feature.',
  },
  {
    name: 'Omar N.',
    role: 'Reseller, Cairo',
    text:
      'Local agents → wallet → instant delivery to my customers. Margins finally make sense.',
  },
  {
    name: 'Sara M.',
    role: 'Gamer, Riyadh',
    text:
      'Cheapest QuestVerse credits I’ve found, no fake stock. Showed up in three seconds.',
  },
  {
    name: 'Tariq B.',
    role: 'Indie dev',
    text:
      'I built my whole verification flow on tafa3olcard SMS. 80 apps, real numbers, predictable pricing.',
  },
  {
    name: 'Jana K.',
    role: 'Marketing manager',
    text:
      'The refund-to-wallet flow alone won me over. Other marketplaces ghost you.',
  },
];

const HOW_STEPS = [
  { n: '01', t: 'Add balance', d: 'Card, transfer with proof, redeem a code, or crypto.', time: '~30s', i: 'wallet' as const },
  { n: '02', t: 'Pick a product', d: 'Thousands of products across every service, all searchable.', time: '~10s', i: 'grid' as const },
  { n: '03', t: 'Fill the form', d: 'Type-aware fields — denomination, target URL, country.', time: '~15s', i: 'list' as const },
  { n: '04', t: 'Receive instantly', d: 'Code, number, or delivery status. Track each step live.', time: '~6s', i: 'bolt' as const },
];

const ROTATING_WORDS = ['gift cards', 'top-ups', 'SMS codes', 'gaming', 'followers'];

const SEARCH_CHIPS = ['Gift cards', 'Pulse 1k followers', 'US SMS', 'Mobile top-up', 'Streaming 1 month'];

const TRUST_FEATURES = [
  { i: 'wallet' as const, t: '4 ways to add balance', d: 'Card, transfer, code, crypto' },
  { i: 'shield' as const, t: '2FA + session revoke', d: 'Recovery codes you control' },
  { i: 'refresh' as const, t: 'Refunds back to wallet', d: 'Auto-issued if anything fails' },
];

const CTA_PERKS = [
  'Free $5 credit',
  'No card required',
  'Cancel any order before completion',
  'Refund-guaranteed wallet',
  '24/7 multilingual support',
];

const FOOTER_COLS = [
  { t: 'Marketplace', l: ['Gift cards', 'Gaming', 'Streaming', 'Social services', 'SMS numbers'] },
  { t: 'Payments', l: ['Add balance', 'Redeem code', 'Bank transfer', 'Local agents', 'Payment history'] },
  { t: 'Support', l: ['Help center', 'Contact us', 'Status', 'Refund policy', 'API docs'] },
  { t: 'Company', l: ['About', 'Careers', 'Press', 'Terms', 'Privacy'] },
];

/* =====================================================================
 * Page
 * =================================================================== */

export default function LandingPage() {
  const { i18n } = useTranslation();
  const { data: servicesResponse, isLoading: servicesLoading } = useShopServices({ page: 1, limit: 12 });
  const { data: productsResponse, isLoading: productsLoading } = useShopProducts({ page: 1, limit: 18 });

  const services = useMemo(() => servicesResponse?.data ?? [], [servicesResponse]);
  const products = useMemo(() => productsResponse?.data ?? [], [productsResponse]);

  const totalProducts = useMemo(
    () => services.reduce((sum, s) => sum + (s.productCount || 0), 0),
    [services],
  );

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: 'Zain, system-ui, sans-serif' }}>
      <KeyframesStyle />
      <OrderTicker />
      <NavBar services={services} servicesLoading={servicesLoading} />
      <Hero
        services={services}
        servicesLoading={servicesLoading}
        totalProducts={totalProducts}
      />
      <CategoryExplorer
        services={services}
        servicesLoading={servicesLoading}
        language={i18n.language}
      />
      <EditorialShelf products={products} loading={productsLoading} language={i18n.language} />
      <WalletOS services={services} />
      <HowItWorks />
      <CountriesSection />
      <Testimonials />
      <CtaStripe />
      <Footer />
    </div>
  );
}

/* =====================================================================
 * Keyframes (single injection)
 * =================================================================== */

function KeyframesStyle() {
  return (
    <style>{`
      @keyframes tcMarquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
      @keyframes tcMarqueeM { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
      @keyframes tcSlideUp { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: none; } }
      @keyframes tcPulse { 0% { transform: scale(.7); opacity: .55; } 70% { transform: scale(2.4); opacity: 0; } 100% { opacity: 0; } }
    `}</style>
  );
}

/* =====================================================================
 * Order ticker (marquee)
 * =================================================================== */

function OrderTicker() {
  const items = [
    'TC-48-0291 · PixelPlay $50 → delivered in 4s',
    'TC-48-0288 · Pulse 5k followers → processing',
    'TC-48-0285 · US SMS for Loop → code revealed',
    'TC-48-0283 · Mobile top-up +20$ → delivered in 2s',
    'TC-48-0280 · Cinescope+ 30 days → delivered in 6s',
    'TC-48-0277 · QuestVerse $100 → delivered in 3s',
    'TC-48-0275 · TuneVault $25 → delivered in 5s',
    'TC-48-0272 · Vibe geo-followers → drip started',
    'TC-48-0270 · Bill payment $84.50 → confirmed',
  ];
  const row = [...items, ...items, ...items];
  return (
    <div className="relative flex h-8 items-center overflow-hidden border-b border-black/10 bg-primary text-[#100E22] md:h-9">
      <div className="flex whitespace-nowrap" style={{ animation: 'tcMarquee 60s linear infinite' }}>
        {row.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 text-[10.5px] font-semibold md:px-6 md:text-xs"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.4 }}
          >
            <span className="h-1 w-1 rounded-full bg-[#100E22] md:h-1.5 md:w-1.5" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
 * NavBar
 * =================================================================== */

function NavBar({ services, servicesLoading }: { services: ShopServiceItem[]; servicesLoading: boolean }) {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#100E22] text-white">
      <div className="flex items-center gap-3 px-4 py-4 md:gap-10 md:px-8 md:py-5 lg:px-14">
        <Link to="/" className="flex-shrink-0">
          <Wordmark size={20} onDark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-6 text-sm font-semibold lg:flex">
          <Link to="/shop" className="relative pb-1">
            Marketplace
            <span className="absolute -bottom-[22px] left-0 right-0 h-[2px] bg-primary" />
          </Link>
          {servicesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="h-4 w-20 animate-pulse rounded bg-white/10" />
            ))}
          {!servicesLoading &&
            services.slice(0, 5).map((s) => (
              <Link
                key={s._id}
                to={serviceShopPath(s)}
                className="opacity-60 transition hover:opacity-100"
              >
                {localized(s.name, i18n.language, 'Service')}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-semibold md:flex">
            <Icon name="globe" size={14} /> {i18n.language.toUpperCase().slice(0, 2)} · USD
          </div>
          {isAuthenticated ? (
            <Link to="/shop/dashboard" aria-label="Open marketplace">
              {/* Mobile: icon-only */}
              <span className="md:hidden">
                <Btn kind="primary" size="sm" icon="arrowR" aria-label="Open marketplace" />
              </span>
              {/* Tablet+: full label */}
              <span className="hidden md:inline-flex">
                <Btn kind="primary" size="sm" iconRight="arrowR">
                  Open marketplace
                </Btn>
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden md:inline-flex">
                <Btn kind="ghostLight" size="sm">
                  Sign in
                </Btn>
              </Link>
              <Link to="/register">
                <Btn kind="primary" size="sm">
                  Create account
                </Btn>
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white lg:hidden"
            onClick={() => setOpen((x) => !x)}
          >
            <Icon name={open ? 'close' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#1a1830] px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm font-semibold">
            <Link to="/shop" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/5">
              Marketplace
            </Link>
            {services.slice(0, 6).map((s) => (
              <Link
                key={s._id}
                to={serviceShopPath(s)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white"
              >
                {localized(s.name, i18n.language, 'Service')}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/5">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

/* =====================================================================
 * Hero
 * =================================================================== */

function Hero({
  services,
  servicesLoading,
  totalProducts,
}: {
  services: ShopServiceItem[];
  servicesLoading: boolean;
  totalProducts: number;
}) {
  const totalServices = services.length;
  const totalProductsLabel = totalProducts > 0 ? `${formatCompact(totalProducts)}` : '14.8k';

  const stats = [
    { v: totalProductsLabel, l: 'live products', sub: `across ${totalServices || 7} services` },
    { v: '6 sec', l: 'median delivery', sub: '92% are instant' },
    { v: '38k', l: 'reviews', sub: 'avg 4.9 / 5' },
    { v: '120+', l: 'countries served', sub: 'multilingual' },
  ];

  return (
    <section className="bg-[#100E22] px-4 pb-12 pt-7 text-white md:px-8 md:pb-14 lg:px-14 lg:pb-16 lg:pt-9">
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        {/* LEFT */}
        <div className="flex flex-col">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary md:mb-7">
            <Dot color="#fdf001" pulse />
            <span
              className="text-[10px] tracking-wide md:text-[11px]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              NOW LIVE · 2,418 ORDERS TODAY
            </span>
          </div>

          <h1
            className="m-0 mb-5 text-[44px] leading-[0.92] sm:text-[52px] md:text-[80px] md:leading-[0.88] lg:text-[120px] xl:text-[132px]"
            style={{ fontWeight: 900, letterSpacing: '-0.055em' }}
          >
            Digital,
            <br />
            {/* Mobile / tablet stacked layout */}
            <span className="inline-flex flex-col items-start gap-2 md:hidden">
              <span className="italic text-primary" style={{ fontWeight: 800 }}>
                delivered
              </span>
              <span className="text-white">
                in <RotatingBadge />
              </span>
              <span className="text-white">seconds.</span>
            </span>
            {/* Desktop inline layout */}
            <span className="hidden md:inline-flex md:flex-wrap md:items-baseline md:gap-4 lg:gap-5">
              <span className="italic text-primary" style={{ fontWeight: 800 }}>
                delivered
              </span>
              <RotatingBadge />
            </span>
            <br className="hidden md:block" />
            <span className="hidden md:inline">in seconds.</span>
          </h1>

          <p
            className="m-0 mb-6 max-w-[520px] text-base font-medium text-white/60 md:text-lg lg:text-[19px]"
            style={{ lineHeight: 1.45 }}
          >
            One wallet. Seven services. Thousands of products. Gift cards, gaming credits,
            social-growth, SMS verification numbers, mobile top-up, bills.
          </p>

          {/* Search */}
          <div className="flex h-12 max-w-[600px] items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-2xl md:h-[68px] md:gap-2 md:p-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 md:gap-3 md:px-4">
              <Icon name="search" size={18} className="flex-shrink-0 text-gray-500" />
              <input
                placeholder="Search products…"
                className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-[#111827] outline-none md:text-base"
                style={{ fontFamily: 'Zain' }}
              />
            </div>
            <Link to="/shop/dashboard" aria-label="Browse marketplace" className="contents">
              {/* Compact icon-only on mobile */}
              <span className="md:hidden">
                <Btn size="sm" kind="dark" icon="arrowR" aria-label="Browse" />
              </span>
              {/* Full button on tablet+ */}
              <span className="hidden md:inline-flex">
                <Btn size="lg" kind="dark" iconRight="arrowR">
                  Browse
                </Btn>
              </span>
            </Link>
          </div>

          {/* Chips */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {SEARCH_CHIPS.map((c) => (
              <span
                key={c}
                className="cursor-pointer rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/60 hover:bg-white/10"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-2 gap-y-5 border-t border-white/10 pt-5 md:grid-cols-4 md:gap-y-0 md:pt-6">
            {stats.map((s, i) => (
              <div
                key={s.l}
                className={clsx(
                  'pr-3 md:pr-5',
                  i > 0 && 'md:border-l md:border-white/10 md:pl-5',
                )}
              >
                <div
                  className="text-2xl md:text-[28px] lg:text-[34px]"
                  style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  {s.v}
                </div>
                <div className="mt-1.5 text-[11px] font-semibold md:text-[13px]">{s.l}</div>
                <div className="mt-0.5 text-[10px] text-white/55 md:text-[11px]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Bento */}
        <BentoRight services={services} servicesLoading={servicesLoading} />
      </div>
    </section>
  );
}

function RotatingBadge() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % ROTATING_WORDS.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-2.5 py-0.5 text-[#100E22] md:rounded-2xl md:px-4 md:py-1.5"
      style={{
        transform: 'rotate(-2deg)',
        fontWeight: 900,
        boxShadow: '0 8px 22px rgba(253,240,1,.35)',
      }}
    >
      <span
        key={i}
        className="block text-[34px] leading-none md:text-[56px] lg:text-[64px]"
        style={{ letterSpacing: '-0.04em', animation: 'tcSlideUp .35s ease both' }}
      >
        {ROTATING_WORDS[i]}
      </span>
    </span>
  );
}

/* =====================================================================
 * Bento right (hero side panel)
 * =================================================================== */

function BentoRight({
  services,
  servicesLoading,
}: {
  services: ShopServiceItem[];
  servicesLoading: boolean;
}) {
  const featuredService = services[0];

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
      {/* Wallet preview — spans 2 cols on sm+ */}
      <div className="relative col-span-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0a1f] p-5 text-white sm:col-span-2">
        <svg
          viewBox="0 0 400 200"
          className="pointer-events-none absolute -right-10 -top-8 w-[300px] opacity-[0.1]"
        >
          <circle cx="200" cy="100" r="90" stroke="#fdf001" strokeWidth="30" fill="none" />
          <circle cx="200" cy="100" r="40" stroke="#fdf001" strokeWidth="14" fill="none" />
        </svg>
        <div className="relative flex items-start justify-between">
          <div>
            <div
              className="text-[10px] text-white/50"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
            >
              WALLET BALANCE
            </div>
            <div
              className="mt-1 text-[42px] leading-none md:text-[48px] lg:text-[52px]"
              style={{ fontWeight: 900, letterSpacing: '-0.04em' }}
            >
              $216<span className="text-2xl text-white/50">.00</span>
            </div>
            <div className="mt-1.5 text-[11px] text-white/55">+$16 weekend bonus applied</div>
          </div>
          <Badge kind="primary">+8% promo</Badge>
        </div>
        <div className="relative mt-4 flex gap-1.5">
          {[60, 30, 10].map((pct, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{ flex: pct, background: ['#fdf001', '#7B5BFF', '#06D6A0'][i] }}
            />
          ))}
        </div>
        <div className="relative mt-2.5 flex flex-wrap gap-3 text-[11px] text-white/55">
          <span><span style={{ color: '#fdf001' }}>●</span> Gift cards $129</span>
          <span><span style={{ color: '#7B5BFF' }}>●</span> SMS $65</span>
          <span><span style={{ color: '#06D6A0' }}>●</span> Top-up $22</span>
        </div>
      </div>

      {/* SMS chip */}
      <div className="rounded-2xl border border-white/10 bg-[#1a1830] p-4 text-white">
        <div className="mb-3 flex items-center gap-2.5">
          <ServiceTile glyph="C" color="#0088CC" size={32} />
          <div>
            <div className="text-[13px] font-bold">Chime · 🇺🇸</div>
            <div
              className="text-[10px] text-white/60"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              +1 (415) 555-0182
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.04] p-2.5">
          <div
            className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-white/55"
          >
            Code arrived
          </div>
          <div
            className="text-xl text-white md:text-2xl"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
              letterSpacing: '0.18em',
            }}
          >
            483 102
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-green-400">● live · 03:42 left</span>
          <Icon name="copy" size={14} className="text-white/55" />
        </div>
      </div>

      {/* Featured product tile */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#1a1830] p-3">
        <ProductTile name="QuestVerse" sub="MMO credits" denom="$100" size="md" />
        <div className="px-1">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-extrabold text-white">QuestVerse</div>
            <Badge kind="success" dot>
              in stock
            </Badge>
          </div>
          <div className="mt-0.5 text-[11px] text-white/55">$10 — $500 · 23 reviews</div>
        </div>
      </div>

      {/* Top-up tile — spans full width on sm+ */}
      <div className="col-span-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1830] p-4 text-white sm:col-span-2">
        <div
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl text-white md:h-14 md:w-14"
          style={{ background: '#EF476F' }}
        >
          <Icon name="phone" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-semibold uppercase tracking-wide text-white/55"
          >
            Top-up · +20 EGP
          </div>
          <div className="mt-0.5 truncate text-base font-extrabold md:text-[17px]">
            +20 1024 8821 0091
          </div>
          <div
            className="mt-0.5 text-[10px] text-white/55 md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            delivered in 2.4s — receipt #TC-48-0283
          </div>
        </div>
        <div
          className="hidden flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold sm:block"
          style={{ background: 'rgba(22,163,74,.18)', color: '#22C55E' }}
        >
          ✓ delivered
        </div>
      </div>

      {/* Helper: when services are loaded, show a tiny stat block */}
      {!servicesLoading && featuredService && (
        <div className="hidden text-[10px] text-white/40 sm:col-span-2 sm:block">
          {services.length} services connected · last sync just now
        </div>
      )}
    </div>
  );
}

/* =====================================================================
 * Category explorer
 * =================================================================== */

function CategoryExplorer({
  services,
  servicesLoading,
  language,
}: {
  services: ShopServiceItem[];
  servicesLoading: boolean;
  language: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const effectiveId = activeId ?? services[0]?._id ?? null;

  const { data: productsResponse, isLoading: productsLoading } = useShopProducts(
    effectiveId ? { page: 1, limit: 6, serviceId: effectiveId } : { page: 1, limit: 6 },
    { enabled: !!effectiveId },
  );

  const items = productsResponse?.data ?? [];
  const activeService = services.find((s) => s._id === effectiveId);

  return (
    <section className="bg-[#100E22] px-4 pb-16 text-white md:px-8 lg:px-14">
      {/* Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
        {servicesLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-10 w-32 flex-shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
          ))}
        {!servicesLoading &&
          services.map((s, i) => {
            const active = s._id === effectiveId;
            const color = serviceColor(i);
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => setActiveId(s._id)}
                className={clsx(
                  'flex flex-shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-sm font-bold transition',
                  active
                    ? 'border-primary bg-primary text-[#100E22]'
                    : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]',
                )}
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white"
                  style={{ background: color }}
                >
                  {serviceGlyph(s, language)}
                </span>
                <span className="whitespace-nowrap">{localized(s.name, language, 'Service')}</span>
                <span
                  className={clsx(
                    'whitespace-nowrap text-[11px] font-semibold',
                    active ? 'text-[#100E22]/60' : 'text-white/55',
                  )}
                >
                  {s.productCount}+ products
                </span>
              </button>
            );
          })}
      </div>

      {/* Active category panel */}
      <div className="mt-5 grid gap-6 rounded-3xl border border-white/[0.06] bg-[#1a1830] p-5 md:grid-cols-[1fr_1.4fr] md:gap-9 md:p-8 lg:p-10">
        <div>
          {activeService ? (
            <>
              <div
                className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl text-2xl font-extrabold text-white md:h-14 md:w-14 md:text-[28px]"
                style={{ background: serviceColor(services.indexOf(activeService)) }}
              >
                {serviceGlyph(activeService, language)}
              </div>
              <h3
                className="m-0 text-3xl md:text-4xl lg:text-[56px]"
                style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
              >
                {localized(activeService.name, language, 'Service')}
              </h3>
              <div className="mt-1.5 text-sm font-semibold text-white/55 md:text-base">
                {activeService.productCount}+ products available
              </div>
              <p className="mt-4 max-w-[380px] text-sm text-white/65 md:text-base" style={{ lineHeight: 1.55 }}>
                {localized(activeService.description, language) ||
                  'Browse a curated selection — multiple denominations, regional editions, instant delivery from one wallet.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to={serviceShopPath(activeService)}>
                  <Btn kind="primary" iconRight="arrowR">
                    Browse {localized(activeService.name, language, 'service').toLowerCase()}
                  </Btn>
                </Link>
                <Btn kind="outlineLight">How it works</Btn>
              </div>
            </>
          ) : (
            <div className="text-white/55">Loading services…</div>
          )}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {(productsLoading || servicesLoading) &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[130px] animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          {!productsLoading && items.length === 0 && !productsLoading && !servicesLoading && (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/55">
              No products in this category yet.
            </div>
          )}
          {!productsLoading &&
            items.slice(0, 6).map((p) => (
              <Link
                key={p._id}
                to={`/shop/product/${p._id}`}
                className="block rounded-xl border border-white/[0.05] bg-white/[0.03] p-2 transition hover:-translate-y-0.5"
              >
                <ProductTile
                  name={localized(p.name, language, 'Product')}
                  sub={categoryName(p, language) || p.quantityMode}
                  denom={productQuantityLabel(p)}
                  size="sm"
                />
                <div className="flex items-center justify-between px-1 pb-0.5 pt-1.5">
                  <div className="text-[10px] text-white/55">{p.quantityMode}</div>
                  <div
                    className={clsx(
                      'text-[10px] font-bold',
                      p.stock && p.quantityAvailable ? 'text-green-400' : 'text-red-400',
                    )}
                  >
                    ● {p.stock && p.quantityAvailable ? 'in stock' : 'out'}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * Editorial shelf
 * =================================================================== */

function EditorialShelf({
  products,
  loading,
  language,
}: {
  products: ShopProductItem[];
  loading: boolean;
  language: string;
}) {
  const picks = products.slice(0, 2);

  return (
    <section className="bg-white px-4 py-14 md:px-8 md:py-20 lg:px-14 lg:py-24">
      <div className="mb-6 flex items-end justify-between md:mb-8">
        <div>
          <div
            className="mb-2 text-[10px] font-bold uppercase text-gray-500 md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
          >
            EDITORIAL · WEEKLY PICKS
          </div>
          <h2
            className="m-0 text-3xl md:text-5xl lg:text-[64px]"
            style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            This week
            <br />
            on the shelf.
          </h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <Btn kind="outline" size="sm" icon="chevronL" aria-label="Previous" />
          <Btn kind="dark" size="sm" icon="chevronR" aria-label="Next" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-5">
        {/* Big editorial card */}
        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-7 lg:col-span-1 lg:p-8"
          style={{ minHeight: 360 }}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full opacity-[0.08]"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="pg" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M0 10 L10 0" stroke="#fdf001" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#pg)" />
          </svg>
          <div className="relative">
            <Badge kind="primary">FEATURE 01</Badge>
            <div
              className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-[52px]"
              style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
            >
              The new
              <br />
              gaming pass
              <br />
              economy.
            </div>
            <p
              className="mt-3 max-w-[360px] text-[13px] text-white/70 md:mt-4 md:text-[15px]"
              style={{ lineHeight: 1.5 }}
            >
              How instant gift-card delivery is replacing physical retail for cloud gaming, MMO
              credits, and console subscriptions.
            </p>
          </div>
          <div className="relative mt-5 flex items-center gap-3 border-t border-white/10 pt-4 md:mt-6 md:gap-4 md:pt-5">
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] text-white/50 md:text-[11px]"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.5 }}
              >
                STARTING AT
              </div>
              <div
                className="text-xl md:text-3xl"
                style={{ fontWeight: 900, letterSpacing: '-0.03em' }}
              >
                $10.00
              </div>
            </div>
            <Link to="/shop/dashboard" className="contents">
              {/* Mobile: compact button */}
              <span className="md:hidden">
                <Btn kind="primary" iconRight="arrowR" size="sm">
                  Shop
                </Btn>
              </span>
              {/* Tablet+: full button */}
              <span className="hidden md:inline-flex">
                <Btn kind="primary" iconRight="arrowR" size="lg">
                  Shop the feature
                </Btn>
              </span>
            </Link>
          </div>
        </div>

        {/* Two stacked product cards from API */}
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-[360px] animate-pulse rounded-3xl border border-gray-200 bg-gray-50"
            />
          ))}
        {!loading &&
          picks.map((p) => (
            <Link
              key={p._id}
              to={`/shop/product/${p._id}`}
              className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-2xl"
              style={{ minHeight: 360 }}
            >
              <ProductTile
                name={localized(p.name, language, 'Product')}
                sub={categoryName(p, language) || p.quantityMode}
                denom={productQuantityLabel(p)}
                size="md"
              />
              <div className="flex-1">
                <Badge kind="soft" className="mb-3">
                  {(() => {
                    const svc = serviceFromProduct(p);
                    return svc ? localized(svc.name, language) : p.quantityMode;
                  })()}
                </Badge>
                <div
                  className="text-lg md:text-xl"
                  style={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  {localized(p.name, language, 'Product')}
                </div>
                <div className="mt-1 text-[13px] text-gray-500">
                  {categoryName(p, language) || p.fulfillmentType}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3.5">
                <div>
                  <div className="text-[11px] text-gray-500">mode</div>
                  <div className="text-lg" style={{ fontWeight: 800 }}>
                    {productQuantityLabel(p)}
                  </div>
                </div>
                <Btn size="sm" kind="dark">
                  Buy
                </Btn>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}

/* =====================================================================
 * Wallet OS diagram
 * =================================================================== */

function WalletOS({ services }: { services: ShopServiceItem[] }) {
  const { i18n } = useTranslation();
  const orbits = useMemo(() => {
    const list = services.slice(0, 6);
    if (list.length === 0) {
      // fallback skeleton orbits
      return [
        { id: 'a', label: 'Gift cards', color: '#7B5BFF', glyph: 'GC' },
        { id: 'b', label: 'Gaming', color: '#FF6B6B', glyph: '◧' },
        { id: 'c', label: 'SMS', color: '#118AB2', glyph: '✉' },
        { id: 'd', label: 'Top-up', color: '#EF476F', glyph: '☏' },
        { id: 'e', label: 'Bills', color: '#9B5DE5', glyph: '$' },
        { id: 'f', label: 'Social', color: '#FF8E3C', glyph: '#' },
      ];
    }
    return list.map((s, i) => ({
      id: s._id,
      label: localized(s.name, i18n.language, 'Service'),
      color: serviceColor(i),
      glyph: serviceGlyph(s, i18n.language),
    }));
  }, [services, i18n.language]);

  const angles = [-90, -30, 30, 90, 150, 210];

  return (
    <section className="bg-[#F8FAFC] px-4 py-14 md:px-8 md:py-20 lg:px-14 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <div
            className="mb-3 text-[10px] font-bold uppercase text-gray-500 md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
          >
            ONE WALLET · ALL SERVICES
          </div>
          <h2
            className="m-0 text-4xl md:text-5xl lg:text-[64px]"
            style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            Top up
            <br />
            <span
              className="inline-block rounded-xl bg-primary px-3 py-0 text-[#100E22]"
              style={{ letterSpacing: '-0.04em' }}
            >
              once.
            </span>
            <br />
            Buy anything.
          </h2>
          <p className="mt-5 max-w-[480px] text-[15px] text-gray-500 md:text-lg" style={{ lineHeight: 1.5 }}>
            Card, bank transfer, redemption code, or crypto — all credited to a single balance.
            Refunds return to the same place. No surprise charges, no per-product fees.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            {TRUST_FEATURES.map((f) => (
              <div key={f.t} className="flex items-center gap-3.5">
                <div
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#100E22] text-primary"
                >
                  <Icon name={f.i} size={20} />
                </div>
                <div>
                  <div className="text-base font-extrabold" style={{ letterSpacing: '-0.01em' }}>
                    {f.t}
                  </div>
                  <div className="text-[13px] text-gray-500">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagram — square so percentages map cleanly */}
        <div
          className="relative mx-auto w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[520px]"
          style={{ aspectRatio: '1 / 1' }}
        >
          {/* Concentric SVG rings */}
          <svg
            viewBox="-260 -260 520 520"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="0" cy="0" r="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <circle cx="0" cy="0" r="220" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.5" />
            {orbits.map((o, i) => {
              const a = angles[i] ?? 0;
              const r = 160;
              const x = Math.cos((a * Math.PI) / 180) * r;
              const y = Math.sin((a * Math.PI) / 180) * r;
              return <line key={o.id} x1="0" y1="0" x2={x} y2={y} stroke={o.color} strokeWidth="1" opacity="0.25" />;
            })}
          </svg>

          {/* Center */}
          <div
            className="absolute left-1/2 top-1/2 z-[2] flex aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[24px] border-2 border-primary bg-[#100E22] text-white"
            style={{ boxShadow: '0 30px 60px rgba(0,0,0,.2)' }}
          >
            <Icon name="wallet" size={26} className="mb-1.5 text-primary" />
            <div
              className="text-[9px] text-white/60 md:text-[10px]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
            >
              WALLET
            </div>
            <div
              className="mt-0.5 text-xl md:text-2xl lg:text-3xl"
              style={{ fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              $216
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-primary md:text-[11px]">
              +8% bonus active
            </div>
          </div>

          {/* Orbit chips — positioned in % so they always sit inside the container */}
          {orbits.map((o, i) => {
            const a = angles[i] ?? 0;
            const cx = 50 + Math.cos((a * Math.PI) / 180) * 38;
            const cy = 50 + Math.sin((a * Math.PI) / 180) * 38;
            return (
              <div
                key={o.id}
                className="absolute z-[1] flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg md:px-3 md:py-2"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                  maxWidth: '44%',
                }}
              >
                <div
                  className="grid h-5 w-5 flex-shrink-0 place-items-center rounded text-[10px] text-white md:h-6 md:w-6 md:text-[11px]"
                  style={{ background: o.color, fontWeight: 800 }}
                >
                  {o.glyph}
                </div>
                <span className="truncate text-[11px] font-bold md:text-[13px]">{o.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * How it works
 * =================================================================== */

function HowItWorks() {
  return (
    <section className="bg-white px-4 py-14 md:px-8 md:py-20 lg:px-14 lg:py-24">
      <div className="mb-9 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className="mb-3 text-[10px] font-bold uppercase text-gray-500 md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
          >
            HOW IT WORKS · ~60 SECONDS END-TO-END
          </div>
          <h2
            className="m-0 text-3xl md:text-4xl lg:text-[56px]"
            style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            Four steps. No surprises.
          </h2>
        </div>
        <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-[#100E22] px-4 py-3 text-white">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span
            className="text-[11px] md:text-xs"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.4 }}
          >
            92% of orders delivered &lt; 10s
          </span>
        </div>
      </div>

      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {/* connecting line (desktop) */}
        <div
          aria-hidden
          className="absolute top-8 left-16 right-16 hidden h-[2px] lg:block"
          style={{
            background: 'repeating-linear-gradient(90deg, #D1D5DB 0 6px, transparent 6px 14px)',
          }}
        />
        {HOW_STEPS.map((s, i) => (
          <div
            key={s.n}
            className={clsx(
              'relative',
              i === 0 && 'lg:pr-6',
              i > 0 && i < HOW_STEPS.length - 1 && 'lg:px-6',
              i === HOW_STEPS.length - 1 && 'lg:pl-6',
            )}
          >
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-[#100E22] md:h-16 md:w-16"
              style={{ boxShadow: '0 0 0 8px #fff', position: 'relative', zIndex: 1 }}
            >
              <Icon name={s.i} size={26} />
            </div>
            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[11px] font-bold text-gray-500"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
                >
                  {s.n}
                </span>
                <Badge kind="soft" className="!normal-case">
                  {s.time}
                </Badge>
              </div>
              <div className="mt-1.5 text-xl md:text-2xl" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                {s.t}
              </div>
              <p className="mt-2 max-w-[240px] text-sm text-gray-500" style={{ lineHeight: 1.5 }}>
                {s.d}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
 * Countries
 * =================================================================== */

function CountriesSection() {
  return (
    <section className="bg-white px-4 pb-14 md:px-8 md:pb-20 lg:px-14">
      <div className="relative overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-10 lg:p-12">
        <svg
          viewBox="0 0 800 200"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 40 }, (_, x) =>
            Array.from({ length: 10 }, (_, y) => (
              <circle key={`${x}-${y}`} cx={x * 20 + 10} cy={y * 20 + 10} r="1.2" fill="#fff" />
            )),
          )}
        </svg>
        <div className="relative grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center lg:gap-14">
          <div>
            <div
              className="text-[10px] font-bold text-primary md:text-[11px]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
            >
              GLOBAL · 120 COUNTRIES
            </div>
            <h2
              className="m-0 mt-3 text-3xl md:text-4xl lg:text-5xl"
              style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
            >
              Built for
              <br />
              any market.
            </h2>
            <p
              className="mt-4 max-w-[320px] text-sm text-white/65 md:text-base"
              style={{ lineHeight: 1.5 }}
            >
              Live-priced SMS numbers, regional gift cards, local mobile operators, and bill
              payment for utilities in 60+ countries.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3"
              >
                <span className="text-xl md:text-[22px]">{c.flag}</span>
                <div className="min-w-0">
                  <div
                    className="truncate text-[12px] font-bold md:text-[13px]"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {c.name}
                  </div>
                  <div
                    className="text-[10px] text-white/50"
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    {c.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * Testimonials
 * =================================================================== */

function Testimonials() {
  return (
    <section className="bg-white px-4 pb-16 md:px-8 md:pb-24 lg:px-14">
      <div className="mb-7 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className="mb-3 text-[10px] font-bold uppercase text-gray-500 md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
          >
            REAL CUSTOMERS · 38K REVIEWS
          </div>
          <h2
            className="m-0 text-3xl md:text-4xl lg:text-[56px]"
            style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            Trust that compounds.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Icon
                key={i}
                name="star"
                size={18}
                className="text-primary"
                style={{ fill: '#fdf001' }}
              />
            ))}
          </div>
          <div className="text-2xl" style={{ fontWeight: 900 }}>
            4.9
          </div>
          <div className="text-[13px] text-gray-500">from 38,401 reviews</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-auto">
        {TESTIMONIALS.map((q, i) => {
          const SPAN_CLASS = [
            'lg:col-span-12',
            'lg:col-span-6',
            'lg:col-span-6',
            'lg:col-span-7',
            'lg:col-span-5',
          ];
          const SM_SPAN_CLASS = [
            'sm:col-span-2',
            'sm:col-span-1',
            'sm:col-span-1',
            'sm:col-span-2',
            'sm:col-span-2',
          ];
          const isDarkCard = i === 0;
          const isPrimaryCard = i === 3;
          const big = i === 0 || i === 3;
          return (
            <div
              key={q.name}
              className={clsx(
                'flex flex-col justify-between rounded-2xl p-6 md:p-7',
                SM_SPAN_CLASS[i],
                SPAN_CLASS[i],
                isDarkCard && 'bg-[#100E22] text-white',
                isPrimaryCard && 'bg-primary text-[#100E22]',
                !isDarkCard && !isPrimaryCard && 'border border-gray-200 bg-white text-[#100E22]',
              )}
              style={{ minHeight: big ? 220 : 200 }}
            >
              <div>
                <div className="mb-3.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon
                      key={s}
                      name="star"
                      size={13}
                      className={isPrimaryCard ? 'text-[#100E22]' : 'text-primary'}
                      style={{ fill: isPrimaryCard ? '#100E22' : '#fdf001' }}
                    />
                  ))}
                </div>
                <div
                  className={clsx(
                    big ? 'text-lg md:text-xl' : 'text-[15px] md:text-base',
                  )}
                  style={{
                    fontWeight: big ? 800 : 600,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  “{q.text}”
                </div>
              </div>
              <div
                className={clsx(
                  'mt-5 flex items-center gap-3 border-t pt-4',
                  isDarkCard && 'border-white/10',
                  isPrimaryCard && 'border-black/10',
                  !isDarkCard && !isPrimaryCard && 'border-gray-200',
                )}
              >
                <div
                  className={clsx(
                    'grid h-9 w-9 place-items-center rounded-full text-sm',
                    isDarkCard
                      ? 'bg-primary text-[#100E22]'
                      : isPrimaryCard
                        ? 'bg-[#100E22] text-white'
                        : 'bg-[#100E22] text-white',
                  )}
                  style={{ fontWeight: 800 }}
                >
                  {q.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold">{q.name}</div>
                  <div className="text-xs opacity-70">{q.role}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =====================================================================
 * CTA Stripe
 * =================================================================== */

function CtaStripe() {
  const { isAuthenticated } = useAuthStore();
  return (
    <section className="px-4 pb-14 md:px-8 md:pb-20 lg:px-14 lg:pb-24">
      <div className="relative grid gap-8 overflow-hidden rounded-3xl bg-primary p-8 text-[#100E22] md:gap-10 md:p-12 lg:grid-cols-[2fr_1fr] lg:items-center lg:p-16">
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -right-6 -top-6 w-[220px] opacity-[0.15] md:w-[280px]"
        >
          <circle cx="50" cy="50" r="40" stroke="#100E22" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="50" r="28" stroke="#100E22" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="50" r="16" stroke="#100E22" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="relative">
          <div
            className="text-[11px] font-bold md:text-xs"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: 0.6 }}
          >
            GET STARTED · 30 SECONDS
          </div>
          <h2
            className="m-0 mt-3 text-4xl md:text-6xl lg:text-[80px] xl:text-[88px]"
            style={{ fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.9 }}
          >
            Start your
            <br />
            wallet today.
          </h2>
          <p
            className="mt-4 max-w-[480px] text-base md:text-lg"
            style={{ lineHeight: 1.45, color: 'rgba(16,14,34,.7)' }}
          >
            $5 free credit on your first top-up. No card required to sign up. Refunds always go back
            to the same balance.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/shop/dashboard">
                <Btn kind="dark" size="xl" iconRight="arrowR">
                  Open marketplace
                </Btn>
              </Link>
            ) : (
              <Link to="/register">
                <Btn kind="dark" size="xl" iconRight="arrowR">
                  Create account
                </Btn>
              </Link>
            )}
            <Link to="/shop/dashboard">
              <Btn kind="ghost" size="xl">
                Browse marketplace
              </Btn>
            </Link>
          </div>
        </div>
        <div className="relative flex flex-col gap-2.5">
          {CTA_PERKS.map((t) => (
            <div
              key={t}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(0,0,0,.06)' }}
            >
              <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[#100E22] text-primary">
                <Icon name="check" size={14} />
              </div>
              <div className="text-sm font-bold md:text-[15px]">{t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * Footer
 * =================================================================== */

function Footer() {
  return (
    <footer className="bg-[#080718] px-4 pb-8 pt-14 text-white/70 md:px-8 md:pt-16 lg:px-14">
      <div className="mb-10 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <Wordmark size={20} onDark />
          <p className="mt-4 max-w-[300px] text-sm" style={{ lineHeight: 1.6 }}>
            A multilingual digital-products marketplace. Wallet-first, mobile-first, instantly
            delivered.
          </p>
          <div className="mt-5 flex gap-2.5">
            {['P', 'L', 'V', 'R'].map((p) => (
              <div
                key={p}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-sm text-white"
                style={{ fontWeight: 800 }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        {FOOTER_COLS.map((col) => (
          <div key={col.t}>
            <div
              className="mb-4 text-xs font-extrabold uppercase text-white"
              style={{ letterSpacing: 0.6 }}
            >
              {col.t}
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px]">
              {col.l.map((x) => (
                <li key={x}>
                  <a className="cursor-pointer hover:text-white">{x}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-xs md:flex-row md:items-center md:justify-between">
        <div>© 2026 tafa3olcard. Built for the world&apos;s digital storefronts.</div>
        <div className="flex flex-wrap gap-4">
          <span>🇸🇦 العربية</span>
          <span>🇬🇧 English</span>
          <span>🇫🇷 Français</span>
          <span>🇹🇷 Türkçe</span>
        </div>
      </div>
    </footer>
  );
}

/* =====================================================================
 * helpers
 * =================================================================== */

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}
