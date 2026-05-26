export type GiftCard = {
  id: string;
  name: string;
  sub: string;
  denoms: number[];
  category: 'Gaming' | 'Streaming' | 'Music' | 'Books';
};

export type SmmPlatform = {
  id: string;
  name: string;
  glyph: string;
  color: string;
};

export type SmmServiceType =
  | 'default'
  | 'package'
  | 'custom_comments'
  | 'subscriptions';

export type SmmService = {
  id: string;
  plat: string;
  name: string;
  min: number;
  max: number;
  rate: number;
  refill: boolean;
  cancel: boolean;
  dripfeed?: boolean;
  type: SmmServiceType;
};

export type SmsApp = {
  id: string;
  name: string;
  glyph: string;
  color: string;
  price: number;
  avail: number;
};

export type Country = {
  code: string;
  name: string;
  flag: string;
  mult: number;
};

export const GIFT_CARDS: GiftCard[] = [
  { id: 'pixelplay', name: 'PixelPlay Store', sub: 'Console & PC games', denoms: [10, 25, 50, 100, 200], category: 'Gaming' },
  { id: 'arcadekey', name: 'ArcadeKey', sub: 'Indie marketplace', denoms: [5, 10, 25, 50], category: 'Gaming' },
  { id: 'cinescope', name: 'Cinescope+', sub: 'Films & series', denoms: [15, 30, 60], category: 'Streaming' },
  { id: 'tunevault', name: 'TuneVault', sub: 'Music streaming', denoms: [10, 30, 60], category: 'Music' },
  { id: 'orbital', name: 'OrbitOS Live', sub: 'Console subscriptions', denoms: [25, 50, 100], category: 'Gaming' },
  { id: 'readstack', name: 'ReadStack', sub: 'E-books & audio', denoms: [10, 25, 50], category: 'Books' },
  { id: 'flickplay', name: 'FlickPlay', sub: 'Mobile entertainment', denoms: [5, 10, 25], category: 'Streaming' },
  { id: 'boltdrive', name: 'BoltDrive Pass', sub: 'Cloud gaming', denoms: [15, 30, 60], category: 'Gaming' },
  { id: 'questverse', name: 'QuestVerse', sub: 'MMO credits', denoms: [10, 25, 100, 500], category: 'Gaming' },
  { id: 'novacoin', name: 'NovaCoin', sub: 'In-game currency', denoms: [10, 25, 50, 100], category: 'Gaming' },
  { id: 'storybook', name: 'Storybook+', sub: 'Audio fiction', denoms: [15, 30], category: 'Books' },
  { id: 'beatbox', name: 'BeatBox FM', sub: 'Hi-fi music', denoms: [10, 25], category: 'Music' },
];

export const SMM_PLATFORMS: Record<string, SmmPlatform> = {
  pulse: { id: 'pulse', name: 'Pulse', glyph: 'P', color: '#1DA1F2' },
  loop: { id: 'loop', name: 'Loop', glyph: 'L', color: '#E1306C' },
  vibe: { id: 'vibe', name: 'Vibe', glyph: 'V', color: '#000000' },
  resonate: { id: 'resonate', name: 'Resonate', glyph: 'R', color: '#FF0000' },
  chime: { id: 'chime', name: 'Chime', glyph: 'C', color: '#0088CC' },
  flick: { id: 'flick', name: 'Flick', glyph: 'F', color: '#FFC107' },
};

