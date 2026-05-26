import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { paymentCodeRedeemRateLimit } from '../../middlewares/rateLimit.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { PaymentCodeController } from './payment-code.controller';
import {
  createPaymentCodeSchema,
  generatePaymentCodesSchema,
  importPaymentCodesSchema,
  listPaymentCodeJournalSchema,
  listPaymentCodesSchema,
  redeemPaymentCodeSchema,
  updatePaymentCodeSchema,
} from './payment-code.validator';

export const adminPaymentCodeRoutes = Router();

adminPaymentCodeRoutes.use(authenticate);

/**
 * @swagger
 * /admin/settings/payment-codes:
 *   get:
 *     summary: List payment codes
 *     tags: [PaymentCodes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment codes retrieved
 */
adminPaymentCodeRoutes.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), validate(listPaymentCodesSchema, 'query'), asyncHandler(PaymentCodeController.list));

/**
 * @swagger
 * /admin/settings/payment-codes/journal:
 *   get:
 *     summary: List payment code redeem journal entries
 *     tags: [PaymentCodes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment code journal retrieved
 */
adminPaymentCodeRoutes.get('/journal', requireRole('ADMIN', 'SUPER_ADMIN'), validate(listPaymentCodeJournalSchema, 'query'), asyncHandler(PaymentCodeController.listJournal));
adminPaymentCodeRoutes.post('/', requireRole('SUPER_ADMIN'), validate(createPaymentCodeSchema), asyncHandler(PaymentCodeController.create));
adminPaymentCodeRoutes.post('/generate', requireRole('SUPER_ADMIN'), validate(generatePaymentCodesSchema), asyncHandler(PaymentCodeController.generate));
adminPaymentCodeRoutes.post('/import', requireRole('SUPER_ADMIN'), validate(importPaymentCodesSchema), asyncHandler(PaymentCodeController.import));

/**
 * @swagger
 * /admin/settings/payment-codes/{id}:
 *   patch:
 *     summary: Update payment code
 *     tags: [PaymentCodes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment code updated
 */
adminPaymentCodeRoutes.patch('/:id', requireRole('SUPER_ADMIN'), validate(updatePaymentCodeSchema), asyncHandler(PaymentCodeController.update));

const redeemRoutes = Router();

redeemRoutes.use(authenticate);

/**
 * @swagger
 * /payment-codes/redeem:
 *   post:
 *     summary: Redeem payment code
 *     tags: [PaymentCodes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment code redeemed
 */
redeemRoutes.post('/redeem', paymentCodeRedeemRateLimit, validate(redeemPaymentCodeSchema), asyncHandler(PaymentCodeController.redeem));

export default redeemRoutes;
