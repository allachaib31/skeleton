import { calculateFinalProductPrice, FinalProductPriceResult } from '@pricing';
import { HttpError } from '../../common/errors/HttpError';
import { User } from '../users/user.model';
import { UserLevelGroupe } from '../admin-clients/user-level-groupe.model';
import { ClientProductSpecialPrice } from '../admin-clients/client-product-special-price.model';
import { StockProduct } from '../stock-products/stock-product.model';
import { StockPromotion } from '../stock-promotions/stock-promotion.model';
import { StockPromotionUsage } from '../stock-promotions/stock-promotion-usage.model';
import { StockWarehouse } from '../stock-warehouses/stock-warehouse.model';
import { StockWarehouseItem } from '../stock-warehouses/stock-warehouse-item.model';

interface CalculatePriceInput {
  clientId: string;
  productId: string;
  quantity: number;
  costPriceOverride?: number;
  forQuantityOverride?: number;
  fulfillmentTypeOverride?: 'API' | 'WAREHOUSE' | 'MANUAL';
}

const toId = (value: unknown) => String(value || '');

const sumWarehouseCostsForItems = async (
  items: Array<{ warehouseId: unknown }>,
  quantity: number
) => {
  const warehouseIds = Array.from(new Set(items.map((item) => toId(item.warehouseId)).filter(Boolean)));
  const warehouses = await StockWarehouse.find({ _id: { $in: warehouseIds }, isDeleted: false, isVisible: true })
    .select('costPrice')
    .lean();
  const costsByWarehouse = new Map(warehouses.map((warehouse) => [warehouse._id.toString(), warehouse.costPrice || 0]));
  const total = items.reduce((sum, item) => sum + (costsByWarehouse.get(toId(item.warehouseId)) || 0), 0);
  return {
    costPrice: total,
    forQuantity: quantity,
  };
};

const resolveWarehouseCost = async (productId: string, quantity: number) => {
  const items = await StockWarehouseItem.find({ productId, status: 'AVAILABLE', isDeleted: false })
    .select('warehouseId')
    .sort({ createdAt: 1 })
    .limit(quantity)
    .lean();

  if (items.length >= quantity) {
    return {
      ...await sumWarehouseCostsForItems(items, quantity),
      source: 'WAREHOUSE',
    };
  }

  const warehouse = await StockWarehouse.findOne({ productId, isDeleted: false, isVisible: true })
    .select('costPrice')
    .sort({ createdAt: -1 })
    .lean();

  if (!warehouse) return null;
  return {
    costPrice: warehouse.costPrice || 0,
    forQuantity: 1,
    source: 'WAREHOUSE',
  };
};

const targetSpecificity: Record<string, number> = {
  CLIENT: 7,
  PRODUCT: 6,
  CLIENT_LEVEL_GROUP: 5,
  PRODUCT_GROUP: 4,
  CATEGORY: 3,
  SERVICE: 2,
  ALL_PRODUCTS: 1,
};

