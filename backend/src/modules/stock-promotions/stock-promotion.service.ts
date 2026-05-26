import mongoose, { ClientSession } from 'mongoose';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { withTransaction } from '../../database/transaction';
import { AuditLog } from '../audit/audit-log.model';
import { User } from '../users/user.model';
import { StockCategory } from '../stock-categories/stock-category.model';
import { StockProductGroup } from '../stock-product-groups/stock-product-group.model';
import { StockProduct } from '../stock-products/stock-product.model';
import { StockServiceGroup } from '../stock-service-groups/stock-service-group.model';
import { LocalizedText, StockService } from '../stock-services/stock-service.model';
import { StockPromotion, StockPromotionTargetType, StockPromotionType } from './stock-promotion.model';
import { StockPromotionUsage } from './stock-promotion-usage.model';

interface PromotionInput {
  name: LocalizedText;
  description: LocalizedText;
  promotionType: StockPromotionType;
  value: number;
  targetType: StockPromotionTargetType;
  serviceId?: string;
  categoryId?: string;
  productId?: string;
  productGroupId?: string;
  clientId?: string;
  clientLevelGroupId?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: Date;
  endAt?: Date;
  priority: number;
  usageLimit?: number;
  perClientLimit?: number;
  isActive: boolean;
  isDeleted: boolean;
}

type PromotionUpdateInput = Partial<PromotionInput>;

interface PromotionUsageInput {
  promotionId: string;
  clientId: string;
  productId: string;
  orderId?: string;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
}

const targetFieldByType: Record<Exclude<StockPromotionTargetType, 'ALL_PRODUCTS'>, keyof PromotionInput> = {
  SERVICE: 'serviceId',
  CATEGORY: 'categoryId',
  PRODUCT: 'productId',
  PRODUCT_GROUP: 'productGroupId',
  CLIENT: 'clientId',
  CLIENT_LEVEL_GROUP: 'clientLevelGroupId',
};

const targetFields = Object.values(targetFieldByType);

const normalizeTargetFields = (data: PromotionInput | PromotionUpdateInput) => {
  const targetType = data.targetType;
  if (!targetType) return data;

  const normalized = { ...data };
  for (const field of targetFields) {
    if (targetType === 'ALL_PRODUCTS' || field !== targetFieldByType[targetType as Exclude<StockPromotionTargetType, 'ALL_PRODUCTS'>]) {
      delete normalized[field];
    }
  }
  return normalized;
};

const assertTargetExists = async (data: PromotionInput | PromotionUpdateInput, session: ClientSession) => {
  if (!data.targetType) return;

  if (data.targetType === 'SERVICE' && data.serviceId) {
    const exists = await StockService.exists({ _id: data.serviceId }).session(session);
    if (!exists) throw HttpError.notFound('stockServices.not_found');
  }
  if (data.targetType === 'CATEGORY' && data.categoryId) {
    const exists = await StockCategory.exists({ _id: data.categoryId }).session(session);
    if (!exists) throw HttpError.notFound('stockCategories.not_found');
  }
  if (data.targetType === 'PRODUCT' && data.productId) {
    const exists = await StockProduct.exists({ _id: data.productId }).session(session);
    if (!exists) throw HttpError.notFound('stockProducts.not_found');
  }
  if (data.targetType === 'PRODUCT_GROUP' && data.productGroupId) {
    const exists = await StockProductGroup.exists({ _id: data.productGroupId }).session(session);
    if (!exists) throw HttpError.notFound('stockProductGroups.not_found');
  }
  if (data.targetType === 'CLIENT' && data.clientId) {
    const exists = await User.exists({ _id: data.clientId }).session(session);
    if (!exists) throw HttpError.notFound('adminClients.not_found');
  }
  if (data.targetType === 'CLIENT_LEVEL_GROUP' && data.clientLevelGroupId) {
    const exists = await StockServiceGroup.exists({ _id: data.clientLevelGroupId }).session(session);
    if (!exists) throw HttpError.notFound('stockServiceGroups.not_found');
  }
};

const populatePromotionQuery = (query: mongoose.Query<any, any>) =>
  query
    .populate('serviceId', 'name type')
    .populate('categoryId', 'name serviceId')
    .populate('productId', 'name serviceId categoryId image')
    .populate('productGroupId', 'name image coverImage')
    .populate('clientId', 'name email username phoneNumber countryFlag')
    .populate('clientLevelGroupId', 'name serviceId pricingType value entitlementValue')
    .populate('createdBy', 'name email');

