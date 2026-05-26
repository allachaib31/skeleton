import { FinalProductPriceResult } from '@pricing';

export const apiGroups = [
  'TEMPORARY_NUMBER_CODING_SITES',
  'RENEWABLE_NUMBER_CODING_SITES',
  'SOCIAL_MEDIA_SERVICE_PROVIDERS',
  'GIFT_CARD_PROVIDERS',
  'GIFT_CARD_PROVIDERS_2',
  'SPECIAL_PROGRAMMING',
] as const;

export const apiSyncSchedules = [
  '*/1 * * * *',
  '*/5 * * * *',
  '*/10 * * * *',
  '*/20 * * * *',
  '*/30 * * * *',
  '*/40 * * * *',
  '*/50 * * * *',
  '0 * * * *',
  '0 */3 * * *',
  '0 */6 * * *',
  '0 */12 * * *',
  '0 0 * * *',
] as const;

export type ApiGroup = typeof apiGroups[number];
export type ApiSyncSchedule = typeof apiSyncSchedules[number];

export interface SettingsAppAsset {
  uploadId: string;
  publicId: string;
  secureUrl: string;
}

export interface SettingsApp {
  _id?: string;
  key: 'default';
  appName: string;
  logo?: SettingsAppAsset;
  favicon?: SettingsAppAsset;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsAppRequest {
  appName?: string;
  logo?: File | null;
  favicon?: File | null;
}

export interface SettingsCurrency {
  _id: string;
  name: string;
  shortName: string;
  icon?: {
    uploadId: string;
    publicId: string;
    secureUrl: string;
  };
  price: number;
  priceBuy: number;
  isDollar: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsCurrencyRequest {
  name: string;
  shortName: string;
  icon: File;
  price: number;
  priceBuy: number;
  isDollar: boolean;
  isVisible: boolean;
  isDeleted: boolean;
}

export interface UpdateSettingsCurrencyRequest extends Omit<CreateSettingsCurrencyRequest, 'icon'> {
  icon?: File | null;
}

export interface SettingsApi {
  _id: string;
  name: string;
  link: string;
  token: string;
  group: ApiGroup;
  currencyId: Pick<SettingsCurrency, '_id' | 'name' | 'shortName' | 'icon'> | string;
  syncSchedule: ApiSyncSchedule;
  balance?: number;
  balanceCurrency?: string;
  balanceSyncedAt?: string;
  lastSyncAt?: string;
  syncStatus?: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  syncError?: string;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsApiSyncResult {
  apiId: string;
  apiName: string;
  group: ApiGroup;
  providerProducts: number;
  importedProducts: number;
  updated: number;
  unavailable: number;
  missing: number;
  balance?: number;
  balanceCurrency?: string;
}

export interface SettingsApiSyncAllResult {
  results: SettingsApiSyncResult[];
  errors: Array<{ apiId: string; message: string }>;
  total: number;
}

export interface CreateSettingsApiRequest {
  name: string;
  link: string;
  token: string;
  group: ApiGroup;
  currencyId: string;
  syncSchedule: ApiSyncSchedule;
  isVisible: boolean;
  isDeleted: boolean;
}

export interface UpdateSettingsApiRequest extends Omit<CreateSettingsApiRequest, 'token'> {
  token?: string;
}

export const giftCardProvidersActions = ['PROFILE', 'PRODUCTS', 'CONTENT', 'CREATE_ORDER', 'CHECK_ORDERS'] as const;

export type GiftCardProvidersAction = typeof giftCardProvidersActions[number];

export interface GiftCardProvidersSimulationRequest {
  apiId: string;
  action: GiftCardProvidersAction;
  products?: {
    productsId?: string[];
    base?: boolean;
  };
  content?: {
    parentId: number;
  };
  order?: {
    productId: number;
    quantity: number;
    orderUuid?: string;
    params?: Record<string, string>;
  };
  check?: {
    orders: string[];
    byUuid?: boolean;
  };
}

export interface GiftCardProvidersSimulationResult {
  provider: 'GIFT_CARD_PROVIDERS';
  action: GiftCardProvidersAction;
  response: unknown;
  errorInfo?: {
    code: number;
    scope: 'PUBLIC' | 'ORDER';
    key: string;
    retryable: boolean;
  } | null;
}

export const giftCardProviders2Actions = [
  'BALANCE',
  'INSTITUTIONS',
  'SUBMIT_BILL',
  'CHECK_BILL',
  'BULK_CHECK_BILL',
  'AIRTIME_TOPUP',
  'CHECK_AIRTIME',
  'PIN_PRODUCTS',
  'SUBMIT_PIN',
  'CHECK_PIN',
] as const;

export type GiftCardProviders2Action = typeof giftCardProviders2Actions[number];

export interface GiftCardProviders2SimulationRequest {
  apiId: string;
  action: GiftCardProviders2Action;
  transactionId?: string;
  transactionIds?: string[];
  bill?: Record<string, string>;
  airtime?: Record<string, string>;
  pin?: Record<string, string>;
}

export interface GiftCardProviders2SimulationResult {
  provider: 'GIFT_CARD_PROVIDERS_2';
  action: GiftCardProviders2Action;
  response: unknown;
}

export const socialMediaServiceProviderActions = [
  'SERVICES',
  'ADD_ORDER',
  'ORDER_STATUS',
  'MULTIPLE_ORDER_STATUS',
  'CREATE_REFILL',
  'MULTIPLE_REFILL',
  'REFILL_STATUS',
  'MULTIPLE_REFILL_STATUS',
  'CREATE_CANCEL',
  'BALANCE',
] as const;

export type SocialMediaServiceProviderAction = typeof socialMediaServiceProviderActions[number];

export const socialMediaServiceTypes = [
  'Default',
  'Package',
  'SEO',
  'Custom Comments',
  'Mentions with Hashtags',
  'Mentions Custom List',
  'Mentions Hashtag',
  'Mentions User Followers',
  'Mentions Media Likers',
  'Custom Comments Package',
  'Comment Likes',
  'Poll',
  'Comment Replies',
  'Invites from Groups',
  'Subscriptions',
  'Web Traffic',
] as const;

export type SocialMediaServiceType = typeof socialMediaServiceTypes[number];

export interface SocialMediaServiceOrderField {
  name: string;
  required: boolean;
  descriptionKey: string;
}

const socialBaseOrderFields: SocialMediaServiceOrderField[] = [
  { name: 'service', required: true, descriptionKey: 'SERVICE_ID' },
];

const socialLinkField: SocialMediaServiceOrderField = { name: 'link', required: true, descriptionKey: 'LINK' };
const socialQuantityField: SocialMediaServiceOrderField = { name: 'quantity', required: true, descriptionKey: 'QUANTITY' };
const socialRunsField: SocialMediaServiceOrderField = { name: 'runs', required: false, descriptionKey: 'RUNS' };
const socialIntervalField: SocialMediaServiceOrderField = { name: 'interval', required: false, descriptionKey: 'INTERVAL' };

export const socialMediaServiceTypeRequirements: Record<SocialMediaServiceType, SocialMediaServiceOrderField[]> = {
  Default: [...socialBaseOrderFields, socialLinkField, socialQuantityField, socialRunsField, socialIntervalField],
  Package: [...socialBaseOrderFields, socialLinkField],
  SEO: [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'keywords', required: true, descriptionKey: 'KEYWORDS' }],
  'Custom Comments': [...socialBaseOrderFields, socialLinkField, { name: 'comments', required: true, descriptionKey: 'COMMENTS' }],
  'Mentions with Hashtags': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'usernames', required: true, descriptionKey: 'USERNAMES' }, { name: 'hashtags', required: true, descriptionKey: 'HASHTAGS' }],
  'Mentions Custom List': [...socialBaseOrderFields, socialLinkField, { name: 'usernames', required: true, descriptionKey: 'USERNAMES' }],
  'Mentions Hashtag': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'hashtag', required: true, descriptionKey: 'HASHTAG' }],
  'Mentions User Followers': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'username', required: true, descriptionKey: 'USERNAME_FOLLOWERS_SOURCE' }],
  'Mentions Media Likers': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'media', required: true, descriptionKey: 'MEDIA_URL' }],
  'Custom Comments Package': [...socialBaseOrderFields, socialLinkField, { name: 'comments', required: true, descriptionKey: 'COMMENTS' }],
  'Comment Likes': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'username', required: true, descriptionKey: 'COMMENT_OWNER_USERNAME' }],
  Poll: [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'answer_number', required: true, descriptionKey: 'ANSWER_NUMBER' }],
  'Comment Replies': [...socialBaseOrderFields, socialLinkField, { name: 'username', required: true, descriptionKey: 'USERNAME' }, { name: 'comments', required: true, descriptionKey: 'COMMENTS' }],
  'Invites from Groups': [...socialBaseOrderFields, socialLinkField, socialQuantityField, { name: 'groups', required: true, descriptionKey: 'GROUPS' }],
  Subscriptions: [...socialBaseOrderFields, { name: 'username', required: true, descriptionKey: 'USERNAME' }, { name: 'min', required: true, descriptionKey: 'MIN_QUANTITY' }, { name: 'max', required: true, descriptionKey: 'MAX_QUANTITY' }, { name: 'posts', required: false, descriptionKey: 'POSTS' }, { name: 'old_posts', required: false, descriptionKey: 'OLD_POSTS' }, { name: 'delay', required: true, descriptionKey: 'DELAY' }, { name: 'expiry', required: false, descriptionKey: 'EXPIRY' }],
  'Web Traffic': [...socialBaseOrderFields, socialLinkField, socialQuantityField, socialRunsField, socialIntervalField, { name: 'country', required: true, descriptionKey: 'COUNTRY' }, { name: 'device', required: true, descriptionKey: 'DEVICE' }, { name: 'type_of_traffic', required: true, descriptionKey: 'TYPE_OF_TRAFFIC' }, { name: 'google_keyword', required: false, descriptionKey: 'GOOGLE_KEYWORD' }, { name: 'referring_url', required: false, descriptionKey: 'REFERRING_URL' }],
};

