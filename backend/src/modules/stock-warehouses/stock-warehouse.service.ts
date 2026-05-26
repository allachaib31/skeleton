import mongoose, { ClientSession } from 'mongoose';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { AuditLog } from '../audit/audit-log.model';
import { StockProduct } from '../stock-products/stock-product.model';
import { StockWarehouse, StockWarehouseType } from './stock-warehouse.model';
import { StockWarehouseItem, StockWarehouseItemStatus } from './stock-warehouse-item.model';
import { StockWarehouseMovement, StockWarehouseMovementType } from './stock-warehouse-movement.model';

type WarehouseInput = {
  name: string;
  productId: string;
  type: StockWarehouseType;
  costPrice?: number;
  sellNote?: string;
  isVisible?: boolean;
  isDeleted?: boolean;
};

type ItemInput = {
  warehouseId: string;
  code: string;
  serialNumber?: string;
  pin?: string;
  costPrice?: number;
  expiresAt?: string;
  notes?: string;
  status?: StockWarehouseItemStatus;
  isDeleted?: boolean;
};

const warehousePopulate = [
  { path: 'serviceId', select: 'name type' },
  { path: 'categoryId', select: 'name serviceId' },
  { path: 'productId', select: 'name fulfillmentType image serviceId categoryId' },
  { path: 'createdBy', select: 'name email' },
];

const itemPopulate = [
  { path: 'warehouseId', select: 'name type availableQuantity soldQuantity reservedQuantity disabledQuantity' },
  { path: 'productId', select: 'name fulfillmentType image' },
  { path: 'soldToClientId', select: 'name email username' },
  { path: 'createdBy', select: 'name email' },
];

const movementTypeByStatus = (status: StockWarehouseItemStatus): StockWarehouseMovementType => {
  if (status === 'DISABLED') return 'DISABLE';
  if (status === 'SOLD') return 'SALE';
  if (status === 'RESERVED') return 'RESERVE';
  return 'RESTORE';
};

const ensureWarehouseProduct = async (productId: string, session: ClientSession) => {
  const product = await StockProduct.findOne({ _id: productId, isDeleted: { $ne: true } }).session(session);
  if (!product) throw HttpError.notFound('stockProducts.not_found');
  return product;
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

const createMovement = async (
  warehouse: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId },
  type: StockWarehouseMovementType,
  quantity: number,
  actorId: string,
  session: ClientSession,
  options: {
    itemId?: mongoose.Types.ObjectId;
    beforeStatus?: string;
    afterStatus?: string;
    orderId?: string | mongoose.Types.ObjectId;
    clientId?: string | mongoose.Types.ObjectId;
    comment?: string;
  } = {}
) => {
  await StockWarehouseMovement.create([{
    warehouseId: warehouse._id,
    productId: warehouse.productId,
    type,
    quantity,
    itemId: options.itemId,
    beforeStatus: options.beforeStatus,
    afterStatus: options.afterStatus,
    orderId: options.orderId ? new mongoose.Types.ObjectId(options.orderId) : undefined,
    clientId: options.clientId ? new mongoose.Types.ObjectId(options.clientId) : undefined,
    comment: options.comment,
    createdBy: actorId,
  }], { session });
};

const parseImportLine = (line: string) => {
  const separator = line.includes(',') ? ',' : line.includes('|') ? '|' : line.includes(':') ? ':' : null;
  if (!separator) return { code: line.trim() };
  const [code, serialNumber, pin] = line.split(separator).map((item) => item.trim());
  return { code, serialNumber, pin };
};

