import mongoose, { ClientSession } from 'mongoose';
import { HttpError } from '../../common/errors/HttpError';
import { withTransaction } from '../../database/transaction';
import { AuditLog } from '../audit/audit-log.model';
import { ApiGroup, SettingsApi } from '../settings-apis/settings-api.model';
import { StockProductRequirement } from '../stock-product-requirements/stock-product-requirement.model';
import { StockProduct } from './stock-product.model';
import { StockProductService } from './stock-product.service';
import { StockProductApiConnection, IStockProductApiConnection } from './stock-product-api-connection.model';

interface ProductApiConnectionInput {
  apiId?: string;
  providerProductId?: string | number;
}

type PreviewRow = Awaited<ReturnType<typeof StockProductService.previewApiProductsImport>>[number];

const supportedConnectionGroups = [
  'GIFT_CARD_PROVIDERS',
  'SOCIAL_MEDIA_SERVICE_PROVIDERS',
  'GIFT_CARD_PROVIDERS_2',
  'TEMPORARY_NUMBER_CODING_SITES',
  'RENEWABLE_NUMBER_CODING_SITES',
] as const;

const findProviderRow = async (apiId: string, providerProductId: string | number) => {
  const api = await SettingsApi.findOne({ _id: apiId, isDeleted: { $ne: true } }).select('name group').lean();
  if (!api) throw HttpError.notFound('settingsApis.not_found');
  if (!supportedConnectionGroups.includes(api.group as typeof supportedConnectionGroups[number])) {
    throw HttpError.badRequest('stockProductApiConnections.group_not_supported');
  }

  const rows = await StockProductService.previewApiProductsImport({
    apiId,
    apiGroup: api.group as typeof supportedConnectionGroups[number],
  });
  const row = rows.find((item) => String(item.providerProductId) === String(providerProductId));
  if (!row) throw HttpError.notFound('stockProductApiConnections.provider_product_not_found');
  return { api, row };
};

const buildConnectionSnapshot = (
  productId: string,
  apiId: string,
  apiGroup: IStockProductApiConnection['apiGroup'],
  row: PreviewRow,
  actorId: string
) => ({
  productId: new mongoose.Types.ObjectId(productId),
  apiId: new mongoose.Types.ObjectId(apiId),
  apiGroup,
  apiProductId: String(row.providerProductId),
  apiProductKey: row.apiProductKey,
  apiPayload: {
    providerProductId: row.providerProductId,
    name: row.name,
    categoryName: row.categoryName,
    productType: row.productType,
    params: row.params,
    qtyValues: row.qtyValues,
    categoryImage: (row as Record<string, unknown>).categoryImage,
    parentId: (row as Record<string, unknown>).parentId,
    basePrice: (row as Record<string, unknown>).basePrice,
  },
  providerPrice: Number(row.providerPrice || 0),
  providerCurrency: row.providerCurrency,
  costPrice: Number(row.costPrice || 0),
  forQuantity: Number(row.forQuantity || 1),
  quantityMode: row.quantityMode,
  minQuantity: row.minQuantity,
  maxQuantity: row.maxQuantity,
  customQuantities: row.customQuantities,
  quantityAvailable: Boolean(row.available),
  isDeleted: false,
  deletedAt: undefined,
  lastSyncedAt: new Date(),
  syncStatus: 'SYNCED' as const,
  syncError: undefined,
  updatedBy: new mongoose.Types.ObjectId(actorId),
});

const applyConnectionToProduct = async (
  productId: string,
  connection: IStockProductApiConnection,
  actorId: string,
  session: ClientSession
) => {
  const product = await StockProduct.findById(productId).session(session);
  if (!product) throw HttpError.notFound('stockProducts.not_found');

  product.apiId = connection.apiId;
  product.apiGroup = connection.apiGroup;
  product.apiProductId = connection.apiProductId;
  product.apiProductKey = connection.apiProductKey;
  product.apiPayload = connection.apiPayload;
  product.apiLastSyncedAt = connection.lastSyncedAt || new Date();
  product.apiSyncStatus = connection.syncStatus || 'SYNCED';
  product.apiSyncError = connection.syncError;
  product.costPrice = connection.costPrice;
  product.forQuantity = connection.forQuantity;
  product.quantityMode = connection.quantityMode;
  product.minQuantity = connection.minQuantity;
  product.maxQuantity = connection.maxQuantity;
  product.customQuantities = connection.customQuantities;
  product.quantityAvailable = connection.quantityAvailable;
  product.fulfillmentType = 'API';
  product.updatedBy = new mongoose.Types.ObjectId(actorId);
  await product.save({ session });
  return product;
};

