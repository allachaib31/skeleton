import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB, initTestData, createTestUser } from '../setup';
import { User } from '../../modules/users/user.model';
import { SettingsCurrency } from '../../modules/settings-currencies/settings-currency.model';
import { PaymentCode } from '../../modules/payment-codes/payment-code.model';
import { PaymentCodeJournal } from '../../modules/payment-codes/payment-code-journal.model';
import { PaymentCodeService } from '../../modules/payment-codes/payment-code.service';
import { ClientFinancialMovement } from '../../modules/admin-clients/client-financial-movement.model';
import { StockService } from '../../modules/stock-services/stock-service.model';
import { StockCategory } from '../../modules/stock-categories/stock-category.model';
import { StockProduct } from '../../modules/stock-products/stock-product.model';
import { StockProductApiConnection } from '../../modules/stock-products/stock-product-api-connection.model';
import { StockProductRequirement } from '../../modules/stock-product-requirements/stock-product-requirement.model';
import { StockWarehouse } from '../../modules/stock-warehouses/stock-warehouse.model';
import { StockWarehouseItem } from '../../modules/stock-warehouses/stock-warehouse-item.model';
import { StockWarehouseMovement } from '../../modules/stock-warehouses/stock-warehouse-movement.model';
import { StockWarehouseService } from '../../modules/stock-warehouses/stock-warehouse.service';
import { StockPromotion } from '../../modules/stock-promotions/stock-promotion.model';
import { StockPromotionUsage } from '../../modules/stock-promotions/stock-promotion-usage.model';
import { StockPromotionService } from '../../modules/stock-promotions/stock-promotion.service';
import { PricingService } from '../../modules/pricing/pricing.service';
import { Order } from '../../modules/orders/order.model';
import { OrderService } from '../../modules/orders/order.service';
import { StockServiceGroup } from '../../modules/stock-service-groups/stock-service-group.model';
import { UserLevelGroupe } from '../../modules/admin-clients/user-level-groupe.model';
import { SettingsApi } from '../../modules/settings-apis/settings-api.model';
import { GiftCardProvidersProvider } from '../../modules/settings-apis/providers/gift-card-providers.provider';
import { GiftCardProviders2Provider } from '../../modules/settings-apis/providers/gift-card-providers-2.provider';
import { TemporaryNumberCodingSitesProvider } from '../../modules/settings-apis/providers/temporary-number-coding-sites.provider';

const localized = (value: string) => ({ en: value, fr: value, ar: value });

const attachClientLevel = async (clientId: mongoose.Types.ObjectId, serviceId: mongoose.Types.ObjectId, actorId: mongoose.Types.ObjectId) => {
  const group = await StockServiceGroup.create({
    name: 'VIP1',
    serviceId,
    pricingType: 'PERCENT',
    value: 0,
    negativeValue: 0,
    percentAgent: 0,
    entitlementValue: 0,
    isDefault: true,
    isDeleted: false,
    createdBy: actorId,
  });
  await UserLevelGroupe.create({ clientId, serviceId, groupId: group._id, points: 0 });
  return group;
};