export const SMM_SERVICES: SmmService[] = [
  { id: 'p1', plat: 'pulse', name: 'Pulse Followers — Real Active', min: 100, max: 50000, rate: 0.85, refill: true, cancel: true, type: 'default' },
  { id: 'p2', plat: 'pulse', name: 'Pulse Likes — Worldwide', min: 50, max: 100000, rate: 0.30, refill: true, cancel: false, type: 'default' },
  { id: 'p3', plat: 'pulse', name: 'Pulse Custom Comments', min: 10, max: 1000, rate: 0.95, refill: false, cancel: true, type: 'custom_comments' },
  { id: 'l1', plat: 'loop', name: 'Loop Followers — Premium HQ', min: 100, max: 100000, rate: 1.20, refill: true, cancel: true, type: 'default', dripfeed: true },
  { id: 'l2', plat: 'loop', name: 'Loop Story Views — Instant', min: 100, max: 50000, rate: 0.18, refill: false, cancel: false, type: 'default' },
  { id: 'l3', plat: 'loop', name: 'Loop Reels Plays', min: 1000, max: 1000000, rate: 0.05, refill: true, cancel: false, type: 'default' },
  { id: 'v1', plat: 'vibe', name: 'Vibe Followers — Geo Targeted', min: 100, max: 50000, rate: 1.45, refill: true, cancel: true, type: 'default' },
  { id: 'v2', plat: 'vibe', name: 'Vibe Video Views', min: 500, max: 1000000, rate: 0.08, refill: false, cancel: false, type: 'default' },
  { id: 'r1', plat: 'resonate', name: 'Resonate Subscribers', min: 50, max: 10000, rate: 4.50, refill: true, cancel: true, type: 'subscriptions' },
  { id: 'r2', plat: 'resonate', name: 'Resonate Watch Hours', min: 1000, max: 4000, rate: 18, refill: true, cancel: false, type: 'default' },
  { id: 'c1', plat: 'chime', name: 'Chime Members — Group', min: 100, max: 20000, rate: 0.75, refill: true, cancel: true, type: 'default' },
  { id: 'c2', plat: 'chime', name: 'Chime Channel Views', min: 100, max: 50000, rate: 0.15, refill: false, cancel: false, type: 'default' },
];

export const SMS_APPS: SmsApp[] = [
  { id: 'chime', name: 'Chime', glyph: 'C', color: '#0088CC', price: 0.18, avail: 124 },
  { id: 'ringly', name: 'Ringly', glyph: 'R', color: '#25D366', price: 0.32, avail: 87 },
  { id: 'authnet', name: 'AuthNet', glyph: 'A', color: '#4285F4', price: 0.55, avail: 41 },
  { id: 'pulse', name: 'Pulse', glyph: 'P', color: '#1DA1F2', price: 0.25, avail: 19 },
  { id: 'loop', name: 'Loop', glyph: 'L', color: '#E1306C', price: 0.40, avail: 56 },
  { id: 'connex', name: 'Connex', glyph: 'X', color: '#0866FF', price: 0.30, avail: 92 },
  { id: 'shoplet', name: 'Shoplet', glyph: 'S', color: '#FF6900', price: 0.22, avail: 78 },
  { id: 'rideon', name: 'RideOn', glyph: 'O', color: '#000000', price: 0.45, avail: 12 },
];

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', mult: 1.0 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', mult: 1.1 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', mult: 0.95 },
  { code: 'FR', name: 'France', flag: '🇫🇷', mult: 1.0 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', mult: 0.6 },
  { code: 'IN', name: 'India', flag: '🇮🇳', mult: 0.4 },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', mult: 0.5 },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', mult: 1.2 },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷', mult: 0.7 },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', mult: 0.6 },
];

export type Operator = {
  id: string;
  name: string;
  tag: string;
  color: string;
  flag: string;
  amounts: number[];
};

export const OPERATORS: Operator[] = [
  { id: 'iam', name: 'Maroc Connect', tag: 'Telecom MA', color: '#E63946', flag: '🇲🇦', amounts: [5, 10, 20, 50, 100, 200] },
  { id: 'mediel', name: 'MediTel', tag: 'Mobile MA', color: '#FF8E3C', flag: '🇲🇦', amounts: [10, 20, 50, 100] },
  { id: 'inwy', name: 'Inwy Mobile', tag: 'Postpaid + data', color: '#9B5DE5', flag: '🇲🇦', amounts: [10, 25, 50, 100, 200] },
  { id: 'orang', name: 'OrangeStream', tag: 'Multi-country', color: '#FF6B00', flag: '🇫🇷', amounts: [5, 10, 20, 50] },
  { id: 'voden', name: 'Voden Telecom', tag: 'GCC', color: '#E60000', flag: '🇦🇪', amounts: [10, 25, 50, 100, 200] },
  { id: 'telekm', name: 'Telkom Net', tag: 'Africa', color: '#0066B3', flag: '🇿🇦', amounts: [5, 10, 25, 50] },
  { id: 'cellz', name: 'Cellzar', tag: 'Prepaid SIMs', color: '#06D6A0', flag: '🇪🇬', amounts: [5, 10, 25, 50, 100] },
  { id: 'globaz', name: 'Globaz', tag: 'Asia · roaming', color: '#7B5BFF', flag: '🇮🇳', amounts: [10, 25, 50, 100] },
];

