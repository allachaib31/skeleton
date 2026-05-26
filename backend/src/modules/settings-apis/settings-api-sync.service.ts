import mongoose from 'mongoose';
import { logger } from '../../common/utils/logger';
import { HttpError } from '../../common/errors/HttpError';
import { translate } from '../../config/i18n.config';
import { AuditLog } from '../audit/audit-log.model';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../roles/role.model';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { StockProduct, ProductQuantityMode } from '../stock-products/stock-product.model';
import { User } from '../users/user.model';
import { GiftCardProvidersProvider } from './providers/gift-card-providers.provider';
import { GiftCardProviders2Provider } from './providers/gift-card-providers-2.provider';
import {
  SocialMediaServiceProvidersProvider,
  SocialMediaServiceType,
  socialMediaServiceTypeRequirements,
} from './providers/social-media-service-providers.provider';
import { ApiGroup, ISettingsApi, SettingsApi } from './settings-api.model';

type SupportedSyncGroup = 'GIFT_CARD_PROVIDERS' | 'SOCIAL_MEDIA_SERVICE_PROVIDERS' | 'GIFT_CARD_PROVIDERS_2';

interface ApiCurrencySnapshot {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  price: number;
  isDollar: boolean;
}

interface ProviderProductSnapshot {
  apiProductKey: string;
  apiProductId: string;
  costPrice: number;
  forQuantity: number;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  quantityAvailable: boolean;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  apiPayload: Record<string, unknown>;
}

interface SyncResult {
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

const supportedSyncGroups: SupportedSyncGroup[] = [
  'GIFT_CARD_PROVIDERS',
  'SOCIAL_MEDIA_SERVICE_PROVIDERS',
  'GIFT_CARD_PROVIDERS_2',
];

const convertProviderPriceToDollar = (price: unknown, currency: ApiCurrencySnapshot) => {
  const numericPrice = Number(price || 0);
  if (currency.isDollar) return numericPrice;
  return currency.price > 0 ? numericPrice / currency.price : numericPrice;
};

const buildGiftCardProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:GIFT_CARD_PROVIDERS:${providerProductId}`;
const buildSocialMediaProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:SOCIAL_MEDIA_SERVICE_PROVIDERS:${providerProductId}`;
const buildGiftCard2PinProductKey = (apiId: string, providerProductId: string | number) => `${apiId}:GIFT_CARD_PROVIDERS_2:PIN:${providerProductId}`;

const normalizeArray = <T>(response: unknown, keys: string[]): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  const parsed = record.parsed && typeof record.parsed === 'object' ? record.parsed as Record<string, unknown> : undefined;
  const candidates = keys.flatMap((key) => [record[key], parsed?.[key]]);
  const array = candidates.find(Array.isArray);
  return (array || []) as T[];
};

const getGiftCardQuantityMapping = (product: Record<string, unknown>) => {
  const qtyValues = product.qty_values as null | { min?: number | string; max?: number | string } | Array<string | number> | undefined;
  const productType = product.product_type;

  if (productType === 'amount' && qtyValues && !Array.isArray(qtyValues)) {
    return { quantityMode: 'COUNTER' as ProductQuantityMode, minQuantity: Number(qtyValues.min ?? 1), maxQuantity: Number(qtyValues.max ?? qtyValues.min ?? 1), customQuantities: undefined };
  }
  if (productType === 'package' && qtyValues && !Array.isArray(qtyValues)) {
    return { quantityMode: 'QUANTITY' as ProductQuantityMode, minQuantity: Number(qtyValues.min ?? 1), maxQuantity: Number(qtyValues.max ?? qtyValues.min ?? 1), customQuantities: undefined };
  }
  if (productType === 'specificPackage' && Array.isArray(qtyValues)) {
    return { quantityMode: 'CUSTOMIZE' as ProductQuantityMode, minQuantity: undefined, maxQuantity: undefined, customQuantities: qtyValues.map(Number).filter((value) => !Number.isNaN(value)) };
  }
  return { quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode, minQuantity: undefined, maxQuantity: undefined, customQuantities: undefined };
};

const getSocialMediaQuantityMapping = (product: Record<string, unknown>) => {
  const min = Number(product.min || 1);
  const max = Number(product.max || min);
  if (product.type === 'Package' || min === max) {
    return { quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode, forQuantity: 1, minQuantity: undefined, maxQuantity: undefined, customQuantities: undefined };
  }
  return { quantityMode: 'COUNTER' as ProductQuantityMode, forQuantity: Math.max(min, 1), minQuantity: min, maxQuantity: max, customQuantities: undefined };
};