export class StockWarehouseService {
  static async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = { isDeleted: typeof query.isDeleted === 'boolean' ? query.isDeleted : query.isDeleted === 'true' };
    if (query.search) filter.name = { $regex: query.search as string, $options: 'i' };
    if (query.serviceId) filter.serviceId = query.serviceId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.productId) filter.productId = query.productId;
    if (query.type) filter.type = query.type;
    if (typeof query.isVisible === 'boolean') filter.isVisible = query.isVisible;

    const [data, total] = await Promise.all([
      StockWarehouse.find(filter).populate(warehousePopulate).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StockWarehouse.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: WarehouseInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const product = await ensureWarehouseProduct(data.productId, session);
      product.fulfillmentType = 'WAREHOUSE';
      await product.save({ session });
      const warehouse = new StockWarehouse({
        name: data.name,
        productId: product._id,
        serviceId: product.serviceId,
        categoryId: product.categoryId,
        type: data.type,
        costPrice: data.costPrice ?? product.costPrice ?? 0,
        sellNote: data.sellNote || undefined,
        isVisible: data.isVisible ?? true,
        createdBy: actorId,
      });
      await warehouse.save({ session });
      await AuditLog.create([{ actorId, targetId: warehouse._id, action: 'STOCK_WAREHOUSE_CREATED', entity: 'StockWarehouse', after: warehouse.toObject(), ip, userAgent }], { session });
      return warehouse.toObject();
    });
  }

  static async update(id: string, data: Partial<WarehouseInput>, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const warehouse = await StockWarehouse.findById(id).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      const before = warehouse.toObject();

      if (data.productId && data.productId !== warehouse.productId.toString()) {
        const product = await ensureWarehouseProduct(data.productId, session);
        product.fulfillmentType = 'WAREHOUSE';
        await product.save({ session });
        warehouse.productId = product._id as mongoose.Types.ObjectId;
        warehouse.serviceId = product.serviceId;
        warehouse.categoryId = product.categoryId;
        await StockWarehouseItem.updateMany({ warehouseId: warehouse._id }, { $set: { productId: product._id, updatedBy: actorId } }, { session });
      }
      if (data.name !== undefined) warehouse.name = data.name;
      if (data.type !== undefined) warehouse.type = data.type;
      if (data.costPrice !== undefined) warehouse.costPrice = data.costPrice;
      if (data.sellNote !== undefined) warehouse.sellNote = data.sellNote || undefined;
      if (typeof data.isVisible === 'boolean') warehouse.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        warehouse.isDeleted = data.isDeleted;
        warehouse.deletedAt = data.isDeleted ? warehouse.deletedAt ?? new Date() : undefined;
      }
      warehouse.updatedBy = new mongoose.Types.ObjectId(actorId);
      await warehouse.save({ session });
      await AuditLog.create([{ actorId, targetId: warehouse._id, action: 'STOCK_WAREHOUSE_UPDATED', entity: 'StockWarehouse', before, after: warehouse.toObject(), ip, userAgent }], { session });
      return warehouse.toObject();
    });
  }

  static async listItems(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = { isDeleted: typeof query.isDeleted === 'boolean' ? query.isDeleted : query.isDeleted === 'true' };
    if (query.search) {
      const search = new RegExp(query.search as string, 'i');
      filter.$or = [{ code: search }, { serialNumber: search }, { pin: search }, { notes: search }];
    }
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.productId) filter.productId = query.productId;
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      StockWarehouseItem.find(filter).populate(itemPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StockWarehouseItem.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async createItem(data: ItemInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const warehouse = await StockWarehouse.findOne({ _id: data.warehouseId, isDeleted: false }).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      const item = new StockWarehouseItem({
        warehouseId: warehouse._id,
        productId: warehouse.productId,
        code: data.code,
        serialNumber: data.serialNumber || undefined,
        pin: data.pin || undefined,
        costPrice: data.costPrice ?? warehouse.costPrice,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        notes: data.notes || undefined,
        status: 'AVAILABLE',
        createdBy: actorId,
      });
      await item.save({ session });
      await recalculateWarehouseCounts(warehouse._id as mongoose.Types.ObjectId, session);
      await createMovement(warehouse, 'IMPORT', 1, actorId, session, { itemId: item._id, afterStatus: 'AVAILABLE' });
      await AuditLog.create([{ actorId, targetId: item._id, action: 'STOCK_WAREHOUSE_ITEM_CREATED', entity: 'StockWarehouseItem', after: item.toObject(), ip, userAgent }], { session });
      return item.toObject();
    });
  }

  static async importItems(data: { warehouseId: string; lines: string; costPrice?: number; expiresAt?: string; notes?: string }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const warehouse = await StockWarehouse.findOne({ _id: data.warehouseId, isDeleted: false }).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      const rows = data.lines
        .split(/\r?\n/)
        .map((line) => parseImportLine(line))
        .filter((row) => row.code);
      if (!rows.length) throw HttpError.badRequest('stockWarehouses.no_import_rows');

      const docs = rows.map((row) => ({
        warehouseId: warehouse._id,
        productId: warehouse.productId,
        code: row.code,
        serialNumber: row.serialNumber || undefined,
        pin: row.pin || undefined,
        costPrice: data.costPrice ?? warehouse.costPrice,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        notes: data.notes || undefined,
        status: 'AVAILABLE',
        createdBy: actorId,
      }));
      const inserted = await StockWarehouseItem.insertMany(docs, { session, ordered: false });
      await recalculateWarehouseCounts(warehouse._id as mongoose.Types.ObjectId, session);
      await createMovement(warehouse, 'IMPORT', inserted.length, actorId, session, { afterStatus: 'AVAILABLE' });
      await AuditLog.create([{ actorId, targetId: warehouse._id, action: 'STOCK_WAREHOUSE_ITEMS_IMPORTED', entity: 'StockWarehouseItem', after: { count: inserted.length }, ip, userAgent }], { session });
      return { importedCount: inserted.length };
    });
  }

  static async updateItem(id: string, data: Partial<ItemInput>, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const item = await StockWarehouseItem.findById(id).session(session);
      if (!item) throw HttpError.notFound('stockWarehouses.item_not_found');
      const warehouse = await StockWarehouse.findById(item.warehouseId).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      const before = item.toObject();
      const beforeStatus = item.status;
      if (data.code !== undefined) item.code = data.code;
      if (data.serialNumber !== undefined) item.serialNumber = data.serialNumber || undefined;
      if (data.pin !== undefined) item.pin = data.pin || undefined;
      if (data.status !== undefined) {
        item.status = data.status;
        item.soldAt = data.status === 'SOLD' ? item.soldAt ?? new Date() : undefined;
      }
      if (data.costPrice !== undefined) item.costPrice = data.costPrice;
      if (data.expiresAt !== undefined) item.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
      if (data.notes !== undefined) item.notes = data.notes || undefined;
      if (typeof data.isDeleted === 'boolean') {
        item.isDeleted = data.isDeleted;
        item.deletedAt = data.isDeleted ? item.deletedAt ?? new Date() : undefined;
      }
      item.updatedBy = new mongoose.Types.ObjectId(actorId);
      await item.save({ session });
      await recalculateWarehouseCounts(item.warehouseId, session);
      if (beforeStatus !== item.status) {
        await createMovement(warehouse, movementTypeByStatus(item.status), 1, actorId, session, { itemId: item._id, beforeStatus, afterStatus: item.status });
      }
      await AuditLog.create([{ actorId, targetId: item._id, action: 'STOCK_WAREHOUSE_ITEM_UPDATED', entity: 'StockWarehouseItem', before, after: item.toObject(), ip, userAgent }], { session });
      return item.toObject();
    });
  }

  static async bulkUpdateItems(data: { ids: string[]; status?: StockWarehouseItemStatus; isDeleted?: boolean }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const before = await StockWarehouseItem.find({ _id: { $in: data.ids } }).session(session).lean();
      const setUpdate: Record<string, unknown> = { updatedBy: new mongoose.Types.ObjectId(actorId) };
      if (data.status) {
        setUpdate.status = data.status;
        setUpdate.soldAt = data.status === 'SOLD' ? new Date() : undefined;
      }
      if (typeof data.isDeleted === 'boolean') {
        setUpdate.isDeleted = data.isDeleted;
        setUpdate.deletedAt = data.isDeleted ? new Date() : undefined;
      }
      await StockWarehouseItem.updateMany({ _id: { $in: data.ids } }, { $set: setUpdate }, { session });
      const warehouseIds = Array.from(new Set(before.map((item) => item.warehouseId.toString())));
      for (const warehouseId of warehouseIds) await recalculateWarehouseCounts(warehouseId, session);
      await AuditLog.create([{ actorId, action: 'STOCK_WAREHOUSE_ITEMS_BULK_UPDATED', entity: 'StockWarehouseItem', before, after: { ids: data.ids, update: setUpdate }, ip, userAgent }], { session });
    });
  }

  static async reserveAvailableItem(data: { productId: string; orderId: string; clientId?: string }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const orderId = new mongoose.Types.ObjectId(data.orderId);
      const clientId = data.clientId ? new mongoose.Types.ObjectId(data.clientId) : undefined;
      const item = await StockWarehouseItem.findOneAndUpdate(
        { productId: data.productId, status: 'AVAILABLE', isDeleted: false },
        {
          $set: {
            status: 'RESERVED',
            reservedByOrderId: orderId,
            updatedBy: new mongoose.Types.ObjectId(actorId),
          },
        },
        { returnDocument: 'after', sort: { createdAt: 1 }, session }
      );
      if (!item) throw HttpError.badRequest('stockWarehouses.no_available_items');

      const warehouse = await StockWarehouse.findById(item.warehouseId).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      await recalculateWarehouseCounts(item.warehouseId, session);
      await createMovement(warehouse, 'RESERVE', 1, actorId, session, {
        itemId: item._id,
        beforeStatus: 'AVAILABLE',
        afterStatus: 'RESERVED',
        orderId,
        clientId,
      });
      await AuditLog.create([{
        actorId,
        targetId: item._id,
        action: 'STOCK_WAREHOUSE_ITEM_RESERVED',
        entity: 'StockWarehouseItem',
        after: { itemId: item._id, orderId, clientId },
        ip,
        userAgent,
      }], { session });
      return item.toObject();
    });
  }

  static async markReservedItemSold(data: { itemId: string; orderId: string; clientId: string }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const orderId = new mongoose.Types.ObjectId(data.orderId);
      const clientId = new mongoose.Types.ObjectId(data.clientId);
      const item = await StockWarehouseItem.findOneAndUpdate(
        { _id: data.itemId, status: 'RESERVED', reservedByOrderId: orderId, isDeleted: false },
        {
          $set: {
            status: 'SOLD',
            soldByOrderId: orderId,
            soldToClientId: clientId,
            soldAt: new Date(),
            updatedBy: new mongoose.Types.ObjectId(actorId),
          },
          $unset: { reservedByOrderId: '' },
        },
        { returnDocument: 'after', session }
      );
      if (!item) throw HttpError.badRequest('stockWarehouses.reserved_item_not_found');

      const warehouse = await StockWarehouse.findById(item.warehouseId).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      await recalculateWarehouseCounts(item.warehouseId, session);
      await createMovement(warehouse, 'SALE', 1, actorId, session, {
        itemId: item._id,
        beforeStatus: 'RESERVED',
        afterStatus: 'SOLD',
        orderId,
        clientId,
      });
      await AuditLog.create([{
        actorId,
        targetId: item._id,
        action: 'STOCK_WAREHOUSE_ITEM_SOLD',
        entity: 'StockWarehouseItem',
        after: { itemId: item._id, orderId, clientId },
        ip,
        userAgent,
      }], { session });
      return item.toObject();
    });
  }

  static async releaseReservedItem(data: { itemId: string; orderId: string }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const orderId = new mongoose.Types.ObjectId(data.orderId);
      const item = await StockWarehouseItem.findOneAndUpdate(
        { _id: data.itemId, status: 'RESERVED', reservedByOrderId: orderId, isDeleted: false },
        {
          $set: {
            status: 'AVAILABLE',
            updatedBy: new mongoose.Types.ObjectId(actorId),
          },
          $unset: { reservedByOrderId: '' },
        },
        { returnDocument: 'after', session }
      );
      if (!item) throw HttpError.badRequest('stockWarehouses.reserved_item_not_found');

      const warehouse = await StockWarehouse.findById(item.warehouseId).session(session);
      if (!warehouse) throw HttpError.notFound('stockWarehouses.not_found');
      await recalculateWarehouseCounts(item.warehouseId, session);
      await createMovement(warehouse, 'RELEASE', 1, actorId, session, {
        itemId: item._id,
        beforeStatus: 'RESERVED',
        afterStatus: 'AVAILABLE',
        orderId,
      });
      await AuditLog.create([{
        actorId,
        targetId: item._id,
        action: 'STOCK_WAREHOUSE_ITEM_RELEASED',
        entity: 'StockWarehouseItem',
        after: { itemId: item._id, orderId },
        ip,
        userAgent,
      }], { session });
      return item.toObject();
    });
  }
}
