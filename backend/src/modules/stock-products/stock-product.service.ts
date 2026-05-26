import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { StockCategory } from '../stock-categories/stock-category.model';
import { LocalizedText, StockService } from '../stock-services/stock-service.model';
import { SettingsApi } from '../settings-apis/settings-api.model';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { StockProductRequirement } from '../stock-product-requirements/stock-product-requirement.model';
import { StockProductGroup } from '../stock-product-groups/stock-product-group.model';
import { GiftCardProvidersProvider } from '../settings-apis/providers/gift-card-providers.provider';
import { GiftCardProviders2Provider } from '../settings-apis/providers/gift-card-providers-2.provider';
import {
  SocialMediaServiceProvidersProvider,
  SocialMediaServiceType,
  socialMediaServiceTypeRequirements,
} from '../settings-apis/providers/social-media-service-providers.provider';
import {
  TemporaryNumberCodingSitesCountryCatalogRow,
  TemporaryNumberCodingSitesProvider,
  TemporaryNumberCodingSitesServiceCatalogRow,
} from '../settings-apis/providers/temporary-number-coding-sites.provider';
import { ProductFulfillmentType, ProductQuantityMode, ProductSpecialPricingType, StockProduct } from './stock-product.model';

interface ProductInput {
  serviceId: string;
  categoryId: string;
  groupId?: string;
  apiId?: string;
  name: LocalizedText;
  serviceNumber?: string;
  costPrice: number;
  costManual?: number;
  forQuantity: number;
  description: LocalizedText;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  speed?: string;
  startTime?: string;
  quantityAvailable: boolean;
  isVisible: boolean;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  stock: boolean;
  fulfillmentType: ProductFulfillmentType;
  requirements?: string[];
  visibleCountryCodes?: string[];
  isDeleted?: boolean;
}

type ProductUpdateInput = Partial<ProductInput>;

interface BulkUpdateInput {
  ids: string[];
  isVisible?: boolean;
  isDeleted?: boolean;
  groupId?: string;
  specialSellPrice?: {
    pricingType: ProductSpecialPricingType;
    value: number;
    negativeValue: number;
    agentRatio: number;
  } | null;
}

export interface ApiProductsPreviewInput {
  apiGroup: 'GIFT_CARD_PROVIDERS' | 'SOCIAL_MEDIA_SERVICE_PROVIDERS' | 'GIFT_CARD_PROVIDERS_2' | 'TEMPORARY_NUMBER_CODING_SITES' | 'RENEWABLE_NUMBER_CODING_SITES';
  apiId: string;
}

interface ApiProductsImportInput extends ApiProductsPreviewInput {
  serviceId: string;
  categoryId?: string;
  productIds: Array<string | number>;
  autoCreateCategories: boolean;
  updateExisting: boolean;
  isVisible: boolean;
  stock: boolean;
}

interface GiftCardProviderProductRow {
  id: string | number;
  name: string;
  price: number;
  params?: string[];
  category_name?: string;
  available?: boolean;
  qty_values?: null | { min?: number | string; max?: number | string } | Array<string | number>;
  product_type?: string;
  parent_id?: string | number;
  base_price?: number;
  category_img?: string;
}

interface SocialMediaProviderProductRow {
  service: string | number;
  name: string;
  type: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  dripfeed?: boolean;
  refill?: boolean;
  cancel?: boolean;
  category?: string;
}

interface GiftCardProvider2PinProductRow {
  id: string | number;
  adi: string;
  aciklama?: string;
  oyun_id: string | number;
  oyun_adi: string;
  fiyat: string | number;
  kupur: string | number;
  oyun_bilgi_id?: string | number;
}

interface NumberCodingCountryRow {
  countryCode: string;
  countryName: string;
  flag: string;
  price?: number;
  count?: number;
}

interface NumberCodingServiceRow {
  serviceCode: string;
  serviceName: string;
  countries: NumberCodingCountryRow[];
  minPrice?: number;
  availableCount: number;
}

interface NumberCodingCatalogs {
  countries: Map<string, TemporaryNumberCodingSitesCountryCatalogRow>;
  services: Map<string, TemporaryNumberCodingSitesServiceCatalogRow>;
}

interface ApiCurrencySnapshot {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  price: number;
  isDollar: boolean;
}