const getConnectionParams = (connection: { apiPayload?: Record<string, unknown> }) =>
  Array.isArray(connection.apiPayload?.params)
    ? (connection.apiPayload.params as unknown[]).map((param) => String(param).trim()).filter(Boolean)
    : [];

const virtualRequirement = (apiGroup: ApiGroup, paramsName: string) => ({
  _id: `virtual:${apiGroup}:${paramsName}`,
  paramsName,
  message: { en: paramsName, fr: paramsName, ar: paramsName },
  description: { en: paramsName, fr: paramsName, ar: paramsName },
  apiGroup,
  inputType: 'TEXT',
  isRequired: true,
  isDeleted: false,
});

const attachConnectionRequirements = async <T extends { apiPayload?: Record<string, unknown>; apiGroup: ApiGroup }>(connections: T[]) => {
  const paramsByGroup = new Map<ApiGroup, Set<string>>();
  for (const connection of connections) {
    const params = getConnectionParams(connection);
    if (!params.length) continue;
    const groupParams = paramsByGroup.get(connection.apiGroup) || new Set<string>();
    params.forEach((param) => groupParams.add(param));
    paramsByGroup.set(connection.apiGroup, groupParams);
  }

  const requirements = paramsByGroup.size
    ? await StockProductRequirement.find({
        $or: Array.from(paramsByGroup.entries()).map(([apiGroup, params]) => ({
          apiGroup,
          paramsName: { $in: Array.from(params) },
          isDeleted: false,
        })),
      }).lean()
    : [];

  const requirementsByKey = new Map(requirements.map((requirement) => [`${requirement.apiGroup}:${requirement.paramsName}`, requirement]));
  return connections.map((connection) => ({
    ...connection,
    requirements: getConnectionParams(connection)
      .map((paramsName) => requirementsByKey.get(`${connection.apiGroup}:${paramsName}`) || virtualRequirement(connection.apiGroup, paramsName)),
  }));
};