const extractNumericBalance = (response: unknown): number | undefined => {
  if (typeof response === 'number') return Number.isFinite(response) ? response : undefined;
  if (!response || typeof response !== 'object') return undefined;
  const record = response as Record<string, unknown>;
  const parsed = record.parsed && typeof record.parsed === 'object' ? record.parsed as Record<string, unknown> : undefined;
  const candidates = [
    record.balance,
    record.bakiye,
    record.credit,
    parsed?.balance,
    parsed?.bakiye,
    parsed?.remainingBalance,
    (record.data as Record<string, unknown> | undefined)?.balance,
    (record.result as Record<string, unknown> | undefined)?.balance,
  ];
  const value = candidates.map(Number).find((candidate) => Number.isFinite(candidate));
  return value;
};

const getAdminUserIds = async () => {
  const roles = await Role.find({ name: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
  if (!roles.length) return [];
  const users = await User.find({ role: { $in: roles.map((role) => role._id) }, isDeleted: { $ne: true } }).select('_id').lean();
  return users.map((user) => String(user._id));
};

const notifyAdminsAboutUnavailableProducts = async (
  rows: Array<{ productId: mongoose.Types.ObjectId; productName?: string; apiId: mongoose.Types.ObjectId; apiName: string; reason: 'MISSING' | 'UNAVAILABLE' }>
) => {
  if (!rows.length) return;
  const adminUserIds = await getAdminUserIds();
  if (!adminUserIds.length) return;

  await Promise.all(rows.flatMap((row) =>
    adminUserIds.map((userId) =>
      NotificationsService.createNotification({
        userId,
        type: 'api_product_unavailable',
        title: translate('notifications.api_product_unavailable_title', 'en'),
        message: translate('notifications.api_product_unavailable_message', 'en'),
        data: {
          titleKey: 'notifications.apiProductUnavailableTitle',
          messageKey: 'notifications.apiProductUnavailableMessage',
          productId: row.productId,
          productName: row.productName,
          apiId: row.apiId,
          apiName: row.apiName,
          reason: row.reason,
        },
      }).catch(() => undefined)
    )
  ));
};

export class SettingsApiSyncService {
  private static async getApiAndCurrency(apiId: string) {
    const api = await SettingsApi.findOne({ _id: apiId, isDeleted: { $ne: true }, isVisible: true }).select('+token');
    if (!api) return null;
    const currency = await SettingsCurrency.findOne({ _id: api.currencyId, isDeleted: { $ne: true } })
      .select('_id name shortName price isDollar')
      .lean() as ApiCurrencySnapshot | null;
    if (!currency) return null;
    return { api, currency };
  }

  private static async getProviderProducts(api: ISettingsApi, currency: ApiCurrencySnapshot) {
    const apiId = String(api._id);
    const credentials = { baseUrl: api.link, token: api.token };

    if (api.group === 'GIFT_CARD_PROVIDERS') {
      const [productsResponse, balanceResponse] = await Promise.all([
        GiftCardProvidersProvider.products(credentials),
        GiftCardProvidersProvider.profile(credentials).catch(() => null),
      ]);
      const rows = normalizeArray<Record<string, unknown>>(productsResponse, ['data', 'products', 'result', 'items']);
      return {
        balance: extractNumericBalance(balanceResponse),
        products: rows.map((product): ProviderProductSnapshot => {
          const quantity = getGiftCardQuantityMapping(product);
          const id = String(product.id);
          return {
            apiProductKey: buildGiftCardProductKey(apiId, id),
            apiProductId: id,
            costPrice: convertProviderPriceToDollar(product.price, currency),
            forQuantity: 1,
            quantityMode: quantity.quantityMode,
            minQuantity: quantity.minQuantity,
            maxQuantity: quantity.maxQuantity,
            customQuantities: quantity.customQuantities,
            quantityAvailable: Boolean(product.available),
            dripfeed: false,
            refill: false,
            cancel: false,
            apiPayload: {
              ...product,
              providerCurrency: currency.shortName,
              providerCurrencyId: currency._id,
              providerPrice: Number(product.price || 0),
              normalizedDollarPrice: convertProviderPriceToDollar(product.price, currency),
            },
          };
        }),
      };
    }

    if (api.group === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
      const [productsResponse, balanceResponse] = await Promise.all([
        SocialMediaServiceProvidersProvider.services(credentials),
        SocialMediaServiceProvidersProvider.balance(credentials).catch(() => null),
      ]);
      const rows = normalizeArray<Record<string, unknown>>(productsResponse, ['data', 'services', 'result', 'items']);
      return {
        balance: extractNumericBalance(balanceResponse),
        products: rows.map((product): ProviderProductSnapshot => {
          const quantity = getSocialMediaQuantityMapping(product);
          const id = String(product.service);
          return {
            apiProductKey: buildSocialMediaProductKey(apiId, id),
            apiProductId: id,
            costPrice: convertProviderPriceToDollar(product.rate, currency),
            forQuantity: quantity.forQuantity,
            quantityMode: quantity.quantityMode,
            minQuantity: quantity.minQuantity,
            maxQuantity: quantity.maxQuantity,
            customQuantities: quantity.customQuantities,
            quantityAvailable: true,
            dripfeed: Boolean(product.dripfeed),
            refill: Boolean(product.refill),
            cancel: Boolean(product.cancel),
            apiPayload: {
              ...product,
              requiredParams: (socialMediaServiceTypeRequirements[product.type as SocialMediaServiceType] || []).map((field) => field.name),
              providerCurrency: currency.shortName,
              providerCurrencyId: currency._id,
              providerPrice: Number(product.rate || 0),
              normalizedDollarPrice: convertProviderPriceToDollar(product.rate, currency),
            },
          };
        }),
      };
    }

    if (api.group === 'GIFT_CARD_PROVIDERS_2') {
      const [productsResponse, balanceResponse] = await Promise.all([
        GiftCardProviders2Provider.pinProducts(credentials),
        GiftCardProviders2Provider.balance(credentials).catch(() => null),
      ]);
      const rows = normalizeArray<Record<string, unknown>>(productsResponse, ['result', 'data', 'products']);
      return {
        balance: extractNumericBalance(balanceResponse),
        products: rows.map((product): ProviderProductSnapshot => {
          const id = String(product.id);
          return {
            apiProductKey: buildGiftCard2PinProductKey(apiId, id),
            apiProductId: id,
            costPrice: convertProviderPriceToDollar(product.fiyat, currency),
            forQuantity: Number(product.kupur || 1),
            quantityMode: 'WITHOUT_QUANTITY' as ProductQuantityMode,
            quantityAvailable: true,
            dripfeed: false,
            refill: false,
            cancel: false,
            apiPayload: {
              ...product,
              family: 'PIN',
              gameId: product.oyun_id,
              gameName: product.oyun_adi,
              denomination: product.kupur,
              playerInfoId: product.oyun_bilgi_id,
              providerCurrency: currency.shortName,
              providerCurrencyId: currency._id,
              providerPrice: Number(product.fiyat || 0),
              normalizedDollarPrice: convertProviderPriceToDollar(product.fiyat, currency),
            },
          };
        }),
      };
    }

    return { balance: undefined, products: [] as ProviderProductSnapshot[] };
  }

  private static async getProviderBalance(api: ISettingsApi) {
    const credentials = { baseUrl: api.link, token: api.token };

    if (api.group === 'GIFT_CARD_PROVIDERS') {
      return extractNumericBalance(await GiftCardProvidersProvider.profile(credentials));
    }

    if (api.group === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
      return extractNumericBalance(await SocialMediaServiceProvidersProvider.balance(credentials));
    }

    if (api.group === 'GIFT_CARD_PROVIDERS_2') {
      return extractNumericBalance(await GiftCardProviders2Provider.balance(credentials));
    }

    return undefined;
  }

  static async refreshBalance(apiId: string) {
    const apiAndCurrency = await this.getApiAndCurrency(apiId);
    if (!apiAndCurrency) return null;
    const { api, currency } = apiAndCurrency;
    if (!supportedSyncGroups.includes(api.group as SupportedSyncGroup)) return null;

    const now = new Date();
    const balance = await this.getProviderBalance(api);
    await SettingsApi.updateOne(
      { _id: api._id },
      {
        $set: {
          balance,
          balanceCurrency: currency.shortName,
          balanceSyncedAt: now,
        },
      }
    );

    return {
      balance,
      balanceCurrency: currency.shortName,
      balanceSyncedAt: now,
    };
  }

  static async syncApi(apiId: string, actorId?: string, ip?: string, userAgent?: string): Promise<SyncResult> {
    const apiAndCurrency = await this.getApiAndCurrency(apiId);
    if (!apiAndCurrency) throw HttpError.notFound('settingsApis.not_found');

    const { api, currency } = apiAndCurrency;
    const now = new Date();

    if (!supportedSyncGroups.includes(api.group as SupportedSyncGroup)) {
      await SettingsApi.updateOne({ _id: api._id }, { $set: { syncStatus: 'SUCCESS', lastSyncAt: now, balanceCurrency: currency.shortName } });
      return { apiId, apiName: api.name, group: api.group, providerProducts: 0, importedProducts: 0, updated: 0, unavailable: 0, missing: 0 };
    }

    await SettingsApi.updateOne({ _id: api._id }, { $set: { syncStatus: 'SYNCING' }, $unset: { syncError: 1 } });

    try {
      const providerResult = await this.getProviderProducts(api, currency);
      const providerByKey = new Map(providerResult.products.map((product) => [product.apiProductKey, product]));
      const importedProducts = await StockProduct.find({ apiId: api._id, apiProductKey: { $exists: true }, isDeleted: { $ne: true } })
        .select('_id name apiProductKey quantityAvailable apiSyncStatus')
        .lean();

      const unavailableNotifications: Array<{ productId: mongoose.Types.ObjectId; productName?: string; apiId: mongoose.Types.ObjectId; apiName: string; reason: 'MISSING' | 'UNAVAILABLE' }> = [];
      const operations: Parameters<typeof StockProduct.bulkWrite>[0] = [];
      let updated = 0;
      let unavailable = 0;
      let missing = 0;

      importedProducts.forEach((product) => {
        const providerProduct = providerByKey.get(product.apiProductKey || '');
        const wasAvailable = product.quantityAvailable !== false && product.apiSyncStatus !== 'MISSING';
        if (!providerProduct) {
          missing += 1;
          operations.push({
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  quantityAvailable: false,
                  apiLastSyncedAt: now,
                  apiSyncStatus: 'MISSING',
                  apiSyncError: 'Provider product not found during API sync',
                },
              },
            },
          });
          if (wasAvailable) {
            unavailableNotifications.push({
              productId: product._id as mongoose.Types.ObjectId,
              productName: product.name?.en,
              apiId: api._id as mongoose.Types.ObjectId,
              apiName: api.name,
              reason: 'MISSING',
            });
          }
          return;
        }

        if (!providerProduct.quantityAvailable) {
          unavailable += 1;
          if (wasAvailable) {
            unavailableNotifications.push({
              productId: product._id as mongoose.Types.ObjectId,
              productName: product.name?.en,
              apiId: api._id as mongoose.Types.ObjectId,
              apiName: api.name,
              reason: 'UNAVAILABLE',
            });
          }
        }

        operations.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                costPrice: providerProduct.costPrice,
                forQuantity: providerProduct.forQuantity,
                quantityMode: providerProduct.quantityMode,
                minQuantity: providerProduct.minQuantity,
                maxQuantity: providerProduct.maxQuantity,
                customQuantities: providerProduct.customQuantities,
                quantityAvailable: providerProduct.quantityAvailable,
                dripfeed: providerProduct.dripfeed,
                refill: providerProduct.refill,
                cancel: providerProduct.cancel,
                apiProductId: providerProduct.apiProductId,
                apiPayload: providerProduct.apiPayload,
                apiLastSyncedAt: now,
                apiSyncStatus: 'SYNCED',
              },
              $unset: { apiSyncError: 1 },
            },
          },
        });
        updated += 1;
      });

      if (operations.length) await StockProduct.bulkWrite(operations, { ordered: false });
      await notifyAdminsAboutUnavailableProducts(unavailableNotifications);

      await SettingsApi.updateOne(
        { _id: api._id },
        {
          $set: {
            balance: providerResult.balance,
            balanceCurrency: currency.shortName,
            balanceSyncedAt: now,
            lastSyncAt: now,
            syncStatus: 'SUCCESS',
          },
          $unset: { syncError: 1 },
        }
      );

      const result = {
        apiId,
        apiName: api.name,
        group: api.group,
        providerProducts: providerResult.products.length,
        importedProducts: importedProducts.length,
        updated,
        unavailable,
        missing,
        balance: providerResult.balance,
        balanceCurrency: currency.shortName,
      };

      await AuditLog.create({
        actorId,
        targetId: api._id,
        action: actorId ? 'SETTINGS_API_FORCE_SYNCED' : 'SETTINGS_API_CRON_SYNCED',
        entity: 'SettingsApi',
        after: result,
        ip,
        userAgent,
      }).catch((error) => logger.error('API sync audit log failed', error));

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'API sync failed';
      await SettingsApi.updateOne({ _id: api._id }, { $set: { syncStatus: 'ERROR', syncError: message, lastSyncAt: now } });
      throw error;
    }
  }

  static async syncAll(actorId?: string, ip?: string, userAgent?: string) {
    const apis = await SettingsApi.find({ isDeleted: { $ne: true }, isVisible: true, group: { $in: supportedSyncGroups } }).select('_id').lean();
    const results: SyncResult[] = [];
    const errors: Array<{ apiId: string; message: string }> = [];

    for (const api of apis) {
      try {
        results.push(await this.syncApi(String(api._id), actorId, ip, userAgent));
      } catch (error) {
        errors.push({ apiId: String(api._id), message: error instanceof Error ? error.message : 'API sync failed' });
      }
    }

    return { results, errors, total: apis.length };
  }
}