export interface SocialMediaServiceProviderSimulationRequest {
  apiId: string;
  action: SocialMediaServiceProviderAction;
  service?: string;
  link?: string;
  quantity?: string;
  order?: string;
  orders?: string[];
  refill?: string;
  refills?: string[];
  params?: Record<string, string>;
}

export interface SocialMediaServiceProviderSimulationResult {
  provider: 'SOCIAL_MEDIA_SERVICE_PROVIDERS';
  action: SocialMediaServiceProviderAction;
  response: unknown;
}

export const temporaryNumberCodingSiteActions = [
  'GET_BALANCE',
  'GET_NUMBER',
  'GET_NUMBER_V2',
  'SET_STATUS',
  'GET_STATUS',
  'GET_STATUS_V2',
  'GET_PRICES',
  'GET_PRICES_V2',
  'GET_PRICES_V3',
  'GET_ACTIVE_ACTIVATIONS',
] as const;

export type TemporaryNumberCodingSiteAction = typeof temporaryNumberCodingSiteActions[number];

export interface TemporaryNumberCodingSitesSimulationRequest {
  apiId: string;
  action: TemporaryNumberCodingSiteAction;
  service?: string;
  country?: string;
  maxPrice?: string;
  providerIds?: string[];
  exceptProviderIds?: string[];
  activationId?: string;
  status?: string;
  extra?: Record<string, string | number | boolean>;
}

