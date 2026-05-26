import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { StockPromotionController } from './stock-promotion.controller';
import {
  createStockPromotionSchema,
  listStockPromotionsSchema,
  listStockPromotionUsagesSchema,
  updateStockPromotionSchema,
} from './stock-promotion.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/promotions:
 *   get:
 *     summary: List stock promotions
 *     tags: [StockPromotions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Promotions retrieved
 */
router.get('/', validate(listStockPromotionsSchema, 'query'), asyncHandler(StockPromotionController.list));

/**
 * @swagger
 * /admin/stocks/promotions/usages:
 *   get:
 *     summary: List stock promotion usages
 *     tags: [StockPromotions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Promotion usages retrieved
 */
router.get('/usages', validate(listStockPromotionUsagesSchema, 'query'), asyncHandler(StockPromotionController.listUsages));

/**
 * @swagger
 * /admin/stocks/promotions:
 *   post:
 *     summary: Create stock promotion
 *     tags: [StockPromotions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Promotion created
 */
router.post('/', validate(createStockPromotionSchema), asyncHandler(StockPromotionController.create));

/**
 * @swagger
 * /admin/stocks/promotions/{id}:
 *   patch:
 *     summary: Update stock promotion
 *     tags: [StockPromotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Promotion updated
 */
router.patch('/:id', validate(updateStockPromotionSchema), asyncHandler(StockPromotionController.update));

export default router;