const uploadProductImage = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder: 'stock-products' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveImageUpload = async (actorId: string, file: Express.Multer.File, session: ClientSession) => {
  const uploadResult = await uploadProductImage(file);
  const uploadDoc = new Upload({
    ownerId: actorId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    size: uploadResult.bytes,
    provider: 'cloudinary',
    resourceType: uploadResult.resource_type,
    tags: ['stock-product'],
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

const localized = (value: string): LocalizedText => ({ en: value, fr: value, ar: value });

const normalizeGiftCardProducts = (response: unknown): GiftCardProviderProductRow[] => {
  if (Array.isArray(response)) return response as GiftCardProviderProductRow[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  const candidates = [record.data, record.products, record.result, record.items];
  const array = candidates.find(Array.isArray);
  return (array || []) as GiftCardProviderProductRow[];
};

const getGiftCardQuantityMapping = (product: GiftCardProviderProductRow) => {
  const qtyValues = product.qty_values;
  const productType = product.product_type;

  if (productType === 'amount' && qtyValues && !Array.isArray(qtyValues)) {
    return {
      quantityMode: 'COUNTER' as ProductQuantityMode,
      minQuantity: Number(qtyValues.min ?? 1),
      maxQuantity: Number(qtyValues.max ?? qtyValues.min ?? 1),
      customQuantities: undefined,
    };
  }

  if (productType === 'package' && qtyValues && !Array.isArray(qtyValues)) {
    return {
      quantityMode: 'QUANTITY' as ProductQuantityMode,
      minQuantity: Number(qtyValues.min ?? 1),
      maxQuantity: Number(qtyValues.max ?? qtyValues.min ?? 1),
      customQuantities: undefined,
    };
  }

  if (productType === 'specificPackage' && Array.isArray(qtyValues)) {
    return {
      quantityMode: 'CUSTOMIZE' as ProductQuantityMode,
      minQuantity: undefined,
      maxQuantity: undefined,
      customQuantities: qtyValues.map(Number).filter((value) => !Number.isNaN(value)),
    };
  }

  return {
    quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode,
    minQuantity: undefined,
    maxQuantity: undefined,
    customQuantities: undefined,
  };
};

const buildGiftCardProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:GIFT_CARD_PROVIDERS:${providerProductId}`;
const buildSocialMediaProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:SOCIAL_MEDIA_SERVICE_PROVIDERS:${providerProductId}`;
const buildGiftCard2PinProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:GIFT_CARD_PROVIDERS_2:PIN:${providerProductId}`;

const convertProviderPriceToDollar = (price: unknown, currency: ApiCurrencySnapshot) => {
  const numericPrice = Number(price || 0);
  if (currency.isDollar) return numericPrice;
  return currency.price > 0 ? numericPrice / currency.price : numericPrice;
};

const getGiftCardProviderProducts = async (apiId: string) => {
  const api = await SettingsApi.findOne({
    _id: apiId,
    group: 'GIFT_CARD_PROVIDERS',
    isDeleted: { $ne: true },
    isVisible: true,
  }).select('+token').lean();

  if (!api) throw HttpError.notFound('settingsApis.gift_card_provider_api_not_found');
  const currency = await SettingsCurrency.findOne({ _id: api.currencyId, isDeleted: { $ne: true } })
    .select('_id name shortName price isDollar')
    .lean() as ApiCurrencySnapshot | null;
  if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

  const response = await GiftCardProvidersProvider.products({ baseUrl: api.link, token: api.token });
  return { api, currency, products: normalizeGiftCardProducts(response) };
};

const normalizeSocialMediaProducts = (response: unknown): SocialMediaProviderProductRow[] => {
  if (Array.isArray(response)) return response as SocialMediaProviderProductRow[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  const candidates = [record.data, record.services, record.result, record.items];
  const array = candidates.find(Array.isArray);
  return (array || []) as SocialMediaProviderProductRow[];
};

const getSocialMediaQuantityMapping = (product: SocialMediaProviderProductRow) => {
  const min = Number(product.min || 1);
  const max = Number(product.max || min);
  if (product.type === 'Package' || min === max) {
    return {
      quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode,
      forQuantity: 1,
      minQuantity: undefined,
      maxQuantity: undefined,
      customQuantities: undefined,
    };
  }
  return {
    quantityMode: 'COUNTER' as ProductQuantityMode,
    forQuantity: Math.max(min, 1),
    minQuantity: min,
    maxQuantity: max,
    customQuantities: undefined,
  };
};

const getSocialMediaProviderProducts = async (apiId: string) => {
  const api = await SettingsApi.findOne({
    _id: apiId,
    group: 'SOCIAL_MEDIA_SERVICE_PROVIDERS',
    isDeleted: { $ne: true },
    isVisible: true,
  }).select('+token').lean();

  if (!api) throw HttpError.notFound('settingsApis.social_media_provider_api_not_found');
  const currency = await SettingsCurrency.findOne({ _id: api.currencyId, isDeleted: { $ne: true } })
    .select('_id name shortName price isDollar')
    .lean() as ApiCurrencySnapshot | null;
  if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

  const response = await SocialMediaServiceProvidersProvider.services({ baseUrl: api.link, token: api.token });
  return { api, currency, products: normalizeSocialMediaProducts(response) };
};

const normalizeGiftCard2PinProducts = (response: unknown): GiftCardProvider2PinProductRow[] => {
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  const parsed = record.parsed as Record<string, unknown> | undefined;
  const candidates = [
    Array.isArray(response) ? response : undefined,
    parsed?.result,
    parsed?.data,
    parsed?.products,
    record.result,
    record.data,
    record.products,
  ];
  const array = candidates.find(Array.isArray);
  return (array || []) as GiftCardProvider2PinProductRow[];
};

const isNumberCodingGroup = (group: ApiProductsPreviewInput['apiGroup']): group is 'TEMPORARY_NUMBER_CODING_SITES' | 'RENEWABLE_NUMBER_CODING_SITES' =>
  group === 'TEMPORARY_NUMBER_CODING_SITES' || group === 'RENEWABLE_NUMBER_CODING_SITES';

const buildNumberCodingProductKey = (apiId: string, apiGroup: ApiProductsPreviewInput['apiGroup'], serviceCode: string) => `${apiId}:${apiGroup}:${serviceCode}`;

const readParsedPayload = (response: unknown) => {
  if (!response || typeof response !== 'object') return response;
  const record = response as Record<string, unknown>;
  return record.parsed ?? record.data ?? record.result ?? response;
};

const looksLikeCountryCode = (value: string) => /^\d+$/.test(value) || value.toLowerCase() === 'any';
const looksLikeServiceCode = (value: string) => /^[a-z][a-z0-9_/-]*$/i.test(value) && !looksLikeCountryCode(value);

const createNumberCodingCatalogs = (
  countries: TemporaryNumberCodingSitesCountryCatalogRow[],
  services: TemporaryNumberCodingSitesServiceCatalogRow[]
): NumberCodingCatalogs => ({
  countries: new Map(countries.flatMap((country): Array<[string, TemporaryNumberCodingSitesCountryCatalogRow]> => {
    const key = String(country.external_id ?? country.id ?? '');
    return key ? [[key, country]] : [];
  })),
  services: new Map(services.flatMap((service): Array<[string, TemporaryNumberCodingSitesServiceCatalogRow]> => {
    const key = String(service.external_id ?? service.id ?? '');
    return key ? [[key, service]] : [];
  })),
});

const getCatalogCountryName = (catalogCountry?: TemporaryNumberCodingSitesCountryCatalogRow, fallback?: string) =>
  catalogCountry?.name_intl?.en || catalogCountry?.name || fallback || '';

const toNumberCodingCountry = (countryCode: string, source: Record<string, unknown>, catalogs: NumberCodingCatalogs): NumberCodingCountryRow => {
  const catalogCountry = catalogs.countries.get(countryCode);
  return {
    countryCode,
    countryName: String(source.countryName || getCatalogCountryName(catalogCountry, String(source.country || countryCode))),
    flag: String(source.flag || catalogCountry?.icon || ''),
    price: Number.isFinite(Number(source.cost ?? source.price)) ? Number(source.cost ?? source.price) : undefined,
    count: Number.isFinite(Number(source.count ?? source.quantity ?? source.available)) ? Number(source.count ?? source.quantity ?? source.available) : undefined,
  };
};

const normalizeNumberCodingProducts = (response: unknown, catalogs: NumberCodingCatalogs): NumberCodingServiceRow[] => {
  const payload = readParsedPayload(response);
  const services = new Map<string, NumberCodingServiceRow>();

  const addCountry = (serviceCode: string, serviceName: string, country: NumberCodingCountryRow) => {
    if (!serviceCode) return;
    const catalogService = catalogs.services.get(serviceCode);
    const resolvedServiceName = catalogService?.name || serviceName || serviceCode;
    const current = services.get(serviceCode) || { serviceCode, serviceName: resolvedServiceName, countries: [], availableCount: 0 };
    current.serviceName = current.serviceName || resolvedServiceName;
    current.countries.push(country);
    current.availableCount += Number(country.count || 0);
    if (typeof country.price === 'number') current.minPrice = current.minPrice === undefined ? country.price : Math.min(current.minPrice, country.price);
    services.set(serviceCode, current);
  };

  const walk = (node: unknown, path: string[] = []) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...path, String(index)]));
      return;
    }

    const record = node as Record<string, unknown>;
    const hasPriceInfo = record.cost !== undefined || record.price !== undefined || record.count !== undefined || record.quantity !== undefined || record.available !== undefined;
    const serviceCodeFromRecord = String(record.serviceCode || record.service || record.code || '');
    const countryCodeFromRecord = String(record.countryCode || record.country || '');

    if (hasPriceInfo) {
      let serviceCode = serviceCodeFromRecord;
      let countryCode = countryCodeFromRecord;

      if (!serviceCode && path.length >= 2) {
        const [first, second] = path.slice(-2);
        serviceCode = looksLikeServiceCode(first) && looksLikeCountryCode(second) ? first : second;
        countryCode = looksLikeServiceCode(first) && looksLikeCountryCode(second) ? second : first;
      }

      addCountry(
        serviceCode,
        String(record.serviceName || record.name || serviceCode),
        toNumberCodingCountry(countryCode || 'any', record, catalogs)
      );
      return;
    }

    Object.entries(record).forEach(([key, value]) => walk(value, [...path, key]));
  };

  walk(payload);
  return Array.from(services.values()).map((service) => ({
    ...service,
    countries: service.countries.sort((a, b) => a.countryCode.localeCompare(b.countryCode)),
  })).sort((a, b) => a.serviceName.localeCompare(b.serviceName));
};

const getNumberCodingProviderProducts = async (apiId: string, apiGroup: 'TEMPORARY_NUMBER_CODING_SITES' | 'RENEWABLE_NUMBER_CODING_SITES') => {
  const api = await SettingsApi.findOne({
    _id: apiId,
    group: apiGroup,
    isDeleted: { $ne: true },
    isVisible: true,
  }).select('+token').lean();

  if (!api) throw HttpError.notFound('settingsApis.temporary_number_provider_api_not_found');

  const response = await TemporaryNumberCodingSitesProvider.getPricesV3({ baseUrl: api.link, token: api.token });
  const [countries, services] = await Promise.all([
    TemporaryNumberCodingSitesProvider.getCountryCatalog({ baseUrl: api.link, token: api.token }).catch(() => []),
    TemporaryNumberCodingSitesProvider.getServiceCatalog({ baseUrl: api.link, token: api.token }).catch(() => []),
  ]);
  return { api, products: normalizeNumberCodingProducts(response, createNumberCodingCatalogs(countries, services)) };
};

const getGiftCard2ProviderProducts = async (apiId: string) => {
  const api = await SettingsApi.findOne({
    _id: apiId,
    group: 'GIFT_CARD_PROVIDERS_2',
    isDeleted: { $ne: true },
    isVisible: true,
  }).select('+token').lean();

  if (!api) throw HttpError.notFound('settingsApis.gift_card_provider_2_api_not_found');
  const currency = await SettingsCurrency.findOne({ _id: api.currencyId, isDeleted: { $ne: true } })
    .select('_id name shortName price isDollar')
    .lean() as ApiCurrencySnapshot | null;
  if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

  const response = await GiftCardProviders2Provider.pinProducts({ baseUrl: api.link, token: api.token });
  return { api, currency, products: normalizeGiftCard2PinProducts(response) };
};

const buildGiftCardPreviewRow = (apiId: string, currency: ApiCurrencySnapshot, product: GiftCardProviderProductRow, existingProductId?: string) => {
  const quantity = getGiftCardQuantityMapping(product);
  return {
    providerProductId: String(product.id),
    apiProductKey: buildGiftCardProductKey(apiId, product.id),
    name: product.name,
    categoryName: product.category_name || 'Uncategorized',
    providerPrice: Number(product.price || 0),
    providerCurrency: currency.shortName,
    costPrice: convertProviderPriceToDollar(product.price, currency),
    forQuantity: 1,
    basePrice: product.base_price,
    available: Boolean(product.available),
    productType: product.product_type || '',
    params: product.params || [],
    qtyValues: product.qty_values ?? null,
    categoryImage: product.category_img || '',
    parentId: product.parent_id,
    quantityMode: quantity.quantityMode,
    minQuantity: quantity.minQuantity,
    maxQuantity: quantity.maxQuantity,
    customQuantities: quantity.customQuantities,
    existingProductId,
  };
};

const buildSocialMediaPreviewRow = (apiId: string, currency: ApiCurrencySnapshot, product: SocialMediaProviderProductRow, existingProductId?: string) => {
  const quantity = getSocialMediaQuantityMapping(product);
  return {
    providerProductId: String(product.service),
    apiProductKey: buildSocialMediaProductKey(apiId, product.service),
    name: product.name,
    categoryName: product.category || 'Uncategorized',
    providerPrice: Number(product.rate || 0),
    providerCurrency: currency.shortName,
    costPrice: convertProviderPriceToDollar(product.rate, currency),
    forQuantity: quantity.forQuantity,
    available: true,
    productType: product.type || '',
    params: (socialMediaServiceTypeRequirements[product.type as SocialMediaServiceType] || [])
      .filter((field) => !['service', 'quantity'].includes(field.name))
      .map((field) => field.name),
    qtyValues: { min: product.min, max: product.max },
    quantityMode: quantity.quantityMode,
    minQuantity: quantity.minQuantity,
    maxQuantity: quantity.maxQuantity,
    customQuantities: quantity.customQuantities,
    existingProductId,
  };
};

const buildGiftCard2PreviewRow = (apiId: string, currency: ApiCurrencySnapshot, product: GiftCardProvider2PinProductRow, existingProductId?: string) => ({
  providerProductId: String(product.id),
  apiProductKey: buildGiftCard2PinProductKey(apiId, product.id),
  name: product.adi,
  categoryName: product.oyun_adi || 'PIN',
  providerPrice: Number(product.fiyat || 0),
  providerCurrency: currency.shortName,
  costPrice: convertProviderPriceToDollar(product.fiyat, currency),
  forQuantity: Number(product.kupur || 1),
  available: true,
  productType: 'PIN',
  params: ['customerPhone'],
  qtyValues: { denomination: product.kupur },
  quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode,
  minQuantity: undefined,
  maxQuantity: undefined,
  customQuantities: undefined,
  existingProductId,
});

const buildNumberCodingPreviewRow = (
  apiId: string,
  apiGroup: 'TEMPORARY_NUMBER_CODING_SITES' | 'RENEWABLE_NUMBER_CODING_SITES',
  product: NumberCodingServiceRow,
  existingProductId?: string
) => ({
  providerProductId: product.serviceCode,
  apiProductKey: buildNumberCodingProductKey(apiId, apiGroup, product.serviceCode),
  name: product.serviceName,
  categoryName: product.serviceName,
  providerPrice: product.minPrice ?? 0,
  providerCurrency: '',
  costPrice: 0,
  forQuantity: 1,
  available: product.availableCount > 0 || product.countries.length > 0,
  productType: 'NUMBER_CODING_SERVICE',
  params: ['countryCode'],
  qtyValues: {
    countries: product.countries,
    availableCount: product.availableCount,
  },
  quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode,
  minQuantity: undefined,
  maxQuantity: undefined,
  customQuantities: undefined,
  existingProductId,
});

const getProviderProductId = (apiGroup: ApiProductsImportInput['apiGroup'], product: GiftCardProviderProductRow | SocialMediaProviderProductRow | GiftCardProvider2PinProductRow | NumberCodingServiceRow) => {
  if (apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') return (product as SocialMediaProviderProductRow).service;
  if (isNumberCodingGroup(apiGroup)) return (product as NumberCodingServiceRow).serviceCode;
  return (product as GiftCardProviderProductRow | GiftCardProvider2PinProductRow).id;
};

const getProviderCategoryName = (apiGroup: ApiProductsImportInput['apiGroup'], product: GiftCardProviderProductRow | SocialMediaProviderProductRow | GiftCardProvider2PinProductRow | NumberCodingServiceRow) => {
  if (apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') return (product as SocialMediaProviderProductRow).category || 'Uncategorized';
  if (apiGroup === 'GIFT_CARD_PROVIDERS_2') return (product as GiftCardProvider2PinProductRow).oyun_adi || 'PIN';
  if (isNumberCodingGroup(apiGroup)) return (product as NumberCodingServiceRow).serviceName || (product as NumberCodingServiceRow).serviceCode;
  return (product as GiftCardProviderProductRow).category_name || 'Uncategorized';
};

const getProviderParams = (apiGroup: ApiProductsImportInput['apiGroup'], product: GiftCardProviderProductRow | SocialMediaProviderProductRow | GiftCardProvider2PinProductRow | NumberCodingServiceRow) => {
  if (apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
    const socialProduct = product as SocialMediaProviderProductRow;
    return (socialMediaServiceTypeRequirements[socialProduct.type as SocialMediaServiceType] || [])
      .filter((field) => !['service', 'quantity'].includes(field.name))
      .map((field) => field.name);
  }
  if (apiGroup === 'GIFT_CARD_PROVIDERS_2') return ['customerPhone'];
  if (isNumberCodingGroup(apiGroup)) return ['countryCode'];
  return (product as GiftCardProviderProductRow).params || [];
};

export class StockProductService {
  static async list(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, any> = {};
    const shouldReturnAll = query.all === 'true' && Boolean(query.categoryId);

    if (query.search) {
      const search = new RegExp(query.search, 'i');
      filter.$or = [
        { 'name.en': search },
        { 'name.fr': search },
        { 'name.ar': search },
        { serviceNumber: search },
      ];
    }
    if (query.serviceId) filter.serviceId = query.serviceId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.groupId) filter.groupId = query.groupId;
    if (query.apiId) filter.apiId = query.apiId;
    if (typeof query.isVisible === 'boolean') filter.isVisible = query.isVisible;
    if (typeof query.isDeleted === 'boolean') filter.isDeleted = query.isDeleted;
    if (typeof query.hasSpecialSellPrice === 'boolean') filter.specialSellPrice = { $exists: query.hasSpecialSellPrice };
    if (query.fulfillmentType) filter.fulfillmentType = query.fulfillmentType;

    const queryBuilder = StockProduct.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('serviceId', 'name type')
      .populate('categoryId', 'name serviceId')
      .populate('groupId', 'name image coverImage')
      .populate('apiId', 'name group')
      .populate('requirements', 'paramsName message description apiGroup inputType defaultValue isRequired isDeleted')
      .populate('createdBy', 'name email')
      .lean();

    if (!shouldReturnAll) {
      queryBuilder.skip(skip).limit(limit);
    }

    const [products, total] = await Promise.all([
      queryBuilder,
      StockProduct.countDocuments(filter),
    ]);

    return { data: products, meta: buildPaginationMeta(total, page, shouldReturnAll ? total || 1 : limit) };
  }

  static async getById(productId: string) {
    const product = await StockProduct.findById(productId)
      .populate('serviceId', 'name type')
      .populate('categoryId', 'name serviceId')
      .populate('groupId', 'name image coverImage')
      .populate('apiId', 'name group')
      .populate('requirements', 'paramsName message description apiGroup inputType defaultValue isRequired isDeleted')
      .populate('createdBy', 'name email')
      .lean();

    if (!product) throw HttpError.notFound('stockProducts.not_found');
    return product;
  }

  static async create(data: ProductInput, actorId: string, file: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const service = await StockService.findById(data.serviceId).session(session);
      const category = await StockCategory.findById(data.categoryId).session(session);
      if (!service) throw HttpError.notFound('stockServices.not_found');
      if (!category) throw HttpError.notFound('stockCategories.not_found');
      if (category.serviceId.toString() !== data.serviceId) throw HttpError.badRequest('stockProducts.category_service_mismatch');

      if (data.apiId) {
        const api = await SettingsApi.findById(data.apiId).session(session);
        if (!api) throw HttpError.notFound('settingsApis.not_found');
      }
      if (data.groupId) {
        const group = await StockProductGroup.findById(data.groupId).session(session);
        if (!group) throw HttpError.notFound('stockProductGroups.not_found');
      }
      if (data.requirements?.length) {
        const requirementCount = await StockProductRequirement.countDocuments({ _id: { $in: data.requirements } }).session(session);
        if (requirementCount !== data.requirements.length) throw HttpError.badRequest('stockProductRequirements.not_found');
      }

      const image = await saveImageUpload(actorId, file, session);
      const product = new StockProduct({
        ...data,
        apiId: data.apiId || undefined,
        groupId: data.groupId || undefined,
        requirements: (data.requirements || []).map((requirementId) => new mongoose.Types.ObjectId(requirementId)),
        image,
        createdBy: actorId,
        sortOrder: await StockProduct.countDocuments({}).session(session),
        isDeleted: data.isDeleted ?? false,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await product.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: product._id,
        action: 'STOCK_PRODUCT_CREATED',
        entity: 'StockProduct',
        after: product.toObject(),
        ip,
        userAgent,
      }], { session });

      return product;
    });
  }

  static async update(productId: string, data: ProductUpdateInput, actorId: string, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const product = await StockProduct.findById(productId).session(session);
      if (!product) throw HttpError.notFound('stockProducts.not_found');

      const before = product.toObject();
      const oldImageUrl = product.image?.secureUrl;

      const nextServiceId = data.serviceId ?? product.serviceId.toString();
      const nextCategoryId = data.categoryId ?? product.categoryId.toString();

      if (data.serviceId) {
        const service = await StockService.findById(data.serviceId).session(session);
        if (!service) throw HttpError.notFound('stockServices.not_found');
        product.serviceId = new mongoose.Types.ObjectId(data.serviceId);
      }

      if (data.categoryId) {
        const category = await StockCategory.findById(data.categoryId).session(session);
        if (!category) throw HttpError.notFound('stockCategories.not_found');
        if (category.serviceId.toString() !== nextServiceId) throw HttpError.badRequest('stockProducts.category_service_mismatch');
        product.categoryId = new mongoose.Types.ObjectId(data.categoryId);
      } else if (data.serviceId) {
        const category = await StockCategory.findById(nextCategoryId).session(session);
        if (!category) throw HttpError.notFound('stockCategories.not_found');
        if (category.serviceId.toString() !== nextServiceId) throw HttpError.badRequest('stockProducts.category_service_mismatch');
      }

      if (data.groupId) {
        const group = await StockProductGroup.findById(data.groupId).session(session);
        if (!group) throw HttpError.notFound('stockProductGroups.not_found');
        product.groupId = new mongoose.Types.ObjectId(data.groupId);
      } else if (data.groupId === '') {
        product.groupId = undefined;
      }

      if (data.requirements !== undefined) {
        if (data.requirements.length) {
          const requirementCount = await StockProductRequirement.countDocuments({ _id: { $in: data.requirements } }).session(session);
          if (requirementCount !== data.requirements.length) throw HttpError.badRequest('stockProductRequirements.not_found');
        }
        product.requirements = data.requirements.map((requirementId) => new mongoose.Types.ObjectId(requirementId));
      }
      if (data.visibleCountryCodes !== undefined) product.visibleCountryCodes = data.visibleCountryCodes;

      if (data.name) product.name = data.name;
      if (data.serviceNumber !== undefined) product.serviceNumber = data.serviceNumber || undefined;
      if (data.costPrice !== undefined) product.costPrice = data.costPrice;
      if (data.costManual !== undefined) product.costManual = data.costManual;
      if (data.forQuantity !== undefined) product.forQuantity = data.forQuantity;
      if (data.description) product.description = data.description;
      if (data.quantityMode) product.quantityMode = data.quantityMode;
      if (data.minQuantity !== undefined) product.minQuantity = data.minQuantity;
      if (data.maxQuantity !== undefined) product.maxQuantity = data.maxQuantity;
      if (data.customQuantities !== undefined) product.customQuantities = data.customQuantities;
      if (data.speed !== undefined) product.speed = data.speed || undefined;
      if (data.startTime !== undefined) product.startTime = data.startTime || undefined;
      if (typeof data.quantityAvailable === 'boolean') product.quantityAvailable = data.quantityAvailable;
      if (typeof data.isVisible === 'boolean') product.isVisible = data.isVisible;
      if (typeof data.dripfeed === 'boolean') product.dripfeed = data.dripfeed;
      if (typeof data.refill === 'boolean') product.refill = data.refill;
      if (typeof data.cancel === 'boolean') product.cancel = data.cancel;
      if (typeof data.stock === 'boolean') product.stock = data.stock;
      if (data.fulfillmentType) product.fulfillmentType = data.fulfillmentType;
      if (typeof data.isDeleted === 'boolean') {
        product.isDeleted = data.isDeleted;
        product.deletedAt = data.isDeleted ? product.deletedAt ?? new Date() : undefined;
      }
      product.updatedBy = new mongoose.Types.ObjectId(actorId);

      if (file) product.image = await saveImageUpload(actorId, file, session);

      await product.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: product._id,
        action: 'STOCK_PRODUCT_UPDATED',
        entity: 'StockProduct',
        before,
        after: product.toObject(),
        ip,
        userAgent,
      }], { session });

      if (file && oldImageUrl) {
        await cleanupQueue.add('delete-cloudinary-file', { url: oldImageUrl });
      }

      return product;
    });
  }

  static async bulkUpdate(data: BulkUpdateInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      if (data.groupId !== undefined && data.groupId !== '') {
        const group = await StockProductGroup.findById(data.groupId).session(session);
        if (!group) throw HttpError.notFound('stockProductGroups.not_found');
      }

      const before = await StockProduct.find({ _id: { $in: data.ids } }).session(session).lean();
      const setUpdate: Record<string, unknown> = {
        updatedBy: new mongoose.Types.ObjectId(actorId),
      };
      const unsetUpdate: Record<string, unknown> = {};

      if (typeof data.isVisible === 'boolean') setUpdate.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        setUpdate.isDeleted = data.isDeleted;
        setUpdate.deletedAt = data.isDeleted ? new Date() : undefined;
      }
      if (data.groupId !== undefined) {
        if (data.groupId === '') {
          unsetUpdate.groupId = '';
        } else {
          setUpdate.groupId = new mongoose.Types.ObjectId(data.groupId);
        }
      }
      if (data.specialSellPrice !== undefined) {
        if (data.specialSellPrice === null) {
          unsetUpdate.specialSellPrice = '';
        } else {
          setUpdate.specialSellPrice = data.specialSellPrice;
        }
      }

      const updateOperation = {
        $set: setUpdate,
        ...(Object.keys(unsetUpdate).length ? { $unset: unsetUpdate } : {}),
      };

      await StockProduct.updateMany({ _id: { $in: data.ids } }, updateOperation, { session });

      await AuditLog.create([{
        actorId,
        action: 'STOCK_PRODUCT_BULK_UPDATED',
        entity: 'StockProduct',
        before,
        after: { ids: data.ids, update: updateOperation },
        ip,
        userAgent,
      }], { session });
    });
  }

  static async reorder(orderedIds: string[], actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const actorObjectId = new mongoose.Types.ObjectId(actorId);
      await StockProduct.bulkWrite(
        orderedIds.map((id, index) => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: index, updatedBy: actorObjectId } },
          },
        })),
        { session }
      );

      await AuditLog.create([{
        actorId,
        action: 'STOCK_PRODUCT_REORDERED',
        entity: 'StockProduct',
        after: { orderedIds },
        ip,
        userAgent,
      }], { session });
    });
  }

  static async previewApiProductsImport(data: ApiProductsPreviewInput) {
    if (isNumberCodingGroup(data.apiGroup)) {
      const numberApiGroup = data.apiGroup;
      const { products } = await getNumberCodingProviderProducts(data.apiId, numberApiGroup);
      const keys = products.map((product) => buildNumberCodingProductKey(data.apiId, numberApiGroup, product.serviceCode));
      const existingProducts = await StockProduct.find({ apiProductKey: { $in: keys } }).select('_id apiProductKey').lean();
      const existingByKey = new Map(existingProducts.map((product) => [product.apiProductKey, product._id.toString()]));
      return products.map((product) => buildNumberCodingPreviewRow(
        data.apiId,
        numberApiGroup,
        product,
        existingByKey.get(buildNumberCodingProductKey(data.apiId, numberApiGroup, product.serviceCode))
      ));
    }

    if (data.apiGroup === 'GIFT_CARD_PROVIDERS_2') {
      const { currency, products } = await getGiftCard2ProviderProducts(data.apiId);
      const keys = products.map((product) => buildGiftCard2PinProductKey(data.apiId, product.id));
      const existingProducts = await StockProduct.find({ apiProductKey: { $in: keys } }).select('_id apiProductKey').lean();
      const existingByKey = new Map(existingProducts.map((product) => [product.apiProductKey, product._id.toString()]));
      return products.map((product) => buildGiftCard2PreviewRow(
        data.apiId,
        currency,
        product,
        existingByKey.get(buildGiftCard2PinProductKey(data.apiId, product.id))
      ));
    }

    if (data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
      const { currency, products } = await getSocialMediaProviderProducts(data.apiId);
      const keys = products.map((product) => buildSocialMediaProductKey(data.apiId, product.service));
      const existingProducts = await StockProduct.find({ apiProductKey: { $in: keys } }).select('_id apiProductKey').lean();
      const existingByKey = new Map(existingProducts.map((product) => [product.apiProductKey, product._id.toString()]));
      return products.map((product) => buildSocialMediaPreviewRow(
        data.apiId,
        currency,
        product,
        existingByKey.get(buildSocialMediaProductKey(data.apiId, product.service))
      ));
    }

    const { currency, products } = await getGiftCardProviderProducts(data.apiId);
    const keys = products.map((product) => buildGiftCardProductKey(data.apiId, product.id));
    const existingProducts = await StockProduct.find({ apiProductKey: { $in: keys } }).select('_id apiProductKey').lean();
    const existingByKey = new Map(existingProducts.map((product) => [product.apiProductKey, product._id.toString()]));

    return products.map((product) => buildGiftCardPreviewRow(
      data.apiId,
      currency,
      product,
      existingByKey.get(buildGiftCardProductKey(data.apiId, product.id))
    ));
  }

  static async importApiProducts(data: ApiProductsImportInput, actorId: string, ip?: string, userAgent?: string) {
    const service = await StockService.findById(data.serviceId);
    if (!service) throw HttpError.notFound('stockServices.not_found');

    const actorObjectId = new mongoose.Types.ObjectId(actorId);
    const serviceObjectId = new mongoose.Types.ObjectId(data.serviceId);

    let selectedSystemCategory: { _id: mongoose.Types.ObjectId; serviceId: mongoose.Types.ObjectId } | null = null;
    if (!data.autoCreateCategories) {
      if (!data.categoryId) throw HttpError.badRequest('stockProducts.import_category_required');
      selectedSystemCategory = await StockCategory.findById(data.categoryId).select('_id serviceId').lean() as { _id: mongoose.Types.ObjectId; serviceId: mongoose.Types.ObjectId } | null;
      if (!selectedSystemCategory) throw HttpError.notFound('stockCategories.not_found');
      if (selectedSystemCategory.serviceId.toString() !== data.serviceId) throw HttpError.badRequest('stockProducts.category_service_mismatch');
    }

    const providerData = isNumberCodingGroup(data.apiGroup)
      ? await getNumberCodingProviderProducts(data.apiId, data.apiGroup)
      : data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
        ? await getSocialMediaProviderProducts(data.apiId)
        : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
          ? await getGiftCard2ProviderProducts(data.apiId)
          : await getGiftCardProviderProducts(data.apiId);
    const { products } = providerData;
    const currency = 'currency' in providerData ? providerData.currency : null;
    const selectedIds = new Set(data.productIds.map(String));
    const selectedProducts = products.filter((product) => selectedIds.has(String(data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
      ? (product as SocialMediaProviderProductRow).service
      : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
        ? (product as GiftCardProvider2PinProductRow).id
        : isNumberCodingGroup(data.apiGroup)
          ? (product as NumberCodingServiceRow).serviceCode
      : (product as GiftCardProviderProductRow).id)));
    if (!selectedProducts.length) throw HttpError.badRequest('stockProducts.import_no_products_selected');

    const now = new Date();

    const categoryByName = new Map<string, mongoose.Types.ObjectId>();
    if (data.autoCreateCategories) {
      const providerCategoryNames = Array.from(new Set(selectedProducts.map((product) => getProviderCategoryName(data.apiGroup, product))));
      const existingCategories = await StockCategory.find({
        serviceId: serviceObjectId,
        $or: providerCategoryNames.flatMap((name) => [{ 'name.en': name }, { 'name.fr': name }, { 'name.ar': name }]),
      }).select('_id name').lean();

      existingCategories.forEach((category) => {
        categoryByName.set(category.name.en, category._id as mongoose.Types.ObjectId);
        categoryByName.set(category.name.fr, category._id as mongoose.Types.ObjectId);
        categoryByName.set(category.name.ar, category._id as mongoose.Types.ObjectId);
      });

      const missingCategoryNames = providerCategoryNames.filter((name) => !categoryByName.has(name));
      if (missingCategoryNames.length) {
        const currentCategoryCount = await StockCategory.countDocuments({ serviceId: serviceObjectId });
        const insertedCategories = await StockCategory.insertMany(
          missingCategoryNames.map((name, index) => {
            const firstProduct = selectedProducts.find((product) => getProviderCategoryName(data.apiGroup, product) === name);
            const firstGiftProduct = firstProduct as GiftCardProviderProductRow | undefined;
            return {
              name: localized(name),
              description: localized(name),
              serviceId: serviceObjectId,
              image: data.apiGroup === 'GIFT_CARD_PROVIDERS' && firstGiftProduct?.category_img ? { secureUrl: firstGiftProduct.category_img, publicId: `external-category:${name}` } : undefined,
              isVisible: true,
              isDeleted: false,
              sortOrder: currentCategoryCount + index,
              createdBy: actorObjectId,
            };
          })
        );
        insertedCategories.forEach((category) => categoryByName.set(category.name.en, category._id as mongoose.Types.ObjectId));
      }
    }

    const paramsNames = Array.from(new Set(
      selectedProducts.flatMap((product) => getProviderParams(data.apiGroup, product)).map((param) => String(param).trim()).filter(Boolean)
    ));
    if (paramsNames.length) {
      await StockProductRequirement.bulkWrite(
        paramsNames.map((paramsName) => ({
          updateOne: {
            filter: { paramsName, apiGroup: data.apiGroup },
            update: {
              $setOnInsert: {
                paramsName,
                message: localized(paramsName),
                description: localized(paramsName),
                apiGroup: data.apiGroup,
                inputType: 'TEXT',
                isRequired: true,
                isDeleted: false,
                createdBy: actorObjectId,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }
    const requirements = await StockProductRequirement.find({ paramsName: { $in: paramsNames }, apiGroup: data.apiGroup }).select('_id paramsName').lean();
    const requirementByName = new Map(requirements.map((requirement) => [requirement.paramsName, requirement._id as mongoose.Types.ObjectId]));

    const apiProductKeys = selectedProducts.map((product) => data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
      ? buildSocialMediaProductKey(data.apiId, (product as SocialMediaProviderProductRow).service)
      : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
        ? buildGiftCard2PinProductKey(data.apiId, (product as GiftCardProvider2PinProductRow).id)
      : buildGiftCardProductKey(data.apiId, (product as GiftCardProviderProductRow).id));
    const existingProducts = await StockProduct.find({ apiProductKey: { $in: apiProductKeys } }).lean();
    const existingByKey = new Map(existingProducts.map((product) => [product.apiProductKey, product]));
    const productCount = await StockProduct.countDocuments({});
    const productOperations: Parameters<typeof StockProduct.bulkWrite>[0] = [];
    const auditLogs: Record<string, unknown>[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    selectedProducts.forEach((providerProduct) => {
      const providerProductId = getProviderProductId(data.apiGroup, providerProduct);
      const giftProduct = providerProduct as GiftCardProviderProductRow;
      const socialProduct = providerProduct as SocialMediaProviderProductRow;
      const gift2Product = providerProduct as GiftCardProvider2PinProductRow;
      const numberProduct = providerProduct as NumberCodingServiceRow;
      const quantity = data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
        ? getSocialMediaQuantityMapping(socialProduct)
        : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
          ? { quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode, minQuantity: undefined, maxQuantity: undefined, customQuantities: undefined }
          : isNumberCodingGroup(data.apiGroup)
            ? { quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode, minQuantity: undefined, maxQuantity: undefined, customQuantities: undefined }
        : getGiftCardQuantityMapping(giftProduct);
      const forQuantity = data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
        ? getSocialMediaQuantityMapping(socialProduct).forQuantity
        : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
          ? Number(gift2Product.kupur || 1)
          : isNumberCodingGroup(data.apiGroup)
            ? 1
        : 1;
      const apiProductKey = data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
        ? buildSocialMediaProductKey(data.apiId, providerProductId)
        : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
          ? buildGiftCard2PinProductKey(data.apiId, providerProductId)
          : isNumberCodingGroup(data.apiGroup)
            ? buildNumberCodingProductKey(data.apiId, data.apiGroup, String(providerProductId))
        : buildGiftCardProductKey(data.apiId, providerProductId);
      const existing = existingByKey.get(apiProductKey);
      const categoryId = data.autoCreateCategories
        ? categoryByName.get(getProviderCategoryName(data.apiGroup, providerProduct))
        : selectedSystemCategory?._id as mongoose.Types.ObjectId;

      if (!categoryId) {
        skipped += 1;
        return;
      }

      const update = {
        serviceId: serviceObjectId,
        categoryId,
        apiId: new mongoose.Types.ObjectId(data.apiId),
        apiGroup: data.apiGroup,
        apiProductId: String(providerProductId),
        apiProductKey,
        apiPayload: {
          ...(providerProduct as unknown as Record<string, unknown>),
          family: data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? 'PIN' : undefined,
          gameId: data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.oyun_id : undefined,
          gameName: data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.oyun_adi : undefined,
          denomination: data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.kupur : undefined,
          playerInfoId: data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.oyun_bilgi_id : undefined,
          serviceCode: isNumberCodingGroup(data.apiGroup) ? numberProduct.serviceCode : undefined,
          serviceName: isNumberCodingGroup(data.apiGroup) ? numberProduct.serviceName : undefined,
          countries: isNumberCodingGroup(data.apiGroup) ? numberProduct.countries : undefined,
          availableCount: isNumberCodingGroup(data.apiGroup) ? numberProduct.availableCount : undefined,
          dynamicPrice: isNumberCodingGroup(data.apiGroup) ? true : undefined,
          providerCurrency: currency?.shortName,
          providerCurrencyId: currency?._id,
          providerPrice: isNumberCodingGroup(data.apiGroup) ? undefined : Number(data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? socialProduct.rate || 0 : data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.fiyat || 0 : giftProduct.price || 0),
          normalizedDollarPrice: isNumberCodingGroup(data.apiGroup) || !currency ? undefined : convertProviderPriceToDollar(data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? socialProduct.rate : data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.fiyat : giftProduct.price, currency),
        },
        apiLastSyncedAt: now,
        apiSyncStatus: 'SYNCED' as const,
        name: localized(data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
          ? gift2Product.adi || String(providerProductId)
          : data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
            ? socialProduct.name || String(providerProductId)
            : isNumberCodingGroup(data.apiGroup)
              ? numberProduct.serviceName || String(providerProductId)
            : giftProduct.name || String(providerProductId)),
        serviceNumber: String(providerProductId),
        costPrice: isNumberCodingGroup(data.apiGroup) || !currency ? 0 : convertProviderPriceToDollar(data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? socialProduct.rate : data.apiGroup === 'GIFT_CARD_PROVIDERS_2' ? gift2Product.fiyat : giftProduct.price, currency),
        forQuantity,
        description: localized(data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS'
          ? `${socialProduct.category || ''} ${socialProduct.type || ''}`.trim() || socialProduct.name || String(providerProductId)
          : data.apiGroup === 'GIFT_CARD_PROVIDERS_2'
            ? gift2Product.aciklama || gift2Product.adi || String(providerProductId)
            : isNumberCodingGroup(data.apiGroup)
              ? numberProduct.serviceName || String(providerProductId)
          : `${giftProduct.category_name || ''} ${giftProduct.product_type || ''}`.trim() || giftProduct.name || String(providerProductId)),
        quantityMode: quantity.quantityMode,
        minQuantity: quantity.minQuantity,
        maxQuantity: quantity.maxQuantity,
        customQuantities: quantity.customQuantities,
        quantityAvailable: data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? true : isNumberCodingGroup(data.apiGroup) ? true : Boolean(giftProduct.available),
        visibleCountryCodes: isNumberCodingGroup(data.apiGroup) ? numberProduct.countries.map((country) => country.countryCode) : undefined,
        isVisible: data.isVisible,
        dripfeed: data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? Boolean(socialProduct.dripfeed) : false,
        refill: data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? Boolean(socialProduct.refill) : false,
        cancel: data.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? Boolean(socialProduct.cancel) : false,
        stock: data.stock,
        fulfillmentType: 'API' as const,
        requirements: getProviderParams(data.apiGroup, providerProduct)
          .map((param) => requirementByName.get(String(param).trim()))
          .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        image: data.apiGroup === 'GIFT_CARD_PROVIDERS' && giftProduct.category_img ? { secureUrl: giftProduct.category_img, publicId: `external:${providerProductId}` } : undefined,
        isDeleted: false,
        deletedAt: undefined,
      };

      if (existing) {
        if (!data.updateExisting) {
          skipped += 1;
          return;
        }
        productOperations.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: { ...update, updatedBy: actorObjectId } },
          },
        });
        updated += 1;
        auditLogs.push({
          actorId,
          targetId: existing._id,
          action: 'STOCK_PRODUCT_API_IMPORT_UPDATED',
          entity: 'StockProduct',
          before: existing,
          after: { ...update, updatedBy: actorObjectId },
          ip,
          userAgent,
        });
        return;
      }

      const productId = new mongoose.Types.ObjectId();
      const product = {
        _id: productId,
        ...update,
        createdBy: actorObjectId,
        sortOrder: productCount + created,
        createdAt: now,
        updatedAt: now,
      };
      productOperations.push({ insertOne: { document: product } });
      created += 1;
      auditLogs.push({
        actorId,
        targetId: productId,
        action: 'STOCK_PRODUCT_API_IMPORTED',
        entity: 'StockProduct',
        after: product,
        ip,
        userAgent,
      });
    });

    if (productOperations.length) {
      await StockProduct.bulkWrite(productOperations, { ordered: false });
    }
    if (auditLogs.length) await AuditLog.insertMany(auditLogs);

    return { created, updated, skipped, total: selectedProducts.length };
  }
}
