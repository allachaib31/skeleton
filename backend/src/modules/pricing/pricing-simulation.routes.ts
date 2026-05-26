import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { PricingSimulationController } from './pricing-simulation.controller';
import { calculatePricingSimulationSchema } from './pricing-simulation.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/settings/pricing-simulation/calculate:
 *   post:
 *     summary: Calculate product final price simulation
 *     tags: [PricingSimulation]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing simulation calculated
 */
router.post('/calculate', validate(calculatePricingSimulationSchema), asyncHandler(PricingSimulationController.calculate));

export default router;
