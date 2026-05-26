import { randomUUID } from 'crypto';
import mongoose, { ClientSession } from 'mongoose';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { translate } from '../../config/i18n.config';
import { redisDel } from '../../config/redis.config';
import { withTransaction } from '../../database/transaction';
import { AuditLog } from '../audit/audit-log.model';
import { ClientFinancialMovement } from '../admin-clients/client-financial-movement.model';
import { UserLevelGroupe } from '../admin-clients/user-level-groupe.model';
import { NotificationsService } from '../notifications/notifications.service';
import { PricingService } from '../pricing/pricing.service';
import { ApiGroup, SettingsApi } from '../settings-apis/settings-api.model';
import { GiftCardProvidersProvider, getGiftCardProviderErrorInfo } from '../settings-apis/providers/gift-card-providers.provider';
import { GiftCardProviders2Provider } from '../settings-apis/providers/gift-card-providers-2.provider';
import { SocialMediaServiceProvidersProvider } from '../settings-apis/providers/social-media-service-providers.provider';
import { TemporaryNumberCodingSitesProvider } from '../settings-apis/providers/temporary-number-coding-sites.provider';
import { StockProduct } from '../stock-products/stock-product.model';
import { StockProductApiConnection } from '../stock-products/stock-product-api-connection.model';
import { StockProductRequirement } from '../stock-product-requirements/stock-product-requirement.model';
import { StockPromotionService } from '../stock-promotions/stock-promotion.service';
import { StockServiceGroup } from '../stock-service-groups/stock-service-group.model';
import { StockWarehouse } from '../stock-warehouses/stock-warehouse.model';
import { StockWarehouseItem } from '../stock-warehouses/stock-warehouse-item.model';
import { StockWarehouseMovement } from '../stock-warehouses/stock-warehouse-movement.model';
import { User } from '../users/user.model';
import { emitToAdmins, ORDER_UPDATED } from '../../sockets/socket.events';
import { IOrder, Order, OrderDeliveredItem, OrderFulfillmentSource } from './order.model';
import { Role } from '../roles/role.model';
import { requestOrderStatusSchedule } from '../../jobs/order-status.events';

interface CreateOrderInput {
  clientId: string;
  productId: string;
  quantity: number;
  requirements?: Record<string, string>;
}

const orderPopulate = [
  { path: 'clientId', select: 'name email username phoneNumber balance openCredit countryFlag' },
  { path: 'productId', select: 'name image fulfillmentType apiGroup' },
  { path: 'serviceId', select: 'name type' },
  { path: 'categoryId', select: 'name serviceId' },
  { path: 'assignedAdminId', select: 'name email username' },
  { path: 'createdBy', select: 'name email username' },
];

const createOrderNumber = () => `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

const toObjectId = (value: string | mongoose.Types.ObjectId) => new mongoose.Types.ObjectId(value);

interface ProviderAuditRequest {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: Record<string, string>;
  curl: string;
}

const maskSecret = (value: string) => {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

const buildCurl = (request: Omit<ProviderAuditRequest, 'curl'>) => {
  const parts = ['curl', '-X', request.method, shellQuote(request.url)];
  Object.entries(request.headers).forEach(([key, value]) => {
    parts.push('-H', shellQuote(`${key}: ${value}`));
  });
  if (request.body) {
    parts.push('--data', shellQuote(new URLSearchParams(request.body).toString()));
  }
  return parts.join(' ');
};

const providerBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
};

const handlerUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  if (url.pathname && url.pathname !== '/') return url.toString();
  return new URL('/stubs/handler_api.php', url.origin).toString();
};

const parseGiftCardProvider2Auth = (token: string) => {
  const trimmed = token.trim();
  try {
    const parsed = JSON.parse(trimmed) as Partial<{ kod: string; sifre: string }>;
    if (parsed.kod && parsed.sifre) return { kod: String(parsed.kod), sifre: String(parsed.sifre) };
  } catch {
    // Fall back to kod:sifre format.
  }
  const [kod, ...passwordParts] = trimmed.split(':');
  return { kod: kod || '', sifre: passwordParts.join(':') };
};

const requestWithCurl = (request: Omit<ProviderAuditRequest, 'curl'>): ProviderAuditRequest => ({
  ...request,
  curl: buildCurl(request),
});

const buildGetRequest = (url: URL, headers: Record<string, string>): ProviderAuditRequest =>
  requestWithCurl({ method: 'GET', url: url.toString(), headers });

const buildGiftCardProviderRequest = (
  baseUrl: string,
  token: string,
  path: string,
  query: Record<string, string> = {}
) => {
  const url = new URL(`${providerBaseUrl(baseUrl)}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return buildGetRequest(url, { 'api-token': maskSecret(token), accept: 'application/json' });
};

const buildSocialMediaProviderRequest = (
  baseUrl: string,
  token: string,
  action: string,
  params: Record<string, string> = {}
) => {
  const body = { key: maskSecret(token), action, ...params };
  return requestWithCurl({
    method: 'POST',
    url: providerBaseUrl(baseUrl),
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
};

const buildGiftCardProvider2Request = (
  baseUrl: string,
  token: string,
  path: string,
  params: Record<string, string> = {},
  authCodeKey = 'kod'
) => {
  const auth = parseGiftCardProvider2Auth(token);
  const url = new URL(`${providerBaseUrl(baseUrl)}${path}`);
  url.searchParams.set(authCodeKey, maskSecret(auth.kod));
  url.searchParams.set('sifre', maskSecret(auth.sifre));
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });
  return buildGetRequest(url, { accept: '*/*' });
};

const buildTemporaryNumberProviderRequest = (
  baseUrl: string,
  token: string,
  action: string,
  params: Record<string, string> = {}
) => {
  const url = new URL(handlerUrl(baseUrl));
  url.searchParams.set('api_key', maskSecret(token));
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });
  return buildGetRequest(url, { accept: '*/*' });
};

const recalculateWarehouseCounts = async (warehouseId: string | mongoose.Types.ObjectId, session: ClientSession) => {
  const [availableQuantity, reservedQuantity, soldQuantity, disabledQuantity, totalQuantity] = await Promise.all([
    StockWarehouseItem.countDocuments({ warehouseId, status: 'AVAILABLE', isDeleted: false }).session(session),
    StockWarehouseItem.countDocuments({ warehouseId, status: 'RESERVED', isDeleted: false }).session(session),
    StockWarehouseItem.countDocuments({ warehouseId, status: 'SOLD', isDeleted: false }).session(session),
    StockWarehouseItem.countDocuments({ warehouseId, status: 'DISABLED', isDeleted: false }).session(session),
    StockWarehouseItem.countDocuments({ warehouseId, isDeleted: false }).session(session),
  ]);
  await StockWarehouse.updateOne(
    { _id: warehouseId },
    { $set: { availableQuantity, reservedQuantity, soldQuantity, disabledQuantity, totalQuantity } },
    { session }
  );
};

const normalizeRequirementValue = (value: unknown) => String(value ?? '').trim();

const responseRecord = (response: unknown) =>
  response && typeof response === 'object' ? response as Record<string, unknown> : { raw: response };

const extractProviderOrderId = (response: unknown) => {
  if (!response || typeof response !== 'object') return undefined;
  const record = response as Record<string, unknown>;
  return String(record.order || record.order_id || record.id || record.uuid || record.reference || '').trim() || undefined;
};