describe('Business module integration tests', () => {
  beforeAll(async () => {
    await connectTestDB();
    await initTestData();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    await initTestData();
  });

  describe('payment codes', () => {
    it('redeems non-dollar payment codes by dividing by currency price', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      const currency = await SettingsCurrency.create({
        name: 'Turkey',
        shortName: 'TR',
        price: 45.58,
        priceBuy: 45.58,
        isDollar: false,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const { plainCode } = await PaymentCodeService.create(
        { code: 'TR-ABCDEF-GHJKLM-NPQRST-UVWXYZ', value: 109, currencyId: currency._id.toString() },
        admin._id.toString()
      );

      const result = await PaymentCodeService.redeem(client._id.toString(), plainCode);
      const updatedClient = await User.findById(client._id).lean();
      const movement = await ClientFinancialMovement.findOne({ clientId: client._id }).lean();

      expect(result.amount).toBeCloseTo(109 / 45.58, 6);
      expect(updatedClient?.balance).toBeCloseTo(109 / 45.58, 6);
      expect(movement?.amount).toBeCloseTo(109 / 45.58, 6);
      expect(movement?.originalAmount).toBe(109);
    });

    it('does not allow the same payment code to be redeemed twice', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      const currency = await SettingsCurrency.create({
        name: 'Dollar',
        shortName: 'USD',
        price: 1,
        priceBuy: 1,
        isDollar: true,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const { plainCode, paymentCode } = await PaymentCodeService.create(
        { code: 'USD-ABCDEF-GHJKLM-NPQRST-UVWXYZ', value: 25, currencyId: currency._id.toString() },
        admin._id.toString()
      );

      await PaymentCodeService.redeem(client._id.toString(), plainCode);
      await expect(PaymentCodeService.redeem(client._id.toString(), plainCode)).rejects.toThrow();

      const updatedClient = await User.findById(client._id).lean();
      const movements = await ClientFinancialMovement.find({ clientId: client._id }).lean();
      const journals = await PaymentCodeJournal.find({ paymentCodeId: paymentCode._id }).lean();
      const usedCode = await PaymentCode.findById(paymentCode._id).lean();

      expect(updatedClient?.balance).toBe(25);
      expect(movements).toHaveLength(1);
      expect(usedCode?.status).toBe('USED');
      expect(journals.map((journal) => journal.status).sort()).toEqual(['FAILED', 'SUCCESS']);
    });

    it('claims payment codes atomically under concurrent redeem attempts', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      const currency = await SettingsCurrency.create({
        name: 'Dollar',
        shortName: 'USD',
        price: 1,
        priceBuy: 1,
        isDollar: true,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const { plainCode, paymentCode } = await PaymentCodeService.create(
        { code: 'USD-ZZZZZZ-YYYYYY-XXXXXX-WWWWWW', value: 30, currencyId: currency._id.toString() },
        admin._id.toString()
      );

      const attempts = await Promise.allSettled([
        PaymentCodeService.redeem(client._id.toString(), plainCode),
        PaymentCodeService.redeem(client._id.toString(), plainCode),
      ]);

      const updatedClient = await User.findById(client._id).lean();
      const movements = await ClientFinancialMovement.find({ clientId: client._id }).lean();
      const journals = await PaymentCodeJournal.find({ paymentCodeId: paymentCode._id }).lean();
      const usedCode = await PaymentCode.findById(paymentCode._id).lean();

      expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);
      expect(updatedClient?.balance).toBe(30);
      expect(movements).toHaveLength(1);
      expect(usedCode?.status).toBe('USED');
      expect(journals.map((journal) => journal.status).sort()).toEqual(['FAILED', 'SUCCESS']);
    });
  });

  describe('warehouse stock', () => {
    it('imports warehouse items and recalculates stock counters', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const service = await StockService.create({
        name: localized('Gift cards'),
        description: localized('Gift cards'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('PlayStation'),
        description: localized('PlayStation'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        name: localized('PSN 10 USD'),
        description: localized('PSN 10 USD'),
        costPrice: 8,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'MANUAL',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });

      const warehouse = await StockWarehouseService.create(
        { name: 'PSN codes', productId: product._id.toString(), type: 'CODE', costPrice: 8, isVisible: true },
        admin._id.toString()
      ) as InstanceType<typeof StockWarehouse>;

      await StockWarehouseService.importItems(
        { warehouseId: warehouse._id.toString(), lines: 'CODE-1,SERIAL-1,PIN-1\nCODE-2,SERIAL-2,PIN-2' },
        admin._id.toString()
      );

      const updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      const items = await StockWarehouseItem.find({ warehouseId: warehouse._id }).sort({ code: 1 }).lean();
      const updatedProduct = await StockProduct.findById(product._id).lean();

      expect(updatedProduct?.fulfillmentType).toBe('WAREHOUSE');
      expect(updatedWarehouse?.totalQuantity).toBe(2);
      expect(updatedWarehouse?.availableQuantity).toBe(2);
      expect(updatedWarehouse?.reservedQuantity).toBe(0);
      expect(updatedWarehouse?.soldQuantity).toBe(0);
      expect(items.map((item) => item.code)).toEqual(['CODE-1', 'CODE-2']);
      expect(items.every((item) => item.status === 'AVAILABLE')).toBe(true);
    });

    it('updates warehouse counters when item status changes', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const productId = new mongoose.Types.ObjectId();
      const warehouse = await StockWarehouse.create({
        name: 'Codes',
        productId,
        serviceId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        type: 'CODE',
        costPrice: 1,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const item = await StockWarehouseItem.create({
        warehouseId: warehouse._id,
        productId,
        code: 'CODE-1',
        status: 'AVAILABLE',
        costPrice: 1,
        isDeleted: false,
        createdBy: admin._id,
      });
      await StockWarehouse.updateOne({ _id: warehouse._id }, { totalQuantity: 1, availableQuantity: 1 });

      await StockWarehouseService.updateItem(item._id.toString(), { status: 'SOLD' }, admin._id.toString());

      const updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      const updatedItem = await StockWarehouseItem.findById(item._id).lean();

      expect(updatedItem?.status).toBe('SOLD');
      expect(updatedItem?.soldAt).toBeDefined();
      expect(updatedWarehouse?.totalQuantity).toBe(1);
      expect(updatedWarehouse?.availableQuantity).toBe(0);
      expect(updatedWarehouse?.soldQuantity).toBe(1);
    });

    it('reserves, releases, and sells warehouse items for order flow', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      const productId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();
      const warehouse = await StockWarehouse.create({
        name: 'Codes',
        productId,
        serviceId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        type: 'CODE',
        costPrice: 1,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      await StockWarehouseItem.create({
        warehouseId: warehouse._id,
        productId,
        code: 'CODE-1',
        status: 'AVAILABLE',
        costPrice: 1,
        isDeleted: false,
        createdBy: admin._id,
      });
      await StockWarehouse.updateOne({ _id: warehouse._id }, { totalQuantity: 1, availableQuantity: 1 });

      const reserved = await StockWarehouseService.reserveAvailableItem(
        { productId: productId.toString(), orderId: orderId.toString(), clientId: client._id.toString() },
        admin._id.toString()
      );
      let updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      expect(reserved.status).toBe('RESERVED');
      expect(updatedWarehouse?.availableQuantity).toBe(0);
      expect(updatedWarehouse?.reservedQuantity).toBe(1);

      await StockWarehouseService.releaseReservedItem({ itemId: reserved._id.toString(), orderId: orderId.toString() }, admin._id.toString());
      updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      const released = await StockWarehouseItem.findById(reserved._id).lean();
      expect(released?.status).toBe('AVAILABLE');
      expect(released?.reservedByOrderId).toBeUndefined();
      expect(updatedWarehouse?.availableQuantity).toBe(1);
      expect(updatedWarehouse?.reservedQuantity).toBe(0);

      const reservedAgain = await StockWarehouseService.reserveAvailableItem(
        { productId: productId.toString(), orderId: orderId.toString(), clientId: client._id.toString() },
        admin._id.toString()
      );
      await StockWarehouseService.markReservedItemSold(
        { itemId: reservedAgain._id.toString(), orderId: orderId.toString(), clientId: client._id.toString() },
        admin._id.toString()
      );

      updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      const sold = await StockWarehouseItem.findById(reserved._id).lean();
      const movements = await StockWarehouseMovement.find({ warehouseId: warehouse._id }).sort({ createdAt: 1 }).lean();

      expect(sold?.status).toBe('SOLD');
      expect(sold?.soldByOrderId?.toString()).toBe(orderId.toString());
      expect(sold?.soldToClientId?.toString()).toBe(client._id.toString());
      expect(updatedWarehouse?.availableQuantity).toBe(0);
      expect(updatedWarehouse?.reservedQuantity).toBe(0);
      expect(updatedWarehouse?.soldQuantity).toBe(1);
      expect(movements.map((movement) => movement.type)).toEqual(['RESERVE', 'RELEASE', 'RESERVE', 'SALE']);
    });
  });

  describe('promotions', () => {
    it('records promotion usage and enforces usage limits', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      const productId = new mongoose.Types.ObjectId();
      const promotion = await StockPromotion.create({
        name: localized('Discount'),
        description: localized('Discount'),
        promotionType: 'PERCENT',
        value: 10,
        targetType: 'ALL_PRODUCTS',
        startAt: new Date(Date.now() - 1000),
        priority: 1,
        usageLimit: 1,
        perClientLimit: 1,
        usageCount: 0,
        isActive: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const usage = await StockPromotionService.recordUsage(
        {
          promotionId: promotion._id.toString(),
          clientId: client._id.toString(),
          productId: productId.toString(),
          orderId: new mongoose.Types.ObjectId().toString(),
          discountAmount: 2,
          originalPrice: 20,
          finalPrice: 18,
        },
        admin._id.toString()
      );

      await expect(StockPromotionService.recordUsage(
        {
          promotionId: promotion._id.toString(),
          clientId: client._id.toString(),
          productId: productId.toString(),
          discountAmount: 1,
          originalPrice: 20,
          finalPrice: 19,
        },
        admin._id.toString()
      )).rejects.toThrow();

      const updatedPromotion = await StockPromotion.findById(promotion._id).lean();
      const usages = await StockPromotionUsage.find({ promotionId: promotion._id }).lean();

      expect(usage.discountAmount).toBe(2);
      expect(updatedPromotion?.usageCount).toBe(1);
      expect(usages).toHaveLength(1);
    });
  });

  describe('orders', () => {
    it('uses warehouse stock before API/manual fulfillment and deducts the client balance', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const service = await StockService.create({
        name: localized('Gift cards'),
        description: localized('Gift cards'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('Cards'),
        description: localized('Cards'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const vip2 = await StockServiceGroup.create({
        name: 'VIP2',
        serviceId: service._id,
        pricingType: 'PERCENT',
        value: 0,
        negativeValue: 0,
        percentAgent: 0,
        entitlementValue: 5,
        isDefault: false,
        isDeleted: false,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        name: localized('Card 10'),
        description: localized('Card 10'),
        costPrice: 8,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'API',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const warehouse = await StockWarehouse.create({
        name: 'Codes',
        productId: product._id,
        serviceId: service._id,
        categoryId: category._id,
        type: 'CODE',
        costPrice: 7,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const item = await StockWarehouseItem.create({
        warehouseId: warehouse._id,
        productId: product._id,
        code: 'CODE-1',
        status: 'AVAILABLE',
        costPrice: 99,
        isDeleted: false,
        createdBy: admin._id,
      });
      await StockWarehouse.updateOne({ _id: warehouse._id }, { totalQuantity: 1, availableQuantity: 1 });

      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1 },
        admin._id.toString()
      );

      const updatedClient = await User.findById(client._id).lean();
      const soldItem = await StockWarehouseItem.findById(item._id).lean();
      const updatedWarehouse = await StockWarehouse.findById(warehouse._id).lean();
      const movement = await ClientFinancialMovement.findOne({ referenceId: order._id }).lean();
      const clientLevel = await UserLevelGroupe.findOne({ clientId: client._id, serviceId: service._id }).lean();

      expect(order.fulfillmentSource).toBe('WAREHOUSE');
      expect(order.status).toBe('COMPLETED');
      expect(order.levelPointsApplied).toBe(true);
      expect(order.levelPointsAmount).toBeCloseTo(order.totalPrice, 6);
      expect(order.deliveredItems[0]?.code).toBe('CODE-1');
      expect(soldItem?.status).toBe('SOLD');
      expect(updatedWarehouse?.availableQuantity).toBe(0);
      expect(updatedWarehouse?.soldQuantity).toBe(1);
      expect(updatedClient?.balance).toBeCloseTo(100 - order.totalPrice, 6);
      expect(movement?.source).toBe('ORDER');
      expect(movement?.type).toBe('WITHDRAW');
      expect(order.unitCost).toBe(7);
      expect(clientLevel?.points).toBeCloseTo(order.totalPrice, 6);
      expect(clientLevel?.groupId.toString()).toBe(vip2._id.toString());

      await OrderService.complete(order._id.toString(), {}, admin._id.toString());
      const levelAfterSecondCompletion = await UserLevelGroupe.findOne({ clientId: client._id, serviceId: service._id }).lean();
      expect(levelAfterSecondCompletion?.points).toBeCloseTo(order.totalPrice, 6);
    });

    it('creates manual orders that must be taken before completion by an admin', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const otherAdmin = await createTestUser('ADMIN', { email: 'other-admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const service = await StockService.create({
        name: localized('Programming'),
        description: localized('Programming'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('Custom'),
        description: localized('Custom'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        name: localized('Manual service'),
        description: localized('Manual service'),
        costPrice: 20,
        costManual: 12,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'MANUAL',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });

      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1 },
        admin._id.toString()
      );

      expect(order.fulfillmentSource).toBe('MANUAL');
      expect(order.status).toBe('PENDING_MANUAL');
      expect(order.needsAdminAction).toBe(true);
      await expect(OrderService.complete(order._id.toString(), {}, admin._id.toString())).rejects.toThrow();

      await OrderService.take(order._id.toString(), admin._id.toString());
      await expect(OrderService.take(order._id.toString(), otherAdmin._id.toString())).rejects.toThrow();
      await OrderService.complete(order._id.toString(), { deliveredItems: [{ code: 'DONE' }] }, admin._id.toString());

      const completed = await Order.findById(order._id).lean();
      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.deliveredItems[0]?.code).toBe('DONE');
    });

    it('uses warehouse cost for pricing when a product is configured for warehouse fulfillment', async () => {
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const service = await StockService.create({
        name: localized('Gift cards'),
        description: localized('Gift cards'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('Cards'),
        description: localized('Cards'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        name: localized('Card 20'),
        description: localized('Card 20'),
        costPrice: 20,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'WAREHOUSE',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await StockWarehouse.create({
        name: 'Codes',
        productId: product._id,
        serviceId: service._id,
        categoryId: category._id,
        type: 'CODE',
        costPrice: 7,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const pricing = await PricingService.calculateForClient({
        clientId: client._id.toString(),
        productId: product._id.toString(),
        quantity: 1,
      });

      expect(pricing.unitCost).toBe(7);
      expect(pricing.finalUnitPrice).toBe(7);
      expect(pricing.warehouseCostSource).toBe('WAREHOUSE');
    });

    it('calls temporary number provider with selected country and stores activation details', async () => {
      const simulateSpy = jest.spyOn(TemporaryNumberCodingSitesProvider, 'simulate').mockResolvedValue({
        raw: 'ACCESS_NUMBER:12345:+905551112233',
        parsed: { type: 'ACCESS_NUMBER', activationId: '12345', phoneNumber: '+905551112233' },
        errorInfo: null,
      });
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const currency = await SettingsCurrency.create({
        name: 'Dollar',
        shortName: 'USD',
        price: 1,
        priceBuy: 1,
        isDollar: true,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const service = await StockService.create({
        name: localized('Numbers'),
        description: localized('Numbers'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('Telegram'),
        description: localized('Telegram'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const api = await SettingsApi.create({
        name: 'Grizzly',
        link: 'https://grizzlysms.com',
        token: 'secret-token',
        group: 'TEMPORARY_NUMBER_CODING_SITES',
        currencyId: currency._id,
        syncSchedule: '0 0 * * *',
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        apiId: api._id,
        apiGroup: 'TEMPORARY_NUMBER_CODING_SITES',
        apiProductId: 'tg',
        apiProductKey: `${api._id}:TEMPORARY_NUMBER_CODING_SITES:tg`,
        apiPayload: {
          serviceCode: 'tg',
          countries: [{ countryCode: '7', countryName: 'Russia', price: 2.5, count: 10 }],
          dynamicPrice: true,
        },
        visibleCountryCodes: ['7'],
        name: localized('Telegram'),
        description: localized('Telegram'),
        costPrice: 0,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'API',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await StockProductApiConnection.create({
        productId: product._id,
        apiId: api._id,
        apiGroup: 'TEMPORARY_NUMBER_CODING_SITES',
        apiProductId: 'tg',
        apiProductKey: `${api._id}:TEMPORARY_NUMBER_CODING_SITES:tg`,
        apiPayload: {
          serviceCode: 'tg',
          countries: [{ countryCode: '7', countryName: 'Russia', price: 2.5, count: 10 }],
        },
        providerPrice: 0,
        costPrice: 0,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isActive: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1, requirements: { countryCode: '7' } },
        admin._id.toString()
      );

      expect(simulateSpy).toHaveBeenCalledWith(
        { baseUrl: 'https://grizzlysms.com', token: 'secret-token' },
        expect.objectContaining({ action: 'GET_NUMBER', service: 'tg', country: '7' })
      );
      expect(order.fulfillmentSource).toBe('API');
      expect(order.providerOrderId).toBe('12345');
      expect(order.providerStatus).toBe('WAITING_CODE');
      expect(order.deliveredItems[0]?.code).toBe('+905551112233');
      expect(order.unitCost).toBe(2.5);
      simulateSpy.mockRestore();
    });

    it('maps gift card provider order error codes to specific admin issue reasons', async () => {
      const createOrderSpy = jest.spyOn(GiftCardProvidersProvider, 'createOrder').mockResolvedValue({
        code: 105,
        message: 'Insufficient balance',
      });
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const currency = await SettingsCurrency.create({
        name: 'Dollar',
        shortName: 'USD',
        price: 1,
        priceBuy: 1,
        isDollar: true,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const service = await StockService.create({
        name: localized('Gift cards'),
        description: localized('Gift cards'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('PUBG'),
        description: localized('PUBG'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const api = await SettingsApi.create({
        name: 'Gift API',
        link: 'https://api.example.com',
        token: 'secret-token',
        group: 'GIFT_CARD_PROVIDERS',
        currencyId: currency._id,
        syncSchedule: '0 0 * * *',
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS',
        apiProductId: '365',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS:365`,
        name: localized('UC 60'),
        description: localized('UC 60'),
        costPrice: 1,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'API',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await StockProductApiConnection.create({
        productId: product._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS',
        apiProductId: '365',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS:365`,
        providerPrice: 1,
        costPrice: 1,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isActive: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1 },
        admin._id.toString()
      );

      expect(createOrderSpy).toHaveBeenCalled();
      expect(order.status).toBe('FAILED');
      expect(order.needsAdminAction).toBe(true);
      expect(order.issueReason).toBe('GIFT_CARD_PROVIDER_QUANTITY_NOT_AVAILABLE');
      createOrderSpy.mockRestore();
    });

    it('polls pending API orders and completes provider-approved gift card provider 2 orders', async () => {
      const submitPinSpy = jest.spyOn(GiftCardProviders2Provider, 'submitPin').mockResolvedValue({
        raw: 'OK|10.12|980.88',
        parsed: { status: 'OK', code: undefined, dealerCostOrDescription: '10.12', remainingBalance: '980.88', description: undefined },
      });
      const checkPinSpy = jest.spyOn(GiftCardProviders2Provider, 'checkPin').mockResolvedValue({
        raw: 'OK|2|PIN-123|Done',
        parsed: { status: 'OK', code: 2, loadedPin: 'PIN-123', description: 'Done', statusInfo: { key: 'APPROVED_PIN_LOADED', final: true } },
      });
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const currency = await SettingsCurrency.create({
        name: 'Lira',
        shortName: 'TRY',
        price: 45,
        priceBuy: 45,
        isDollar: false,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const service = await StockService.create({
        name: localized('Gift cards 2'),
        description: localized('Gift cards 2'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('Razer'),
        description: localized('Razer'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const api = await SettingsApi.create({
        name: 'ZNET',
        link: 'https://bayi.example.com',
        token: '5536695116:secret',
        group: 'GIFT_CARD_PROVIDERS_2',
        currencyId: currency._id,
        syncSchedule: '0 0 * * *',
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS_2',
        apiProductId: '84',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS_2:84`,
        name: localized('Razer GOLD 100TL'),
        description: localized('Razer GOLD 100TL'),
        costPrice: 3,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'API',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await StockProductApiConnection.create({
        productId: product._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS_2',
        apiProductId: '84',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS_2:84`,
        apiPayload: { oyun_id: '17', kupur: '100', oyun_bilgi_id: '4' },
        providerPrice: 109.37,
        costPrice: 109.37 / 45,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isActive: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1 },
        admin._id.toString()
      );

      expect(order.status).toBe('PROCESSING');
      await Order.updateOne({ _id: order._id }, { $set: { nextStatusCheckAt: new Date(Date.now() - 1000) } });
      const summary = await OrderService.pollPendingApiOrders();
      const completed = await Order.findById(order._id).lean();
      const level = await UserLevelGroupe.findOne({ clientId: client._id, serviceId: service._id }).lean();

      expect(submitPinSpy).toHaveBeenCalled();
      expect(checkPinSpy).toHaveBeenCalledWith({ baseUrl: 'https://bayi.example.com', token: '5536695116:secret' }, order.orderNumber);
      expect(summary.completed).toBe(1);
      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.deliveredItems[0]?.pin).toBe('PIN-123');
      expect(completed?.levelPointsApplied).toBe(true);
      expect(level?.points).toBeCloseTo(completed?.totalPrice || 0, 6);
      submitPinSpy.mockRestore();
      checkPinSpy.mockRestore();
    });

    it('maps thrown gift card provider request failures to an admin issue reason', async () => {
      const createOrderSpy = jest.spyOn(GiftCardProvidersProvider, 'createOrder').mockRejectedValue(new Error('settingsApis.gift_card_provider_request_failed'));
      const admin = await createTestUser('SUPER_ADMIN', { email: 'admin@example.com' });
      const client = await createTestUser('USER', { email: 'client@example.com' });
      await User.updateOne({ _id: client._id }, { $set: { balance: 100 } });
      const currency = await SettingsCurrency.create({
        name: 'Dollar',
        shortName: 'USD',
        price: 1,
        priceBuy: 1,
        isDollar: true,
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const service = await StockService.create({
        name: localized('Gift cards'),
        description: localized('Gift cards'),
        type: 'DIGITAL_BASICS',
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      const category = await StockCategory.create({
        name: localized('PUBG'),
        description: localized('PUBG'),
        serviceId: service._id,
        isVisible: true,
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await attachClientLevel(client._id as mongoose.Types.ObjectId, service._id as mongoose.Types.ObjectId, admin._id as mongoose.Types.ObjectId);
      const api = await SettingsApi.create({
        name: 'Gift API',
        link: 'https://api.example.com',
        token: 'secret-token',
        group: 'GIFT_CARD_PROVIDERS',
        currencyId: currency._id,
        syncSchedule: '0 0 * * *',
        isVisible: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const product = await StockProduct.create({
        serviceId: service._id,
        categoryId: category._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS',
        apiProductId: '365',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS:365`,
        name: localized('UC 60'),
        description: localized('UC 60'),
        costPrice: 1,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isVisible: true,
        dripfeed: false,
        refill: false,
        cancel: false,
        stock: true,
        fulfillmentType: 'API',
        requirements: [],
        isDeleted: false,
        sortOrder: 0,
        createdBy: admin._id,
      });
      await StockProductApiConnection.create({
        productId: product._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS',
        apiProductId: '365',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS:365`,
        providerPrice: 1,
        costPrice: 1,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isActive: true,
        isDeleted: false,
        createdBy: admin._id,
      });
      const fallbackConnection = await StockProductApiConnection.create({
        productId: product._id,
        apiId: api._id,
        apiGroup: 'GIFT_CARD_PROVIDERS',
        apiProductId: '366',
        apiProductKey: `${api._id}:GIFT_CARD_PROVIDERS:366`,
        apiPayload: { params: ['player_id'] },
        providerPrice: 2,
        costPrice: 2,
        forQuantity: 1,
        quantityMode: 'WITHOUT_QUANTITY',
        quantityAvailable: true,
        isActive: false,
        isDeleted: false,
        createdBy: admin._id,
      });
      await StockProductRequirement.create({
        paramsName: 'player_id',
        message: localized('Player ID'),
        description: localized('Player ID'),
        apiGroup: 'GIFT_CARD_PROVIDERS',
        inputType: 'TEXT',
        isRequired: true,
        isDeleted: false,
        createdBy: admin._id,
      });

      const order = await OrderService.create(
        { clientId: client._id.toString(), productId: product._id.toString(), quantity: 1 },
        admin._id.toString()
      );

      expect(createOrderSpy).toHaveBeenCalled();
      expect(order.status).toBe('FAILED');
      expect(order.issueReason).toBe('GIFT_CARD_PROVIDER_REQUEST_FAILED');
      createOrderSpy.mockReset().mockResolvedValue({ order: 'PROVIDER-2' });

      await OrderService.take(order._id.toString(), admin._id.toString());
      const switched = await OrderService.switchApi(
        order._id.toString(),
        { connectionId: fallbackConnection._id.toString(), requirements: { player_id: 'abc-123' } },
        admin._id.toString()
      );

      expect(createOrderSpy).toHaveBeenLastCalledWith(
        { baseUrl: 'https://api.example.com', token: 'secret-token' },
        expect.objectContaining({ productId: 366, params: { playerId: 'abc-123' } })
      );
      expect(switched.status).toBe('PROCESSING');
      expect(switched.apiConnectionId?.toString()).toBe(fallbackConnection._id.toString());
      expect(switched.requirementSnapshots[0]?.paramsName).toBe('player_id');
      expect(switched.requirementSnapshots[0]?.value).toBe('abc-123');
      createOrderSpy.mockRestore();
    });
  });
});
