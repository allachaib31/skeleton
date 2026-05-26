import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import {
  scanUploadedFiles,
  uploadSingle,
  validateImageFileSignature,
  validateUploadPolicy,
} from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { StockProductController } from './stock-product.controller';
import {
  bulkUpdateStockProductsSchema,
  createStockProductSchema,
  createProductApiConnectionSchema,
  importApiProductsSchema,
  listStockProductsSchema,
  productApiConnectionIdParamsSchema,
  productApiConnectionParamsSchema,
  previewApiProductsImportSchema,
  reorderStockProductsSchema,
  updateProductApiConnectionSchema,
  updateStockProductSchema,
} from './stock-product.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/products:
 *   get:
 *     summary: List stock products
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved
 */
router.get('/', validate(listStockProductsSchema, 'query'), asyncHandler(StockProductController.list));

/**
 * @swagger
 * /admin/stocks/products/import/preview:
 *   post:
 *     summary: Preview provider products before importing
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Provider products retrieved
 */
router.post('/import/preview', validate(previewApiProductsImportSchema), asyncHandler(StockProductController.previewApiProductsImport));

/**
 * @swagger
 * /admin/stocks/products/import:
 *   post:
 *     summary: Import provider products into stock products
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Provider products imported
 */
router.post('/import', validate(importApiProductsSchema), asyncHandler(StockProductController.importApiProducts));

/**
 * @swagger
 * /admin/stocks/products/{id}/api-connections:
 *   get:
 *     summary: List product API connections
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product API connections retrieved
 *   post:
 *     summary: Create product API connection
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Product API connection created
 */
router.get(
  '/:productId/api-connections',
  validate(productApiConnectionParamsSchema, 'params'),
  asyncHandler(StockProductController.listApiConnections)
);

router.post(
  '/:productId/api-connections',
  validate(productApiConnectionParamsSchema, 'params'),
  validate(createProductApiConnectionSchema),
  asyncHandler(StockProductController.createApiConnection)
);

/**
 * @swagger
 * /admin/stocks/products/{id}/api-connections/{connectionId}:
 *   patch:
 *     summary: Update product API connection
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product API connection updated
 *   delete:
 *     summary: Soft delete product API connection
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product API connection deleted
 */
router.patch(
  '/:productId/api-connections/:connectionId',
  validate(productApiConnectionIdParamsSchema, 'params'),
  validate(updateProductApiConnectionSchema),
  asyncHandler(StockProductController.updateApiConnection)
);

/**
 * @swagger
 * /admin/stocks/products/{id}/api-connections/{connectionId}/activate:
 *   patch:
 *     summary: Activate product API connection
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product API connection activated
 */
router.patch(
  '/:productId/api-connections/:connectionId/activate',
  validate(productApiConnectionIdParamsSchema, 'params'),
  asyncHandler(StockProductController.activateApiConnection)
);

router.delete(
  '/:productId/api-connections/:connectionId',
  validate(productApiConnectionIdParamsSchema, 'params'),
  asyncHandler(StockProductController.deleteApiConnection)
);

/**
 * @swagger
 * /admin/stocks/products/{id}:
 *   get:
 *     summary: Get stock product
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product retrieved
 */
router.get('/:id', asyncHandler(StockProductController.getById));

/**
 * @swagger
 * /admin/stocks/products:
 *   post:
 *     summary: Create stock product
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Product created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createStockProductSchema),
  asyncHandler(StockProductController.create)
);

router.patch('/reorder', validate(reorderStockProductsSchema), asyncHandler(StockProductController.reorder));

router.patch('/bulk', validate(bulkUpdateStockProductsSchema), asyncHandler(StockProductController.bulkUpdate));

/**
 * @swagger
 * /admin/stocks/products/{id}:
 *   patch:
 *     summary: Update stock product
 *     tags: [StockProducts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateStockProductSchema),
  asyncHandler(StockProductController.update)
);

export default router;