export class StockProductApiConnectionService {
  static async list(productId: string) {
    const product = await StockProduct.findById(productId).populate('apiId', 'name group').lean();
    if (!product) throw HttpError.notFound('stockProducts.not_found');

    const connections = await StockProductApiConnection.find({ productId, isDeleted: { $ne: true } })
      .populate('apiId', 'name group')
      .sort({ isActive: -1, updatedAt: -1 })
      .lean();

    const hasCurrentConnection = connections.some((connection) => connection.apiProductKey === product.apiProductKey);
    if (!hasCurrentConnection && product.apiId && product.apiGroup && product.apiProductKey) {
      return await attachConnectionRequirements([
        {
          _id: `legacy:${product._id.toString()}`,
          productId: product._id,
          apiId: product.apiId,
          apiGroup: product.apiGroup,
          apiProductId: product.apiProductId,
          apiProductKey: product.apiProductKey,
          apiPayload: product.apiPayload,
          providerPrice: (product.apiPayload as Record<string, unknown> | undefined)?.providerPrice,
          providerCurrency: (product.apiPayload as Record<string, unknown> | undefined)?.providerCurrency,
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
          lastSyncedAt: product.apiLastSyncedAt,
          syncStatus: product.apiSyncStatus,
          syncError: product.apiSyncError,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        ...connections,
      ]);
    }

    return await attachConnectionRequirements(connections);
  }

  static async create(productId: string, data: ProductApiConnectionInput, actorId: string, ip?: string, userAgent?: string) {
    const product = await StockProduct.findById(productId).select('_id').lean();
    if (!product) throw HttpError.notFound('stockProducts.not_found');
    if (!data.apiId || data.providerProductId === undefined) throw HttpError.badRequest('stockProductApiConnections.provider_product_required');

    const { api, row } = await findProviderRow(data.apiId, data.providerProductId);
    const snapshot = buildConnectionSnapshot(productId, data.apiId, api.group as IStockProductApiConnection['apiGroup'], row, actorId);

    return await withTransaction(async (session) => {
      const existing = await StockProductApiConnection.findOne({
        productId,
        apiProductKey: row.apiProductKey,
      }).session(session);

      if (existing) {
        const before = existing.toObject();
        existing.set(snapshot);
        await existing.save({ session });
        await AuditLog.create([{ actorId, targetId: existing._id, action: 'STOCK_PRODUCT_API_CONNECTION_UPDATED', entity: 'StockProductApiConnection', before, after: existing.toObject(), ip, userAgent }], { session });
        return existing;
      }

      const connection = new StockProductApiConnection({
        ...snapshot,
        isActive: false,
        createdBy: new mongoose.Types.ObjectId(actorId),
      });
      await connection.save({ session });
      await AuditLog.create([{ actorId, targetId: connection._id, action: 'STOCK_PRODUCT_API_CONNECTION_CREATED', entity: 'StockProductApiConnection', after: connection.toObject(), ip, userAgent }], { session });
      return connection;
    });
  }

  static async update(productId: string, connectionId: string, data: ProductApiConnectionInput, actorId: string, ip?: string, userAgent?: string) {
    const connection = await StockProductApiConnection.findOne({ _id: connectionId, productId, isDeleted: { $ne: true } });
    if (!connection) throw HttpError.notFound('stockProductApiConnections.not_found');

    const apiId = data.apiId || connection.apiId.toString();
    const providerProductId = data.providerProductId ?? connection.apiProductId;
    const { api, row } = await findProviderRow(apiId, providerProductId);
    const snapshot = buildConnectionSnapshot(productId, apiId, api.group as IStockProductApiConnection['apiGroup'], row, actorId);

    return await withTransaction(async (session) => {
      const freshConnection = await StockProductApiConnection.findOne({ _id: connectionId, productId, isDeleted: { $ne: true } }).session(session);
      if (!freshConnection) throw HttpError.notFound('stockProductApiConnections.not_found');
      const before = freshConnection.toObject();
      freshConnection.set(snapshot);
      await freshConnection.save({ session });
      if (freshConnection.isActive) {
        await applyConnectionToProduct(productId, freshConnection, actorId, session);
      }
      await AuditLog.create([{ actorId, targetId: freshConnection._id, action: 'STOCK_PRODUCT_API_CONNECTION_UPDATED', entity: 'StockProductApiConnection', before, after: freshConnection.toObject(), ip, userAgent }], { session });
      return freshConnection;
    });
  }

  static async activate(productId: string, connectionId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const connection = await StockProductApiConnection.findOne({ _id: connectionId, productId, isDeleted: { $ne: true } }).session(session);
      if (!connection) throw HttpError.notFound('stockProductApiConnections.not_found');

      await StockProductApiConnection.updateMany(
        { productId, isDeleted: { $ne: true } },
        { $set: { isActive: false, updatedBy: new mongoose.Types.ObjectId(actorId) } },
        { session }
      );
      connection.isActive = true;
      connection.updatedBy = new mongoose.Types.ObjectId(actorId);
      await connection.save({ session });
      const product = await applyConnectionToProduct(productId, connection, actorId, session);

      await AuditLog.create([{ actorId, targetId: connection._id, action: 'STOCK_PRODUCT_API_CONNECTION_ACTIVATED', entity: 'StockProductApiConnection', after: { connection: connection.toObject(), product: product.toObject() }, ip, userAgent }], { session });
      return connection;
    });
  }

  static async softDelete(productId: string, connectionId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const connection = await StockProductApiConnection.findOne({ _id: connectionId, productId, isDeleted: { $ne: true } }).session(session);
      if (!connection) throw HttpError.notFound('stockProductApiConnections.not_found');
      if (connection.isActive) throw HttpError.badRequest('stockProductApiConnections.active_delete_forbidden');
      const before = connection.toObject();
      connection.isDeleted = true;
      connection.deletedAt = new Date();
      connection.updatedBy = new mongoose.Types.ObjectId(actorId);
      await connection.save({ session });
      await AuditLog.create([{ actorId, targetId: connection._id, action: 'STOCK_PRODUCT_API_CONNECTION_DELETED', entity: 'StockProductApiConnection', before, after: connection.toObject(), ip, userAgent }], { session });
      return connection;
    });
  }
}