const providerHasError = (response: unknown) => {
  if (!response || typeof response !== 'object') return false;
  const record = response as Record<string, unknown>;
  const parsed = record.parsed && typeof record.parsed === 'object' ? record.parsed as Record<string, unknown> : null;
  if (record.error || record.errorInfo) return true;
  if (record.success === false) return true;
  if (record.code && !['1', '2', 'OK'].includes(String(record.code))) return true;
  if (parsed) {
    const parsedCode = Number(parsed.code);
    const parsedStatus = String(parsed.status || '').trim();
    if (Number.isFinite(parsedCode) && ![1, 2].includes(parsedCode)) return true;
    if (parsedStatus && parsedStatus !== 'OK' && !['1', '2'].includes(parsedStatus)) return true;
  }
  return false;
};

const findProviderErrorCode = (response: unknown): unknown => {
  if (!response || typeof response !== 'object') return null;
  const record = response as Record<string, unknown>;
  return record.code ?? record.error_code ?? record.errorCode ?? record.err_code ?? record.status_code ?? null;
};

const getProviderIssueReason = (apiGroup: string | undefined, response: unknown) => {
  if (apiGroup === 'GIFT_CARD_PROVIDERS') {
    const errorInfo = getGiftCardProviderErrorInfo(findProviderErrorCode(response));
    if (errorInfo) return `GIFT_CARD_PROVIDER_${errorInfo.key}`;
  }
  if (apiGroup === 'GIFT_CARD_PROVIDERS_2') {
    const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
    const parsed = record.parsed && typeof record.parsed === 'object' ? record.parsed as Record<string, unknown> : null;
    if (parsed && Number(parsed.code) === 3) return 'GIFT_CARD_PROVIDER_2_CANCELLED';
    if (parsed) {
      const parsedCode = Number(parsed.code);
      const parsedStatus = String(parsed.status || '').trim();
      if (Number.isFinite(parsedCode) && parsedCode !== 2) return 'GIFT_CARD_PROVIDER_2_REQUEST_FAILED';
      if (parsedStatus && parsedStatus !== 'OK' && parsedStatus !== '2') return 'GIFT_CARD_PROVIDER_2_REQUEST_FAILED';
    }
  }
  return 'API_PROVIDER_RETURNED_ERROR';
};

const getIssueFinalStatus = (issueReason: string): 'FAILED' | 'CANCELLED' => {
  if (
    issueReason === 'GIFT_CARD_PROVIDER_2_CANCELLED' ||
    issueReason === 'TEMPORARY_NUMBER_STATUS_CANCELLED'
  ) {
    return 'CANCELLED';
  }
  return 'FAILED';
};

const getProviderExceptionIssueReason = (apiGroup: string | undefined, error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  if (apiGroup === 'GIFT_CARD_PROVIDERS' && message === 'settingsApis.gift_card_provider_request_failed') {
    return 'GIFT_CARD_PROVIDER_REQUEST_FAILED';
  }
  if (apiGroup === 'GIFT_CARD_PROVIDERS_2' && message === 'settingsApis.gift_card_provider_2_request_failed') {
    return 'GIFT_CARD_PROVIDER_2_REQUEST_FAILED';
  }
  if (apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' && message === 'settingsApis.social_media_provider_request_failed') {
    return 'SOCIAL_MEDIA_PROVIDER_REQUEST_FAILED';
  }
  if ((apiGroup === 'TEMPORARY_NUMBER_CODING_SITES' || apiGroup === 'RENEWABLE_NUMBER_CODING_SITES') && message === 'settingsApis.temporary_number_provider_request_failed') {
    return 'TEMPORARY_NUMBER_PROVIDER_REQUEST_FAILED';
  }
  return message && !message.startsWith('settingsApis.') ? message : 'API_REQUEST_FAILED';
};

const getRequirementValue = (values: Record<string, string>, keys: string[]) => {
  const entry = Object.entries(values).find(([key]) => keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()));
  return entry ? String(entry[1] || '').trim() : '';
};

const getGiftCardProviderPlayerId = (values: Record<string, string>) => {
  const direct = getRequirementValue(values, [
    'playerId',
    'player_id',
    'playerID',
    'Player ID',
    'PlayerID',
    'User ID',
    'userId',
    'user_id',
    'id',
  ]);
  if (direct) return direct;
  return Object.values(values).map((value) => String(value || '').trim()).find(Boolean) || '';
};

const buildGiftCardProviderOrderParams = (values: Record<string, string>) => {
  const playerId = getGiftCardProviderPlayerId(values);
  const params: Record<string, string> = {};
  if (playerId) params.playerId = playerId;
  return params;
};

const getNumberCodingCountries = (payload?: Record<string, unknown>) => {
  const qtyValues = payload?.qtyValues && typeof payload.qtyValues === 'object'
    ? payload.qtyValues as Record<string, unknown>
    : {};
  const directCountries = Array.isArray(payload?.countries) ? payload?.countries : undefined;
  const qtyCountries = Array.isArray(qtyValues.countries) ? qtyValues.countries : undefined;
  return (directCountries || qtyCountries || []) as Array<Record<string, unknown>>;
};

const getNumberCodingCountryPrice = (payload: Record<string, unknown> | undefined, countryCode: string) => {
  const country = getNumberCodingCountries(payload).find((item) => String(item.countryCode || item.country || '') === countryCode);
  const price = Number(country?.price);
  return Number.isFinite(price) ? price : undefined;
};

const resolveWarehouseItemsCost = async (items: Array<{ warehouseId: mongoose.Types.ObjectId }>, session: ClientSession) => {
  const warehouseIds = Array.from(new Set(items.map((item) => item.warehouseId.toString())));
  const warehouses = await StockWarehouse.find({ _id: { $in: warehouseIds }, isDeleted: false, isVisible: true })
    .select('costPrice')
    .session(session)
    .lean();
  const costsByWarehouse = new Map(warehouses.map((warehouse) => [warehouse._id.toString(), warehouse.costPrice || 0]));
  return items.reduce((sum, item) => sum + (costsByWarehouse.get(item.warehouseId.toString()) || 0), 0);
};

const isTemporaryNumberGroup = (group?: string) =>
  group === 'TEMPORARY_NUMBER_CODING_SITES' || group === 'RENEWABLE_NUMBER_CODING_SITES';

const defaultStatusCheckIntervalMs = 20 * 1000;
const socialMediaStatusCheckIntervalMs = 20 * 1000;
const maxStatusCheckAttempts = 180;

type ProviderPollResult =
  | { state: 'PENDING'; providerResponse: Record<string, unknown>; providerStatus?: string }
  | { state: 'COMPLETED'; providerResponse: Record<string, unknown>; providerStatus?: string; deliveredItems?: OrderDeliveredItem[] }
  | { state: 'ISSUE'; providerResponse: Record<string, unknown>; providerStatus?: string; issueReason: string };

const providerCompletedStatuses = new Set(['completed', 'complete', 'done', 'success', 'successful', 'approved', 'approved transaction', 'approved_pin_loaded', 'accept', 'accepted', '2']);
const providerPendingStatuses = new Set(['pending', 'processing', 'in progress', 'in_progress', 'wait', 'waiting', 'submitted', '1', '8']);
const providerIssueStatuses = new Set(['cancelled', 'canceled', 'cancel', 'failed', 'failure', 'error', 'rejected', 'declined', '3']);