export class StockPromotionService {
  static async list(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, any> = {};

    if (query.search) {
      const search = new RegExp(query.search, 'i');
      filter.$or = [{ 'name.en': search }, { 'name.fr': search }, { 'name.ar': search }];
    }
    if (query.targetType) filter.targetType = query.targetType;
    if (query.promotionType) filter.promotionType = query.promotionType;
    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;
    if (typeof query.isDeleted === 'boolean') filter.isDeleted = query.isDeleted;

    const [promotions, total] = await Promise.all([
      populatePromotionQuery(
        StockPromotion.find(filter)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ).lean(),
      StockPromotion.countDocuments(filter),
    ]);

    return { data: promotions, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listUsages(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, any> = {};
    if (query.promotionId) filter.promotionId = query.promotionId;
    if (query.clientId) filter.clientId = query.clientId;
    if (query.productId) filter.productId = query.productId;

    const [usages, total] = await Promise.all([
      StockPromotionUsage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('promotionId', 'name promotionType value')
        .populate('clientId', 'name email username phoneNumber countryFlag')
        .populate('productId', 'name image serviceId categoryId')
        .lean(),
      StockPromotionUsage.countDocuments(filter),
    ]);

    return { data: usages, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: PromotionInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const normalizedData = normalizeTargetFields(data) as PromotionInput;
      await assertTargetExists(normalizedData, session);

      const promotion = new StockPromotion({
        ...normalizedData,
        createdBy: actorId,
        deletedAt: normalizedData.isDeleted ? new Date() : undefined,
      });
      await promotion.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: promotion._id,
        action: 'STOCK_PROMOTION_CREATED',
        entity: 'StockPromotion',
        after: promotion.toObject(),
        ip,
        userAgent,
      }], { session });

      return promotion;
    });
  }

  static async update(promotionId: string, data: PromotionUpdateInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const promotion = await StockPromotion.findById(promotionId).session(session);
      if (!promotion) throw HttpError.notFound('stockPromotions.not_found');

      const before = promotion.toObject();
      const normalizedData = normalizeTargetFields(data) as PromotionUpdateInput;
      await assertTargetExists(normalizedData, session);

      Object.assign(promotion, normalizedData);
      if (data.targetType) {
        for (const field of targetFields) {
          if (data.targetType === 'ALL_PRODUCTS' || field !== targetFieldByType[data.targetType as Exclude<StockPromotionTargetType, 'ALL_PRODUCTS'>]) {
            promotion.set(field, undefined);
          }
        }
      }
      if (typeof normalizedData.isDeleted === 'boolean') {
        promotion.deletedAt = normalizedData.isDeleted ? promotion.deletedAt ?? new Date() : undefined;
      }
      promotion.updatedBy = new mongoose.Types.ObjectId(actorId);

      await promotion.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: promotion._id,
        action: 'STOCK_PROMOTION_UPDATED',
        entity: 'StockPromotion',
        before,
        after: promotion.toObject(),
        ip,
        userAgent,
      }], { session });

      return promotion;
    });
  }

  static async recordUsage(data: PromotionUsageInput, actorId: string, session?: ClientSession, ip?: string, userAgent?: string) {
    const record = async (txSession: ClientSession) => {
      const promotion = await StockPromotion.findOne({ _id: data.promotionId, isDeleted: false, isActive: true }).session(txSession);
      if (!promotion) throw HttpError.notFound('stockPromotions.not_found');

      if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
        throw HttpError.badRequest('stockPromotions.usage_limit_reached');
      }
      if (promotion.perClientLimit) {
        const clientUsageCount = await StockPromotionUsage.countDocuments({
          promotionId: promotion._id,
          clientId: data.clientId,
        }).session(txSession);
        if (clientUsageCount >= promotion.perClientLimit) {
          throw HttpError.badRequest('stockPromotions.client_usage_limit_reached');
        }
      }

      const incrementResult = await StockPromotion.updateOne(
        {
          _id: promotion._id,
          ...(promotion.usageLimit ? { usageCount: { $lt: promotion.usageLimit } } : {}),
        },
        { $inc: { usageCount: 1 } },
        { session: txSession }
      );
      if (incrementResult.modifiedCount !== 1) throw HttpError.badRequest('stockPromotions.usage_limit_reached');

      const usage = await StockPromotionUsage.create([{
        promotionId: promotion._id,
        clientId: data.clientId,
        productId: data.productId,
        orderId: data.orderId ? new mongoose.Types.ObjectId(data.orderId) : undefined,
        discountAmount: data.discountAmount,
        originalPrice: data.originalPrice,
        finalPrice: data.finalPrice,
      }], { session: txSession });

      await AuditLog.create([{
        actorId,
        targetId: promotion._id,
        action: 'STOCK_PROMOTION_USAGE_RECORDED',
        entity: 'StockPromotionUsage',
        after: usage[0].toObject(),
        ip,
        userAgent,
      }], { session: txSession });

      return usage[0].toObject();
    };

    if (session) return await record(session);
    return await withTransaction(record);
  }
}
