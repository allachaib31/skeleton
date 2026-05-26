import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import { scanUploadedFiles, uploadFields, validateImageFileSignature, validateUploadPolicy } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { SettingsPaymentGatewayController } from './settings-payment-gateway.controller';
import { createSettingsPaymentGatewaySchema, updateSettingsPaymentGatewaySchema } from './settings-payment-gateway.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/settings/payment-gateways:
 *   get:
 *     summary: List payment gateways
 *     tags: [SettingsPaymentGateways]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment gateways retrieved
 */
router.get('/', asyncHandler(SettingsPaymentGatewayController.list));

/**
 * @swagger
 * /admin/settings/payment-gateways:
 *   post:
 *     summary: Create payment gateway
 *     tags: [SettingsPaymentGateways]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Payment gateway created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'infoFiles', maxCount: 30 },
  ]),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createSettingsPaymentGatewaySchema),
  asyncHandler(SettingsPaymentGatewayController.create)
);

/**
 * @swagger
 * /admin/settings/payment-gateways/{id}:
 *   patch:
 *     summary: Update payment gateway
 *     tags: [SettingsPaymentGateways]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment gateway updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'infoFiles', maxCount: 30 },
  ]),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateSettingsPaymentGatewaySchema),
  asyncHandler(SettingsPaymentGatewayController.update)
);

export default router;