const normalizeProviderStatus = (value: unknown) => String(value ?? '').trim().toLowerCase();

const getProviderStatusCandidate = (response: unknown): unknown => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response)) return getProviderStatusCandidate(response[0]);
  const record = response as Record<string, unknown>;
  const parsed = record.parsed && typeof record.parsed === 'object' ? record.parsed as Record<string, unknown> : undefined;
  const candidates = [
    parsed?.statusInfo && typeof parsed.statusInfo === 'object' ? (parsed.statusInfo as Record<string, unknown>).key : undefined,
    parsed?.code,
    parsed?.status,
    record.status,
    record.order_status,
    record.orderStatus,
    record.state,
    record.code,
  ];
  const direct = candidates.find((candidate) => candidate !== undefined && candidate !== null && String(candidate).trim() !== '');
  if (direct !== undefined) return direct;
  const nested = Object.values(record).find((value) => value && typeof value === 'object');
  return nested ? getProviderStatusCandidate(nested) : undefined;
};

const getGenericProviderPollState = (response: unknown): ProviderPollResult['state'] => {
  const status = normalizeProviderStatus(getProviderStatusCandidate(response));
  if (providerCompletedStatuses.has(status)) return 'COMPLETED';
  if (providerIssueStatuses.has(status)) return 'ISSUE';
  if (providerPendingStatuses.has(status)) return 'PENDING';
  return providerHasError(response) ? 'ISSUE' : 'PENDING';
};

const getGiftCardProviderPollState = (response: unknown): ProviderPollResult['state'] => {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const data = Array.isArray(record.data) ? record.data : [];
  const providerOrder = data.find((item) => item && typeof item === 'object') as Record<string, unknown> | undefined;
  const nestedStatus = normalizeProviderStatus(providerOrder?.status);
  if (nestedStatus) {
    if (providerCompletedStatuses.has(nestedStatus)) return 'COMPLETED';
    if (providerIssueStatuses.has(nestedStatus)) return 'ISSUE';
    if (providerPendingStatuses.has(nestedStatus)) return 'PENDING';
  }
  return getGenericProviderPollState(response);
};

const getTemporaryNumberActivationId = (order: Pick<IOrder, 'providerOrderId' | 'deliveredItems'>) => {
  const delivered = order.deliveredItems?.[0];
  const activationId = delivered?.extraData?.activationId || order.providerOrderId;
  return activationId ? String(activationId) : '';
};

const buildLegacyProductApiConnection = (product: any) => {
  if (!product.apiId || !product.apiGroup || !product.apiProductId) return null;
  if (product.fulfillmentType !== 'API') return null;
  if (product.quantityAvailable === false) return null;
  return {
    apiId: product.apiId,
    apiGroup: product.apiGroup,
    apiProductId: product.apiProductId,
    apiProductKey: product.apiProductKey,
    apiPayload: product.apiPayload || {},
    costPrice: product.costPrice,
    forQuantity: product.forQuantity,
    quantityMode: product.quantityMode,
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    customQuantities: product.customQuantities,
    quantityAvailable: product.quantityAvailable,
    isActive: true,
    isDeleted: false,
    isLegacy: true,
  };
};

const getStatusCheckIntervalMs = (apiGroup?: string) =>
  apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? socialMediaStatusCheckIntervalMs : defaultStatusCheckIntervalMs;

