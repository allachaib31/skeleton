import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import {
  scanUploadedFiles,
  uploadFields,
  validateImageFileSignature,
  validateUploadPolicy,
} from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { StockProductGroupController } from './stock-product-group.controller';
import { createStockProductGroupSchema, listStockProductGroupsSchema } from './stock-product-group.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/product-groups:
 *   get:
 *     summary: List stock product groups
 *     tags: [StockProductGroups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Product groups retrieved
 */
router.get('/', validate(listStockProductGroupsSchema, 'query'), asyncHandler(StockProductGroupController.list));

/**
 * @swagger
 * /admin/stocks/product-groups:
 *   post:
 *     summary: Create stock product group
 *     tags: [StockProductGroups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Product group created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createStockProductGroupSchema),
  asyncHandler(StockProductGroupController.create)
);

export default router;