export interface TemporaryNumberCodingSitesSimulationResult {
  provider: 'TEMPORARY_NUMBER_CODING_SITES';
  action: TemporaryNumberCodingSiteAction;
  response: unknown;
}

export const paymentGatewayKinds = ['PAYMENT_GATEWAY', 'BANK'] as const;
export const paymentGatewayTaxTypes = ['INCREASE', 'PERCENT'] as const;
export const paymentGatewayInfoTypes = ['TEXT', 'IMAGE', 'QR_CODE'] as const;

export type PaymentGatewayKind = typeof paymentGatewayKinds[number];
export type PaymentGatewayTaxType = typeof paymentGatewayTaxTypes[number];
export type PaymentGatewayInfoType = typeof paymentGatewayInfoTypes[number];

export interface PaymentGatewayLocalizedText {
  en: string;
  fr: string;
  ar: string;
}

export interface PaymentGatewayInfoField {
  label: PaymentGatewayLocalizedText;
  type: PaymentGatewayInfoType;
  value: string;
}

export interface SettingsPaymentGateway {
  _id: string;
  kind: PaymentGatewayKind;
  name: PaymentGatewayLocalizedText;
  link?: string;
  token?: string;
  currencyId?: Pick<SettingsCurrency, '_id' | 'name' | 'shortName' | 'icon'> | string;
  description?: PaymentGatewayLocalizedText;
  infoFields: PaymentGatewayInfoField[];
  taxType: PaymentGatewayTaxType;
  taxValue: number;
  minMoney: number;
  maxMoney: number;
  requiresImage: boolean;
  requiresSerialNumber: boolean;
  image?: {
    uploadId: string;
    publicId: string;
    secureUrl: string;
  };
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsPaymentGatewayRequest {
  kind: PaymentGatewayKind;
  name: PaymentGatewayLocalizedText;
  link?: string;
  token?: string;
  currencyId?: string;
  description?: PaymentGatewayLocalizedText;
  infoFields: PaymentGatewayInfoField[];
  taxType: PaymentGatewayTaxType;
  taxValue: number;
  minMoney: number;
  maxMoney: number;
  requiresImage: boolean;
  requiresSerialNumber: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  image: File;
  infoFiles?: (File | null)[];
}

export interface UpdateSettingsPaymentGatewayRequest extends Omit<CreateSettingsPaymentGatewayRequest, 'image'> {
  image?: File | null;
}

export const paymentCodeStatuses = ['AVAILABLE', 'USED', 'DISABLED', 'EXPIRED'] as const;
export const paymentCodeJournalStatuses = ['SUCCESS', 'FAILED'] as const;
export const paymentCodeJournalReasons = ['REDEEMED', 'NOT_FOUND', 'USED', 'DISABLED', 'EXPIRED', 'DELETED', 'INVALID_FORMAT', 'CLIENT_NOT_FOUND'] as const;

export type PaymentCodeStatus = typeof paymentCodeStatuses[number];
export type PaymentCodeJournalStatus = typeof paymentCodeJournalStatuses[number];
export type PaymentCodeJournalReason = typeof paymentCodeJournalReasons[number];

export interface PaymentCode {
  _id: string;
  codePrefix?: string;
  codeLast4: string;
  value: number;
  currencyId: Pick<SettingsCurrency, '_id' | 'name' | 'shortName' | 'isDollar' | 'price'> | string;
  status: PaymentCodeStatus;
  usedByClientId?: { _id: string; name: string; email: string; username?: string };
  expiresAt?: string;
  notes?: string;
  isDeleted: boolean;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCodeJournal {
  _id: string;
  clientId?: { _id: string; name: string; email: string; username?: string };
  paymentCodeId?: Pick<PaymentCode, '_id' | 'codePrefix' | 'codeLast4' | 'value' | 'status'>;
  codePrefix?: string;
  codeLast4?: string;
  status: PaymentCodeJournalStatus;
  reason: PaymentCodeJournalReason;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaymentCodeFilters {
  page: number;
  limit: number;
  search?: string;
  currencyId?: string;
  status?: PaymentCodeStatus | '';
  isDeleted?: boolean;
}

export interface PaymentCodeJournalFilters {
  page: number;
  limit: number;
  clientId?: string;
  status?: PaymentCodeJournalStatus | '';
  reason?: PaymentCodeJournalReason | '';
}

export interface CreatePaymentCodeRequest {
  code?: string;
  value: number;
  currencyId: string;
  expiresAt?: string;
  notes?: string;
}

export interface GeneratePaymentCodesRequest extends Omit<CreatePaymentCodeRequest, 'code'> {
  prefix?: string;
  count: number;
}

export interface ImportPaymentCodesRequest extends Omit<CreatePaymentCodeRequest, 'code'> {
  codes: string;
}

export interface UpdatePaymentCodeRequest {
  status?: PaymentCodeStatus;
  expiresAt?: string;
  notes?: string;
  isDeleted?: boolean;
}

export interface PricingSimulationRequest {
  clientId: string;
  productId: string;
  quantity: number;
}

export interface PricingSimulationResult extends FinalProductPriceResult {
  client: {
    _id: string;
    name?: string;
    email: string;
    balance: number;
    openCredit: number;
  };
  product: {
    _id: string;
    name: { en: string; fr: string; ar: string };
    costPrice: number;
    costManual?: number;
    fulfillmentType?: 'API' | 'WAREHOUSE' | 'MANUAL';
    forQuantity: number;
  };
  serviceGroup: {
    _id: string;
    name: string;
    pricingType: string;
    value: number;
    negativeValue: number;
  };
  clientSpecialPrice?: unknown;
  promotion?: unknown;
  warehouseCostSource?: 'WAREHOUSE_ITEMS' | 'WAREHOUSE';
}
