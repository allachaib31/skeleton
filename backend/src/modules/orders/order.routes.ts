import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { OrderController } from './order.controller';
import { completeOrderSchema, createOrderSchema, failOrderSchema, listOrdersSchema, orderIdParamsSchema, switchOrderApiSchema } from './order.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/', validate(listOrdersSchema, 'query'), asyncHandler(OrderController.list));
router.post('/', validate(createOrderSchema), asyncHandler(OrderController.create));
router.get('/:id', validate(orderIdParamsSchema, 'params'), asyncHandler(OrderController.getById));
router.patch('/:id/take', validate(orderIdParamsSchema, 'params'), asyncHandler(OrderController.take));
router.patch('/:id/complete', validate(orderIdParamsSchema, 'params'), validate(completeOrderSchema), asyncHandler(OrderController.complete));
router.patch('/:id/fail', validate(orderIdParamsSchema, 'params'), validate(failOrderSchema), asyncHandler(OrderController.fail));
router.patch('/:id/switch-api', validate(orderIdParamsSchema, 'params'), validate(switchOrderApiSchema), asyncHandler(OrderController.switchApi));
router.patch('/:id/cancel', validate(orderIdParamsSchema, 'params'), asyncHandler(OrderController.cancel));

export default router;
