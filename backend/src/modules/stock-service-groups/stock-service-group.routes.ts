import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { StockServiceGroupController } from './stock-service-group.controller';
import {
  createStockServiceGroupSchema,
  listStockServiceGroupsSchema,
  updateStockServiceGroupSchema,
} from './stock-service-group.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/service-groups:
 *   get:
 *     summary: List stock service groups
 *     tags: [StockServiceGroups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Service groups retrieved
 */
router.get('/', validate(listStockServiceGroupsSchema, 'query'), asyncHandler(StockServiceGroupController.list));

/**
 * @swagger
 * /admin/stocks/service-groups:
 *   post:
 *     summary: Create stock service group
 *     tags: [StockServiceGroups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Service group created
 */
router.post('/', validate(createStockServiceGroupSchema), asyncHandler(StockServiceGroupController.create));

/**
 * @swagger
 * /admin/stocks/service-groups/{id}:
 *   patch:
 *     summary: Update stock service group
 *     tags: [StockServiceGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service group updated
 */
router.patch('/:id', validate(updateStockServiceGroupSchema), asyncHandler(StockServiceGroupController.update));

export default router;