export type Institution = {
  id: string;
  name: string;
  cat: string;
  color: string;
  icon: string;
  ref: string;
};

export const INSTITUTIONS: Institution[] = [
  { id: 'water', name: 'Casablanca Water Co.', cat: 'Utility · Water', color: '#0EA5E9', icon: 'globe', ref: 'WTR-' },
  { id: 'power', name: 'National Power Grid', cat: 'Utility · Electricity', color: '#F59E0B', icon: 'bolt', ref: 'PWR-' },
  { id: 'internet', name: 'FiberOne ISP', cat: 'Internet', color: '#9B5DE5', icon: 'globe', ref: 'NET-' },
  { id: 'tv', name: 'CableTV Plus', cat: 'Television', color: '#EF476F', icon: 'tv', ref: 'TV-' },
  { id: 'gas', name: 'GreenGas Distribution', cat: 'Utility · Gas', color: '#06D6A0', icon: 'flame', ref: 'GAS-' },
  { id: 'tax', name: 'Municipal Tax Office', cat: 'Government', color: '#7B5BFF', icon: 'receipt', ref: 'TAX-' },
  { id: 'insur', name: 'EastShield Insurance', cat: 'Insurance', color: '#1A1F71', icon: 'shield', ref: 'INS-' },
  { id: 'edu', name: 'AlAtlas University', cat: 'Education', color: '#118AB2', icon: 'star', ref: 'EDU-' },
];

export type PaymentMethod = {
  id: 'card' | 'bank' | 'crypto' | 'code' | 'agents';
  label: string;
  sub: string;
  icon: string;
  color: string;
  instant?: boolean;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', label: 'Card', sub: 'Visa · Master · Mada · 3DS', icon: 'wallet', color: '#1A1F71', instant: true },
  { id: 'bank', label: 'Bank / manual transfer', sub: 'Upload proof · settled in 1-4h', icon: 'receipt', color: '#16A34A' },
  { id: 'crypto', label: 'Crypto', sub: 'USDT (TRC20), BTC, ETH', icon: 'bolt', color: '#F7931A' },
  { id: 'code', label: 'Redeem payment code', sub: 'From an authorized reseller', icon: 'qr', color: '#100E22' },
  { id: 'agents', label: 'Local agent', sub: '120 cities · cash in person', icon: 'globe', color: '#7B5BFF' },
];

export const SERVICES_NAV = [
  { id: 'dashboard', icon: 'home', label: 'Home', to: '/shop/dashboard' },
  { id: 'giftcards', icon: 'gift', label: 'Gift cards', to: '/shop/giftcards' },
  { id: 'gaming', icon: 'game', label: 'Gaming', to: '/shop/gaming' },
  { id: 'streaming', icon: 'tv', label: 'Streaming', to: '/shop/streaming' },
  { id: 'smm', icon: 'heart', label: 'Social services', to: '/shop/smm' },
  { id: 'numbers', icon: 'sms', label: 'SMS numbers', to: '/shop/numbers' },
  { id: 'topup', icon: 'phone', label: 'Mobile top-up', to: '/shop/topup' },
  { id: 'bills', icon: 'receipt', label: 'Bills', to: '/shop/bills' },
] as const;

export const ACCOUNT_NAV = [
  { id: 'orders', icon: 'package', label: 'Orders', to: '/shop/orders' },
  { id: 'wallet', icon: 'wallet', label: 'Wallet', to: '/shop/wallet' },
  { id: 'support', icon: 'receipt', label: 'Support', to: '/shop/support' },
  { id: 'profile', icon: 'user', label: 'Profile', to: '/shop/profile' },
] as const;
