import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { StockProductRequirementController } from './stock-product-requirement.controller';
import {
  createStockProductRequirementSchema,
  listStockProductRequirementsSchema,
  updateStockProductRequirementSchema,
} from './stock-product-requirement.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/product-requirements:
 *   get:
 *     summary: List stock product requirements
 *     tags: [StockProductRequirements]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Product requirements retrieved
 */
router.get('/', validate(listStockProductRequirementsSchema, 'query'), asyncHandler(StockProductRequirementController.list));

/**
 * @swagger
 * /admin/stocks/product-requirements:
 *   post:
 *     summary: Create stock product requirement
 *     tags: [StockProductRequirements]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Product requirement created
 */
router.post('/', validate(createStockProductRequirementSchema), asyncHandler(StockProductRequirementController.create));

/**
 * @swagger
 * /admin/stocks/product-requirements/{id}:
 *   patch:
 *     summary: Update stock product requirement
 *     tags: [StockProductRequirements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product requirement updated
 */
router.patch('/:id', validate(updateStockProductRequirementSchema), asyncHandler(StockProductRequirementController.update));

export default router;
