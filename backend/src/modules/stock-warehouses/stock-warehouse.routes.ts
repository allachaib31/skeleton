import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { StockWarehouseController } from './stock-warehouse.controller';
import {
  bulkUpdateStockWarehouseItemsSchema,
  createStockWarehouseItemSchema,
  createStockWarehouseSchema,
  importStockWarehouseItemsSchema,
  listStockWarehouseItemsSchema,
  listStockWarehousesSchema,
  updateStockWarehouseItemSchema,
  updateStockWarehouseSchema,
} from './stock-warehouse.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/warehouses:
 *   get:
 *     summary: List stock warehouses
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouses retrieved
 */
router.get('/', validate(listStockWarehousesSchema, 'query'), asyncHandler(StockWarehouseController.list));

/**
 * @swagger
 * /admin/stocks/warehouses/items:
 *   get:
 *     summary: List stock warehouse items
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse items retrieved
 */
router.get('/items', validate(listStockWarehouseItemsSchema, 'query'), asyncHandler(StockWarehouseController.listItems));

/**
 * @swagger
 * /admin/stocks/warehouses/items:
 *   post:
 *     summary: Create stock warehouse item
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Warehouse item created
 */
router.post('/items', validate(createStockWarehouseItemSchema), asyncHandler(StockWarehouseController.createItem));

/**
 * @swagger
 * /admin/stocks/warehouses/items/import:
 *   post:
 *     summary: Import stock warehouse items
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Warehouse items imported
 */
router.post('/items/import', validate(importStockWarehouseItemsSchema), asyncHandler(StockWarehouseController.importItems));

router.patch('/items/bulk', validate(bulkUpdateStockWarehouseItemsSchema), asyncHandler(StockWarehouseController.bulkUpdateItems));
router.patch('/items/:id', validate(updateStockWarehouseItemSchema), asyncHandler(StockWarehouseController.updateItem));

/**
 * @swagger
 * /admin/stocks/warehouses:
 *   post:
 *     summary: Create stock warehouse
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.post('/', validate(createStockWarehouseSchema), asyncHandler(StockWarehouseController.create));

/**
 * @swagger
 * /admin/stocks/warehouses/{id}:
 *   patch:
 *     summary: Update stock warehouse
 *     tags: [StockWarehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse updated
 */
router.patch('/:id', validate(updateStockWarehouseSchema), asyncHandler(StockWarehouseController.update));

export default router;