export class PricingService {
  static async calculateForClient(data: CalculatePriceInput): Promise<FinalProductPriceResult & Record<string, unknown>> {
    const [client, product] = await Promise.all([
      User.findOne({ _id: data.clientId, isDeleted: { $ne: true } }).select('balance openCredit name email username').lean(),
      StockProduct.findOne({ _id: data.productId, isDeleted: { $ne: true } })
        .populate('serviceId', 'name type')
        .populate('categoryId', 'name serviceId')
        .populate('groupId', 'name')
        .lean(),
    ]);

    if (!client) throw HttpError.notFound('adminClients.not_found');
    if (!product) throw HttpError.notFound('stockProducts.not_found');

    const serviceId = toId(product.serviceId && typeof product.serviceId === 'object' ? product.serviceId._id : product.serviceId);
    const categoryId = toId(product.categoryId && typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId);
    const productGroupId = product.groupId ? toId(typeof product.groupId === 'object' ? product.groupId._id : product.groupId) : undefined;

    const clientLevel = await UserLevelGroupe.findOne({ clientId: data.clientId, serviceId })
      .populate('groupId', 'name pricingType value negativeValue percentAgent entitlementValue isDeleted')
      .lean();
    if (!clientLevel || !clientLevel.groupId || typeof clientLevel.groupId === 'string') {
      throw HttpError.notFound('adminClients.level_not_found');
    }
    const serviceGroup = clientLevel.groupId as any;

    const clientSpecialPrice = await ClientProductSpecialPrice.findOne({
      clientId: data.clientId,
      productId: data.productId,
      isDeleted: false,
    }).lean();

    const currentDate = new Date();
    const promotionFilter: any = {
      isActive: true,
      isDeleted: false,
      promotionType: { $in: ['FIXED', 'PERCENT'] },
      startAt: { $lte: currentDate },
      $or: [{ endAt: { $exists: false } }, { endAt: { $gte: currentDate } }],
      $and: [
        {
          $or: [
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
          ],
        },
        {
          $or: [
            { targetType: 'ALL_PRODUCTS' },
            { targetType: 'SERVICE', serviceId },
            { targetType: 'CATEGORY', categoryId },
            { targetType: 'PRODUCT', productId: data.productId },
            ...(productGroupId ? [{ targetType: 'PRODUCT_GROUP', productGroupId }] : []),
            { targetType: 'CLIENT', clientId: data.clientId },
            { targetType: 'CLIENT_LEVEL_GROUP', clientLevelGroupId: toId(serviceGroup._id) },
          ],
        },
      ],
    };

    const promotionCandidates = await StockPromotion.find(promotionFilter).lean();

    const effectiveFulfillmentType = data.fulfillmentTypeOverride || product.fulfillmentType;
    const warehouseCost = data.costPriceOverride === undefined && effectiveFulfillmentType === 'WAREHOUSE'
      ? await resolveWarehouseCost(data.productId, data.quantity)
      : null;
    const effectiveCostPrice = data.costPriceOverride ?? warehouseCost?.costPrice ?? product.costPrice;
    const effectiveForQuantity = data.forQuantityOverride ?? warehouseCost?.forQuantity ?? product.forQuantity;
    const baseCost = effectiveFulfillmentType === 'MANUAL' && product.costManual !== undefined && data.costPriceOverride === undefined
      ? product.costManual
      : effectiveCostPrice;
    const unitCost = baseCost / effectiveForQuantity;
    const prePromotionPrice = calculateFinalProductPrice({
      client: { balance: client.balance || 0, openCredit: client.openCredit || 0 },
      product: {
        costPrice: effectiveCostPrice,
        costManual: product.costManual,
        forQuantity: effectiveForQuantity,
        fulfillmentType: effectiveFulfillmentType,
        specialSellPrice: product.specialSellPrice,
      },
      serviceGroup,
      clientSpecialPrice: clientSpecialPrice
        ? {
            pricingType: clientSpecialPrice.pricingType,
            value: clientSpecialPrice.value,
            negativeValue: clientSpecialPrice.negativeValue ?? clientSpecialPrice.value,
          }
        : undefined,
      quantity: data.quantity,
    });
    const prePromotionTotal = prePromotionPrice.finalUnitPrice * data.quantity;

    const eligiblePromotions = [];
    for (const promotion of promotionCandidates) {
      if (promotion.minOrderAmount !== undefined && prePromotionTotal < promotion.minOrderAmount) continue;
      if (promotion.perClientLimit) {
        const usedByClient = await StockPromotionUsage.countDocuments({
          promotionId: promotion._id,
          clientId: data.clientId,
        });
        if (usedByClient >= promotion.perClientLimit) continue;
      }
      eligiblePromotions.push(promotion);
    }

    const promotion = eligiblePromotions.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return targetSpecificity[b.targetType] - targetSpecificity[a.targetType];
    })[0];

    const result = calculateFinalProductPrice({
      client: { balance: client.balance || 0, openCredit: client.openCredit || 0 },
      product: {
        costPrice: effectiveCostPrice,
        costManual: product.costManual,
        forQuantity: effectiveForQuantity,
        fulfillmentType: effectiveFulfillmentType,
        specialSellPrice: product.specialSellPrice,
      },
      serviceGroup,
      clientSpecialPrice: clientSpecialPrice
        ? {
            pricingType: clientSpecialPrice.pricingType,
            value: clientSpecialPrice.value,
            negativeValue: clientSpecialPrice.negativeValue ?? clientSpecialPrice.value,
          }
        : undefined,
      promotion: promotion
        ? {
            promotionType: promotion.promotionType as 'FIXED' | 'PERCENT',
            value: promotion.value,
            maxDiscountAmount: promotion.maxDiscountAmount,
          }
        : undefined,
      quantity: data.quantity,
    });

    return {
      ...result,
      client: { _id: client._id, name: client.name, email: client.email, balance: client.balance, openCredit: client.openCredit },
      product: { _id: product._id, name: product.name, costPrice: effectiveCostPrice, originalCostPrice: product.costPrice, costManual: product.costManual, fulfillmentType: effectiveFulfillmentType, originalFulfillmentType: product.fulfillmentType, forQuantity: effectiveForQuantity },
      serviceGroup,
      clientSpecialPrice,
      promotion,
      baseCost,
      unitCost,
      warehouseCostSource: warehouseCost?.source,
    };
  }
}