export class OrderService {
  private static async callProviderWithAudit<T>(
    input: {
      orderId: string | mongoose.Types.ObjectId;
      actorId: string;
      apiId: string | mongoose.Types.ObjectId;
      apiGroup?: string;
      action: string;
      request: ProviderAuditRequest;
      ip?: string;
      userAgent?: string;
    },
    execute: () => Promise<T>
  ) {
    await AuditLog.create([{
      actorId: input.actorId,
      targetId: input.orderId,
      action: 'ORDER_PROVIDER_REQUEST_SENT',
      entity: 'Order',
      after: {
        apiId: input.apiId,
        apiGroup: input.apiGroup,
        providerAction: input.action,
        request: input.request,
        sensitiveValuesRedacted: true,
      },
      ip: input.ip,
      userAgent: input.userAgent,
    }]);

    try {
      const response = await execute();
      await AuditLog.create([{
        actorId: input.actorId,
        targetId: input.orderId,
        action: 'ORDER_PROVIDER_RESPONSE_RECEIVED',
        entity: 'Order',
        after: {
          apiId: input.apiId,
          apiGroup: input.apiGroup,
          providerAction: input.action,
          request: input.request,
          response: responseRecord(response),
          sensitiveValuesRedacted: true,
        },
        ip: input.ip,
        userAgent: input.userAgent,
      }]);
      return response;
    } catch (error) {
      await AuditLog.create([{
        actorId: input.actorId,
        targetId: input.orderId,
        action: 'ORDER_PROVIDER_REQUEST_FAILED',
        entity: 'Order',
        after: {
          apiId: input.apiId,
          apiGroup: input.apiGroup,
          providerAction: input.action,
          request: input.request,
          error: {
            message: error instanceof Error ? error.message : 'provider_request_failed',
            statusCode: typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: unknown }).statusCode : undefined,
          },
          sensitiveValuesRedacted: true,
        },
        ip: input.ip,
        userAgent: input.userAgent,
      }]);
      throw error;
    }
  }

  static async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    if (query.clientId) filter.clientId = query.clientId;
    if (query.productId) filter.productId = query.productId;
    if (query.status) filter.status = query.status;
    if (query.fulfillmentSource) filter.fulfillmentSource = query.fulfillmentSource;
    if (query.assignedAdminId) filter.assignedAdminId = query.assignedAdminId;
    if (typeof query.needsAdminAction === 'boolean') filter.needsAdminAction = query.needsAdminAction;
    if (query.search) {
      const search = new RegExp(query.search as string, 'i');
      filter.$or = [{ orderNumber: search }, { providerOrderId: search }, { issueReason: search }];
    }

    const [data, total] = await Promise.all([
      Order.find(filter).populate(orderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async getById(id: string) {
    const order = await Order.findById(id).populate(orderPopulate).lean();
    if (!order) throw HttpError.notFound('orders.not_found');
    return order;
  }

  static async getByIdForClient(id: string, clientId: string) {
    const order = await Order.findOne({ _id: id, clientId }).populate(orderPopulate).lean();
    if (!order) throw HttpError.notFound('orders.not_found');
    return order;
  }

  static async create(data: CreateOrderInput, actorId: string, ip?: string, userAgent?: string) {
    const created = await withTransaction(async (session) => {
      const client = await User.findOne({ _id: data.clientId, isDeleted: { $ne: true } }).session(session);
      const product = await StockProduct.findOne({ _id: data.productId, isDeleted: { $ne: true }, isVisible: true })
        .populate('requirements')
        .session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');
      if (!product) throw HttpError.notFound('stockProducts.not_found');

      const requirementSnapshots = await this.buildRequirementSnapshots(product.requirements, data.requirements || {});
      const fulfillment = await this.resolveFulfillment(product, data.quantity, session, data.requirements || {});

      const pricing = await PricingService.calculateForClient({
        clientId: data.clientId,
        productId: data.productId,
        quantity: data.quantity,
        costPriceOverride: fulfillment.costPrice,
        forQuantityOverride: fulfillment.forQuantity,
        fulfillmentTypeOverride: fulfillment.source,
      });
      const promotion = pricing.promotion as ({ _id: mongoose.Types.ObjectId } & Record<string, unknown>) | undefined;
      if (!pricing.canBuyWithOpenCredit) throw HttpError.badRequest('adminClients.insufficient_balance');

      const balanceBefore = client.balance || 0;
      client.balance = pricing.balanceAfterPurchase;
      await client.save({ session });

      const order = new Order({
        orderNumber: createOrderNumber(),
        clientId: client._id,
        productId: product._id,
        serviceId: product.serviceId,
        categoryId: product.categoryId,
        productName: product.name,
        quantity: data.quantity,
        fulfillmentSource: fulfillment.source,
        status: fulfillment.source === 'WAREHOUSE' ? 'COMPLETED' : fulfillment.source === 'API' ? 'PROCESSING' : 'PENDING_MANUAL',
        needsAdminAction: fulfillment.source === 'MANUAL',
        issueReason: fulfillment.source === 'MANUAL' ? 'MANUAL_FULFILLMENT_REQUIRED' : undefined,
        apiConnectionId: fulfillment.apiConnection?._id,
        apiId: fulfillment.apiConnection?.apiId,
        apiGroup: fulfillment.apiConnection?.apiGroup,
        apiProductId: fulfillment.apiConnection?.apiProductId,
        statusCheckAttempts: 0,
        nextStatusCheckAt: fulfillment.source === 'API' ? new Date() : undefined,
        statusCheckStartedAt: fulfillment.source === 'API' ? new Date() : undefined,
        unitCost: pricing.unitCost as number,
        unitPrice: pricing.finalUnitPrice,
        totalPrice: pricing.finalTotalPrice,
        discountAmount: pricing.discountAmount,
        balanceBefore,
        balanceAfter: client.balance,
        promotionId: promotion?._id,
        requirementSnapshots,
        deliveredItems: fulfillment.deliveredItems,
        completedAt: fulfillment.source === 'WAREHOUSE' ? new Date() : undefined,
        createdBy: actorId,
      });
      await order.save({ session });

      const movement = new ClientFinancialMovement({
        clientId: client._id,
        type: 'WITHDRAW',
        amount: pricing.finalTotalPrice,
        source: 'ORDER',
        referenceId: order._id,
        referenceModel: 'Order',
        comment: `order:${order.orderNumber}`,
        balanceBefore,
        balanceAfter: client.balance,
        createdBy: actorId,
      });
      await movement.save({ session });
      order.paymentMovementId = movement._id as mongoose.Types.ObjectId;

      if (fulfillment.source === 'WAREHOUSE' && fulfillment.warehouseItems.length) {
        await this.sellWarehouseItems(order, fulfillment.warehouseItems, actorId, session);
      }

      if (promotion?._id) {
        const usage = await StockPromotionService.recordUsage({
          promotionId: String(promotion._id),
          clientId: String(client._id),
          productId: String(product._id),
          orderId: String(order._id),
          discountAmount: pricing.discountAmount,
          originalPrice: pricing.finalTotalPrice + pricing.discountAmount,
          finalPrice: pricing.finalTotalPrice,
        }, actorId, session, ip, userAgent);
        order.promotionUsageId = usage._id as mongoose.Types.ObjectId;
      }

      if (order.status === 'COMPLETED') {
        await this.applyLevelPoints(order, actorId, session, ip, userAgent);
      }

      await order.save({ session });
      await AuditLog.create([{ actorId, targetId: order._id, action: 'ORDER_CREATED', entity: 'Order', after: order.toObject(), ip, userAgent }], { session });
      await redisDel(`user:${client._id}`);

      return order.toObject();
    });

    if (created.fulfillmentSource === 'API') {
      await this.tryApiFulfillment(created._id.toString(), data.requirements || {}, actorId, ip, userAgent);
    }

    await NotificationsService.createNotification({
      userId: data.clientId,
      type: 'order_created',
      title: translate('notifications.order_created_title', 'en'),
      message: translate('notifications.order_created_message', 'en'),
      data: { titleKey: 'notifications.orderCreatedTitle', messageKey: 'notifications.orderCreatedMessage', orderId: created._id },
    }).catch(() => undefined);

    return this.getById(created._id.toString());
  }

  static async take(id: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      if (order.assignedAdminId && order.assignedAdminId.toString() !== actorId) throw HttpError.forbidden('orders.assigned_to_other_admin');
      const before = order.toObject();
      order.assignedAdminId = toObjectId(actorId);
      order.assignedAt = order.assignedAt || new Date();
      order.updatedBy = toObjectId(actorId);
      await order.save({ session });
      await AuditLog.create([{ actorId, targetId: order._id, action: 'ORDER_TAKEN', entity: 'Order', before, after: order.toObject(), ip, userAgent }], { session });
      return order.toObject();
    });
  }

  static async complete(id: string, data: { deliveredItems?: OrderDeliveredItem[]; providerResponse?: Record<string, unknown> }, actorId: string, ip?: string, userAgent?: string) {
    return await this.updateAssignedOrder(id, actorId, ip, userAgent, async (order, session) => {
      order.status = 'COMPLETED';
      order.needsAdminAction = false;
      order.issueReason = undefined;
      order.completedAt = new Date();
      if (data.deliveredItems) order.deliveredItems = data.deliveredItems;
      if (data.providerResponse) order.providerResponse = data.providerResponse;
      await this.applyLevelPoints(order, actorId, session, ip, userAgent);
    }, 'ORDER_COMPLETED');
  }

  static async fail(id: string, issueReason: string, actorId: string, ip?: string, userAgent?: string) {
    return await this.updateAssignedOrder(id, actorId, ip, userAgent, async (order) => {
      order.status = 'FAILED';
      order.needsAdminAction = true;
      order.issueReason = issueReason;
    }, 'ORDER_FAILED');
  }

  static async switchApi(id: string, data: { connectionId: string; requirements?: Record<string, string> }, actorId: string, ip?: string, userAgent?: string) {
    await withTransaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      this.assertCanOperate(order, actorId);
      if (order.status === 'COMPLETED') throw HttpError.badRequest('orders.completed_switch_api_forbidden');
      if (order.status === 'CANCELLED') throw HttpError.badRequest('orders.cancelled_switch_api_forbidden');

      const connection = await StockProductApiConnection.findOne({
        _id: data.connectionId,
        productId: order.productId,
        isDeleted: { $ne: true },
        quantityAvailable: true,
      }).session(session);
      if (!connection) throw HttpError.notFound('stockProductApiConnections.not_found');

      const before = order.toObject();
      order.fulfillmentSource = 'API';
      order.status = 'PROCESSING';
      order.needsAdminAction = false;
      order.issueReason = undefined;
      order.apiConnectionId = connection._id as mongoose.Types.ObjectId;
      order.apiId = connection.apiId;
      order.apiGroup = connection.apiGroup;
      order.apiProductId = connection.apiProductId;
      order.providerOrderId = undefined;
      order.providerResponse = undefined;
      order.providerStatus = undefined;
      order.statusCheckAttempts = 0;
      order.nextStatusCheckAt = new Date();
      order.statusCheckStartedAt = new Date();
      order.statusCheckLastAt = undefined;
      order.unitCost = connection.costPrice / connection.forQuantity;
      order.requirementSnapshots = await this.buildRequirementSnapshotsForConnection(connection, data.requirements || {});
      order.updatedBy = toObjectId(actorId);
      await order.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: order._id,
        action: 'ORDER_API_SWITCHED',
        entity: 'Order',
        before,
        after: order.toObject(),
        ip,
        userAgent,
      }], { session });
    });

    await this.tryApiFulfillment(id, data.requirements || {}, actorId, ip, userAgent);
    return this.getById(id);
  }

  static async cancel(id: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      this.assertCanOperate(order, actorId);
      if (order.status === 'COMPLETED') throw HttpError.badRequest('orders.completed_cancel_forbidden');
      if (order.status === 'CANCELLED') return order.toObject();

      const before = order.toObject();
      await this.refundOrder(order, actorId, session);
      await StockWarehouseItem.updateMany(
        { soldByOrderId: order._id, status: 'SOLD' },
        { $set: { status: 'AVAILABLE', updatedBy: actorId }, $unset: { soldByOrderId: '', soldToClientId: '', soldAt: '' } },
        { session }
      );
      order.status = 'CANCELLED';
      order.needsAdminAction = false;
      order.cancelledAt = new Date();
      order.updatedBy = toObjectId(actorId);
      await order.save({ session });
      await AuditLog.create([{ actorId, targetId: order._id, action: 'ORDER_CANCELLED', entity: 'Order', before, after: order.toObject(), ip, userAgent }], { session });
      return order.toObject();
    });
  }

  private static async buildRequirementSnapshots(requirements: mongoose.Types.ObjectId[], values: Record<string, string>) {
    const docs = await StockProductRequirement.find({ _id: { $in: requirements }, isDeleted: false }).lean();
    return docs.map((requirement) => {
      const value = normalizeRequirementValue(values[requirement.paramsName] ?? requirement.defaultValue);
      if (requirement.isRequired && !value) throw HttpError.badRequest('orders.requirement_required');
      return {
        requirementId: requirement._id,
        paramsName: requirement.paramsName,
        message: requirement.message,
        value,
      };
    });
  }

  private static async buildRequirementSnapshotsForConnection(connection: { apiGroup: ApiGroup; apiPayload?: Record<string, unknown> }, values: Record<string, string>) {
    const params = Array.isArray(connection.apiPayload?.params)
      ? (connection.apiPayload.params as unknown[]).map((param) => String(param).trim()).filter(Boolean)
      : [];
    if (!params.length) return [];

    const docs = await StockProductRequirement.find({ apiGroup: connection.apiGroup, paramsName: { $in: params }, isDeleted: false }).lean();
    const requirementsByName = new Map(docs.map((requirement) => [requirement.paramsName, requirement]));
    return params.map((paramsName) => {
      const requirement = requirementsByName.get(paramsName);
      const value = normalizeRequirementValue(values[paramsName] ?? requirement?.defaultValue);
      if (!value && (requirement?.isRequired ?? true)) throw HttpError.badRequest('orders.requirement_required');
      return {
        requirementId: requirement?._id,
        paramsName,
        message: requirement?.message || { en: paramsName, fr: paramsName, ar: paramsName },
        value,
      };
    });
  }

  private static async resolveFulfillment(product: any, quantity: number, session: ClientSession, requirementValues: Record<string, string>): Promise<{
    source: OrderFulfillmentSource;
    costPrice: number;
    forQuantity: number;
    warehouseItems: any[];
    deliveredItems: OrderDeliveredItem[];
    apiConnection?: any;
  }> {
    const warehouseItems = await StockWarehouseItem.find({
      productId: product._id,
      status: 'AVAILABLE',
      isDeleted: false,
    }).sort({ createdAt: 1 }).limit(quantity).session(session);

    if (warehouseItems.length >= quantity) {
      const totalCost = await resolveWarehouseItemsCost(warehouseItems, session);
      return {
        source: 'WAREHOUSE',
        costPrice: totalCost,
        forQuantity: quantity,
        warehouseItems,
        deliveredItems: warehouseItems.map((item) => ({
          warehouseItemId: item._id,
          code: item.code,
          serialNumber: item.serialNumber,
          pin: item.pin,
          extraData: item.extraData,
        })),
      };
    }

    const apiConnection = await StockProductApiConnection.findOne({
      productId: product._id,
      isActive: true,
      isDeleted: { $ne: true },
      quantityAvailable: true,
    }).session(session);
    if (apiConnection) {
      const countryCode = getRequirementValue(requirementValues, ['countryCode', 'country']);
      const dynamicCountryPrice = isTemporaryNumberGroup(apiConnection.apiGroup)
        ? getNumberCodingCountryPrice(apiConnection.apiPayload, countryCode)
        : undefined;
      return {
        source: 'API',
        costPrice: dynamicCountryPrice ?? apiConnection.costPrice,
        forQuantity: apiConnection.forQuantity,
        warehouseItems: [],
        deliveredItems: [],
        apiConnection,
      };
    }

    const legacyApiConnection = buildLegacyProductApiConnection(product);
    if (legacyApiConnection) {
      const countryCode = getRequirementValue(requirementValues, ['countryCode', 'country']);
      const dynamicCountryPrice = isTemporaryNumberGroup(legacyApiConnection.apiGroup)
        ? getNumberCodingCountryPrice(legacyApiConnection.apiPayload, countryCode)
        : undefined;
      return {
        source: 'API',
        costPrice: dynamicCountryPrice ?? legacyApiConnection.costPrice,
        forQuantity: legacyApiConnection.forQuantity,
        warehouseItems: [],
        deliveredItems: [],
        apiConnection: legacyApiConnection,
      };
    }

    return {
      source: 'MANUAL',
      costPrice: product.costManual ?? product.costPrice,
      forQuantity: product.forQuantity,
      warehouseItems: [],
      deliveredItems: [],
    };
  }

  private static async sellWarehouseItems(order: IOrder, items: any[], actorId: string, session: ClientSession) {
    const itemIds = items.map((item) => item._id);
    await StockWarehouseItem.updateMany(
      { _id: { $in: itemIds }, status: 'AVAILABLE', isDeleted: false },
      {
        $set: {
          status: 'SOLD',
          soldByOrderId: order._id,
          soldToClientId: order.clientId,
          soldAt: new Date(),
          updatedBy: actorId,
        },
      },
      { session }
    );
    const warehouseIds = Array.from(new Set(items.map((item) => item.warehouseId.toString())));
    for (const warehouseId of warehouseIds) {
      await recalculateWarehouseCounts(warehouseId, session);
      const warehouseItems = items.filter((item) => item.warehouseId.toString() === warehouseId);
      await StockWarehouseMovement.create([{
        warehouseId,
        productId: order.productId,
        type: 'SALE',
        quantity: warehouseItems.length,
        orderId: order._id,
        clientId: order.clientId,
        beforeStatus: 'AVAILABLE',
        afterStatus: 'SOLD',
        createdBy: actorId,
      }], { session });
    }
  }

  private static async applyLevelPoints(order: IOrder, actorId: string, session: ClientSession, ip?: string, userAgent?: string) {
    if (order.levelPointsApplied) return;

    const pointsToAdd = Number(order.totalPrice);
    if (!Number.isFinite(pointsToAdd) || pointsToAdd <= 0) {
      order.levelPointsApplied = true;
      order.levelPointsAppliedAt = new Date();
      order.levelPointsAmount = 0;
      return;
    }

    const groups = await StockServiceGroup.find({ serviceId: order.serviceId, isDeleted: { $ne: true } })
      .sort({ entitlementValue: 1, createdAt: 1 })
      .session(session);
    if (!groups.length) return;

    let level = await UserLevelGroupe.findOne({ clientId: order.clientId, serviceId: order.serviceId }).session(session);
    if (!level) {
      const defaultGroup = groups.find((group) => group.isDefault) || groups[0];
      level = new UserLevelGroupe({
        clientId: order.clientId,
        serviceId: order.serviceId,
        groupId: defaultGroup._id,
        points: 0,
      });
    }

    const before = level.toObject();
    level.points = Number((level.points + pointsToAdd).toFixed(6));

    const targetGroup = groups.reduce((selected, group) => {
      if (level.points < group.entitlementValue) return selected;
      if (!selected || selected.entitlementValue <= group.entitlementValue) return group;
      return selected;
    }, undefined as typeof groups[number] | undefined);

    if (targetGroup) level.groupId = targetGroup._id as mongoose.Types.ObjectId;
    await level.save({ session });

    order.levelPointsApplied = true;
    order.levelPointsAppliedAt = new Date();
    order.levelPointsAmount = pointsToAdd;

    await AuditLog.create([{
      actorId,
      targetId: level._id,
      action: 'ORDER_LEVEL_POINTS_APPLIED',
      entity: 'UserLevelGroupe',
      before,
      after: {
        ...level.toObject(),
        orderId: order._id,
        orderNumber: order.orderNumber,
        pointsAdded: pointsToAdd,
      },
      ip,
      userAgent,
    }], { session });
  }

  private static async tryApiFulfillment(orderId: string, requirementValues: Record<string, string>, actorId: string, ip?: string, userAgent?: string) {
    const order = await Order.findById(orderId).lean();
    if (!order) return;
    let connection: any = order.apiConnectionId
      ? await StockProductApiConnection.findById(order.apiConnectionId).lean()
      : null;
    if (!connection) {
      const product = await StockProduct.findById(order.productId).lean();
      connection = buildLegacyProductApiConnection(product);
    }
    if (!connection) return this.markApiIssue(orderId, 'API_CONNECTION_NOT_FOUND', actorId, ip, userAgent);
    const api = await SettingsApi.findById(connection.apiId).select('+token').lean();
    if (!api) return this.markApiIssue(orderId, 'API_NOT_FOUND', actorId, ip, userAgent);

    try {
      const credentials = { baseUrl: api.link, token: api.token };
      let response: unknown;
      if (connection.apiGroup === 'GIFT_CARD_PROVIDERS') {
        const providerParams = buildGiftCardProviderOrderParams(requirementValues);
        const params = {
          productId: Number(connection.apiProductId),
          quantity: order.quantity,
          orderUuid: order.orderNumber,
          params: providerParams,
        };
        response = await this.callProviderWithAudit({
          orderId,
          actorId,
          apiId: api._id,
          apiGroup: connection.apiGroup,
          action: 'CREATE_ORDER',
          request: buildGiftCardProviderRequest(api.link, api.token, `/client/api/newOrder/${params.productId}/params`, {
            qty: String(params.quantity),
            order_uuid: params.orderUuid,
            ...(params.params || {}),
          }),
          ip,
          userAgent,
        }, () => GiftCardProvidersProvider.createOrder(credentials, params));
      } else if (connection.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
        const params = { ...requirementValues };
        const link = params.link || params.Link || '';
        delete params.link;
        delete params.Link;
        const input = {
          apiId: String(api._id),
          action: 'ADD_ORDER',
          service: connection.apiProductId,
          link,
          quantity: String(order.quantity),
          params,
        } as const;
        response = await this.callProviderWithAudit({
          orderId,
          actorId,
          apiId: api._id,
          apiGroup: connection.apiGroup,
          action: 'ADD_ORDER',
          request: buildSocialMediaProviderRequest(api.link, api.token, 'add', {
            service: input.service,
            link: input.link,
            quantity: input.quantity,
            ...params,
          }),
          ip,
          userAgent,
        }, () => SocialMediaServiceProvidersProvider.simulate(credentials, input));
      } else if (connection.apiGroup === 'GIFT_CARD_PROVIDERS_2') {
        const payload = connection.apiPayload || {};
        const params = {
          gameId: String(payload.oyun_id || payload.gameId || ''),
          denomination: String(payload.kupur || payload.denomination || connection.apiProductId),
          reference: order.orderNumber,
          customerPhone: requirementValues.customerPhone || requirementValues.musteri_tel || requirementValues.phone || '',
          playerInfo: requirementValues.playerInfo || requirementValues.oyuncu_bilgi || requirementValues.UserID || requirementValues['User ID'] || '',
        };
        response = await this.callProviderWithAudit({
          orderId,
          actorId,
          apiId: api._id,
          apiGroup: connection.apiGroup,
          action: 'SUBMIT_PIN',
          request: buildGiftCardProvider2Request(api.link, api.token, '/servis/pin_ekle.php', {
            oyun: params.gameId,
            kupur: params.denomination,
            referans: params.reference,
            musteri_tel: params.customerPhone,
            oyuncu_bilgi: params.playerInfo,
          }),
          ip,
          userAgent,
        }, () => GiftCardProviders2Provider.submitPin(credentials, params));
      } else if (connection.apiGroup === 'TEMPORARY_NUMBER_CODING_SITES' || connection.apiGroup === 'RENEWABLE_NUMBER_CODING_SITES') {
        const country = getRequirementValue(requirementValues, ['countryCode', 'country']);
        if (!country) return this.markApiIssue(orderId, 'COUNTRY_CODE_REQUIRED', actorId, ip, userAgent);
        const input = {
          apiId: String(api._id),
          action: 'GET_NUMBER',
          service: String((connection.apiPayload || {}).serviceCode || connection.apiProductId),
          country,
        } as const;
        response = await this.callProviderWithAudit({
          orderId,
          actorId,
          apiId: api._id,
          apiGroup: connection.apiGroup,
          action: 'GET_NUMBER',
          request: buildTemporaryNumberProviderRequest(api.link, api.token, 'getNumber', {
            service: input.service,
            country: input.country,
          }),
          ip,
          userAgent,
        }, () => TemporaryNumberCodingSitesProvider.simulate(credentials, input));
      } else {
        return this.markApiIssue(orderId, 'API_GROUP_REQUIRES_MANUAL_PROCESSING', actorId, ip, userAgent);
      }

      const hasError = providerHasError(response);
      await withTransaction(async (session) => {
        const freshOrder = await Order.findById(orderId).session(session);
        if (!freshOrder) throw HttpError.notFound('orders.not_found');
        const before = freshOrder.toObject();
        freshOrder.providerResponse = responseRecord(response);
        const parsed = response && typeof response === 'object' ? (response as Record<string, any>).parsed : null;
        const issueReason = hasError ? getProviderIssueReason(connection.apiGroup, response) : undefined;
        freshOrder.providerOrderId = parsed?.activationId || extractProviderOrderId(response);
        freshOrder.providerStatus = hasError ? 'ERROR' : 'SUBMITTED';
        freshOrder.status = hasError ? getIssueFinalStatus(issueReason || 'API_PROVIDER_RETURNED_ERROR') : 'PROCESSING';
        freshOrder.needsAdminAction = hasError;
        freshOrder.issueReason = issueReason;
        freshOrder.nextStatusCheckAt = hasError ? undefined : new Date(Date.now() + getStatusCheckIntervalMs(connection.apiGroup));
        if (freshOrder.status === 'CANCELLED') freshOrder.cancelledAt = new Date();
        if (parsed?.type === 'ACCESS_NUMBER') {
          freshOrder.deliveredItems = [{
            code: parsed.phoneNumber,
            extraData: {
              activationId: parsed.activationId,
              phoneNumber: parsed.phoneNumber,
              country: getRequirementValue(requirementValues, ['countryCode', 'country']),
            },
          }];
          freshOrder.providerStatus = 'WAITING_CODE';
        }
        freshOrder.updatedBy = toObjectId(actorId);
        await freshOrder.save({ session });
        await AuditLog.create([{ actorId, targetId: freshOrder._id, action: 'ORDER_API_SUBMITTED', entity: 'Order', before, after: freshOrder.toObject(), ip, userAgent }], { session });
      });
      this.emitOrderUpdated(orderId);
    } catch (error) {
      await this.markApiIssue(orderId, getProviderExceptionIssueReason(connection.apiGroup, error), actorId, ip, userAgent);
    }
  }

  static async pollPendingApiOrders(limit = 50) {
    const orders = await Order.find({
      fulfillmentSource: 'API',
      status: 'PROCESSING',
      needsAdminAction: false,
      apiId: { $exists: true, $ne: null },
      apiGroup: { $exists: true, $ne: null },
      $or: [
        { nextStatusCheckAt: { $exists: false } },
        { nextStatusCheckAt: null },
        { nextStatusCheckAt: { $lte: new Date() } },
      ],
    })
      .sort({ updatedAt: 1 })
      .limit(limit)
      .lean();

    const summary = { checked: 0, completed: 0, issues: 0, pending: 0, errors: 0 };

    for (const order of orders) {
      const result = await this.pollPendingApiOrder(String(order._id), true);
      if (!result) continue;
      summary.checked += 1;
      summary[result] += 1;
    }

    return summary;
  }

  static async pollPendingApiOrder(orderId: string, requireDue = false): Promise<'completed' | 'issues' | 'pending' | 'errors' | null> {
    const filter: Record<string, unknown> = {
      _id: orderId,
      fulfillmentSource: 'API',
      status: 'PROCESSING',
      needsAdminAction: false,
      apiId: { $exists: true, $ne: null },
      apiGroup: { $exists: true, $ne: null },
    };
    if (requireDue) {
      filter.$or = [
        { nextStatusCheckAt: { $exists: false } },
        { nextStatusCheckAt: null },
        { nextStatusCheckAt: { $lte: new Date() } },
      ];
    }

    const order = await Order.findOne(filter).lean();
    if (!order) return null;

    try {
      const result = await this.checkProviderOrderStatus(order as unknown as IOrder);
      if (!result) return null;
      const attempts = Number(order.statusCheckAttempts || 0) + 1;
      if (attempts >= maxStatusCheckAttempts && result.state === 'PENDING') {
        await this.applyProviderPollResult(String(order._id), {
          state: 'ISSUE',
          providerResponse: result.providerResponse,
          providerStatus: 'MAX_STATUS_CHECK_ATTEMPTS',
          issueReason: 'ORDER_STATUS_CHECK_MAX_ATTEMPTS_REACHED',
        }, String(order.createdBy), attempts);
        return 'issues';
      }

      await this.applyProviderPollResult(String(order._id), result, String(order.createdBy), attempts);
      if (result.state === 'COMPLETED') return 'completed';
      if (result.state === 'ISSUE') return 'issues';
      return 'pending';
    } catch {
      return 'errors';
    }
  }

  private static async checkProviderOrderStatus(order: IOrder): Promise<ProviderPollResult | null> {
    const api = await SettingsApi.findById(order.apiId).select('+token').lean();
    if (!api) {
      return {
        state: 'ISSUE',
        providerResponse: { error: 'API_NOT_FOUND' },
        providerStatus: 'ERROR',
        issueReason: 'API_NOT_FOUND',
      };
    }

    const credentials = { baseUrl: api.link, token: api.token };
    const auditBase = {
      orderId: order._id,
      actorId: String(order.createdBy),
      apiId: api._id,
      apiGroup: order.apiGroup,
    };

    if (order.apiGroup === 'GIFT_CARD_PROVIDERS') {
      const params = { orders: [order.orderNumber], byUuid: true };
      const response = await this.callProviderWithAudit({
        ...auditBase,
        action: 'CHECK_ORDERS',
        request: buildGiftCardProviderRequest(api.link, api.token, '/client/api/check', {
          orders: params.orders.join(','),
          uuid: '1',
        }),
      }, () => GiftCardProvidersProvider.checkOrders(credentials, params));
      const providerResponse = responseRecord(response);
      const state = getGiftCardProviderPollState(response);
      return state === 'ISSUE'
        ? { state, providerResponse, providerStatus: 'ERROR', issueReason: getProviderIssueReason(order.apiGroup, response) }
        : { state, providerResponse, providerStatus: state };
    }

    if (order.apiGroup === 'GIFT_CARD_PROVIDERS_2') {
      const response = await this.callProviderWithAudit({
        ...auditBase,
        action: 'CHECK_PIN',
        request: buildGiftCardProvider2Request(api.link, api.token, '/servis/pin_kontrol.php', { tahsilat_api_islem_id: order.orderNumber }),
      }, () => GiftCardProviders2Provider.checkPin(credentials, order.orderNumber));
      const providerResponse = responseRecord(response);
      const parsed = response && typeof response === 'object' ? (response as Record<string, any>).parsed : undefined;
      if (Number(parsed?.code) === 2) {
        const loadedPin = String(parsed?.loadedPin || '').trim();
        return {
          state: 'COMPLETED',
          providerResponse,
          providerStatus: 'APPROVED_PIN_LOADED',
          deliveredItems: loadedPin ? [{ pin: loadedPin, code: loadedPin, extraData: { description: parsed?.description } }] : undefined,
        };
      }
      if (Number(parsed?.code) === 3) {
        return { state: 'ISSUE', providerResponse, providerStatus: 'CANCELLED', issueReason: 'GIFT_CARD_PROVIDER_2_CANCELLED' };
      }
      if (Number.isFinite(Number(parsed?.code)) && ![1, 2].includes(Number(parsed?.code))) {
        return {
          state: 'ISSUE',
          providerResponse,
          providerStatus: `CODE_${parsed?.code}`,
          issueReason: 'GIFT_CARD_PROVIDER_2_REQUEST_FAILED',
        };
      }
      return { state: 'PENDING', providerResponse, providerStatus: 'PENDING' };
    }

    if (order.apiGroup === 'SOCIAL_MEDIA_SERVICE_PROVIDERS') {
      if (!order.providerOrderId) return null;
      const input = {
        apiId: String(api._id),
        action: 'ORDER_STATUS',
        order: order.providerOrderId,
      } as const;
      const response = await this.callProviderWithAudit({
        ...auditBase,
        action: 'ORDER_STATUS',
        request: buildSocialMediaProviderRequest(api.link, api.token, 'status', { order: order.providerOrderId }),
      }, () => SocialMediaServiceProvidersProvider.simulate(credentials, input));
      const providerResponse = responseRecord(response);
      const state = getGenericProviderPollState(response);
      return state === 'ISSUE'
        ? { state, providerResponse, providerStatus: 'ERROR', issueReason: 'SOCIAL_MEDIA_PROVIDER_ORDER_FAILED' }
        : { state, providerResponse, providerStatus: state };
    }

    if (isTemporaryNumberGroup(order.apiGroup)) {
      const activationId = getTemporaryNumberActivationId(order);
      if (!activationId) return null;
      const input = {
        apiId: String(api._id),
        action: 'GET_STATUS',
        activationId,
      } as const;
      const response = await this.callProviderWithAudit({
        ...auditBase,
        action: 'GET_STATUS',
        request: buildTemporaryNumberProviderRequest(api.link, api.token, 'getStatus', { id: activationId }),
      }, () => TemporaryNumberCodingSitesProvider.simulate(credentials, input));
      const providerResponse = responseRecord(response);
      const parsed = response && typeof response === 'object' ? (response as Record<string, any>).parsed : undefined;
      if (parsed?.type === 'STATUS_OK') {
        const delivered = order.deliveredItems?.[0] || {};
        return {
          state: 'COMPLETED',
          providerResponse,
          providerStatus: 'STATUS_OK',
          deliveredItems: [{
            ...delivered,
            code: parsed.code,
            extraData: {
              ...(delivered.extraData || {}),
              smsCode: parsed.code,
            },
          }],
        };
      }
      if (parsed?.type === 'STATUS_CANCEL' || responseRecord(response).errorInfo) {
        return { state: 'ISSUE', providerResponse, providerStatus: parsed?.type || 'ERROR', issueReason: parsed?.type === 'STATUS_CANCEL' ? 'TEMPORARY_NUMBER_STATUS_CANCELLED' : 'TEMPORARY_NUMBER_PROVIDER_REQUEST_FAILED' };
      }
      return { state: 'PENDING', providerResponse, providerStatus: parsed?.type || 'WAITING_CODE' };
    }

    return null;
  }

  private static async applyProviderPollResult(orderId: string, result: ProviderPollResult, actorId: string, attempts?: number) {
    if (result.state === 'ISSUE') {
      await this.markApiIssue(orderId, result.issueReason, actorId, undefined, undefined, result.providerResponse, result.providerStatus, attempts);
      return;
    }

    await withTransaction(async (session) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      if (order.status !== 'PROCESSING' || order.needsAdminAction) return;

      const before = order.toObject();
      order.providerResponse = result.providerResponse;
      order.providerStatus = result.providerStatus || result.state;
      order.statusCheckAttempts = attempts ?? order.statusCheckAttempts ?? 0;
      order.statusCheckLastAt = new Date();
      order.updatedBy = toObjectId(actorId);

      if (result.state === 'COMPLETED') {
        order.status = 'COMPLETED';
        order.needsAdminAction = false;
        order.issueReason = undefined;
        order.nextStatusCheckAt = undefined;
        order.completedAt = new Date();
        if (result.deliveredItems) order.deliveredItems = result.deliveredItems;
        await this.applyLevelPoints(order, actorId, session);
      } else {
        order.nextStatusCheckAt = new Date(Date.now() + getStatusCheckIntervalMs(order.apiGroup));
      }

      await order.save({ session });
      await AuditLog.create([{
        actorId,
        targetId: order._id,
        action: result.state === 'COMPLETED' ? 'ORDER_PROVIDER_COMPLETED' : 'ORDER_PROVIDER_STATUS_CHECKED',
        entity: 'Order',
        before,
        after: order.toObject(),
      }], { session });
    });

    this.emitOrderUpdated(orderId);
  }

  private static async markApiIssue(
    orderId: string,
    issueReason: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
    providerResponse?: Record<string, unknown>,
    providerStatus?: string,
    attempts?: number
  ) {
    await withTransaction(async (session) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      const before = order.toObject();
      order.status = getIssueFinalStatus(issueReason);
      order.needsAdminAction = true;
      order.issueReason = issueReason.slice(0, 2000);
      if (providerResponse) order.providerResponse = providerResponse;
      order.providerStatus = providerStatus || 'ERROR';
      order.statusCheckAttempts = attempts ?? order.statusCheckAttempts ?? 0;
      order.statusCheckLastAt = new Date();
      order.nextStatusCheckAt = undefined;
      if (order.status === 'CANCELLED') order.cancelledAt = new Date();
      order.updatedBy = toObjectId(actorId);
      await order.save({ session });
      await AuditLog.create([{ actorId, targetId: order._id, action: 'ORDER_API_ISSUE', entity: 'Order', before, after: order.toObject(), ip, userAgent }], { session });
    });
    await this.notifyAdminsOrderNeedsAttention(orderId).catch(() => undefined);
    this.emitOrderUpdated(orderId);
  }

  private static emitOrderUpdated(orderId: string) {
    emitToAdmins(ORDER_UPDATED, { orderId });
    requestOrderStatusSchedule(orderId);
  }

  private static async notifyAdminsOrderNeedsAttention(orderId: string) {
    const roles = await Role.find({ name: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
    const roleIds = roles.map((role) => role._id);
    if (!roleIds.length) return;
    const admins = await User.find({ role: { $in: roleIds }, isDeleted: { $ne: true }, status: 'active' }).select('_id').lean();
    await Promise.all(admins.map((admin) =>
      NotificationsService.createNotification({
        userId: String(admin._id),
        type: 'order_needs_admin_action',
        title: translate('notifications.order_needs_admin_action_title', 'en'),
        message: translate('notifications.order_needs_admin_action_message', 'en'),
        data: {
          titleKey: 'notifications.orderNeedsAdminActionTitle',
          messageKey: 'notifications.orderNeedsAdminActionMessage',
          orderId,
        },
      }).catch(() => undefined)
    ));
  }

  private static assertCanOperate(order: IOrder, actorId: string) {
    if (order.assignedAdminId && order.assignedAdminId.toString() !== actorId) throw HttpError.forbidden('orders.assigned_to_other_admin');
    if (order.needsAdminAction && !order.assignedAdminId) throw HttpError.badRequest('orders.take_required');
  }

  private static async updateAssignedOrder(id: string, actorId: string, ip: string | undefined, userAgent: string | undefined, mutate: (order: IOrder, session: ClientSession) => Promise<void> | void, action: string) {
    return await withTransaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw HttpError.notFound('orders.not_found');
      this.assertCanOperate(order, actorId);
      const before = order.toObject();
      await mutate(order, session);
      order.updatedBy = toObjectId(actorId);
      await order.save({ session });
      await AuditLog.create([{ actorId, targetId: order._id, action, entity: 'Order', before, after: order.toObject(), ip, userAgent }], { session });
      return order.toObject();
    });
  }

  private static async refundOrder(order: IOrder, actorId: string, session: ClientSession) {
    if (order.refundMovementId) return;
    const client = await User.findById(order.clientId).session(session);
    if (!client) throw HttpError.notFound('adminClients.not_found');
    const balanceBefore = client.balance || 0;
    client.balance = balanceBefore + order.totalPrice;
    await client.save({ session });
    const movement = new ClientFinancialMovement({
      clientId: client._id,
      type: 'DEPOSIT',
      amount: order.totalPrice,
      source: 'ORDER',
      referenceId: order._id,
      referenceModel: 'Order',
      comment: `order-refund:${order.orderNumber}`,
      balanceBefore,
      balanceAfter: client.balance,
      createdBy: actorId,
    });
    await movement.save({ session });
    order.refundMovementId = movement._id as mongoose.Types.ObjectId;
    await redisDel(`user:${client._id}`);
  }
}
