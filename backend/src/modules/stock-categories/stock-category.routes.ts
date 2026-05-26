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
import { StockCategoryController } from './stock-category.controller';
import { createStockCategorySchema, listStockCategoriesSchema, reorderStockCategoriesSchema, updateStockCategorySchema } from './stock-category.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/categories:
 *   get:
 *     summary: List stock categories
 *     tags: [StockCategories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stock categories retrieved
 */
router.get('/', validate(listStockCategoriesSchema, 'query'), asyncHandler(StockCategoryController.list));

/**
 * @swagger
 * /admin/stocks/categories:
 *   post:
 *     summary: Create stock category
 *     tags: [StockCategories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: JSON object with en, fr, ar }
 *               description: { type: string, description: JSON object with en, fr, ar }
 *               serviceId: { type: string }
 *               isVisible: { type: boolean }
 *               isDeleted: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Stock category created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createStockCategorySchema),
  asyncHandler(StockCategoryController.create)
);

router.patch(
  '/reorder',
  validate(reorderStockCategoriesSchema),
  asyncHandler(StockCategoryController.reorder)
);

/**
 * @swagger
 * /admin/stocks/categories/{id}:
 *   patch:
 *     summary: Update stock category
 *     tags: [StockCategories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stock category updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateStockCategorySchema),
  asyncHandler(StockCategoryController.update)
);

export default router;
