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
import { SettingsCurrencyController } from './settings-currency.controller';
import { createSettingsCurrencySchema, updateSettingsCurrencySchema } from './settings-currency.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/settings/currencies:
 *   get:
 *     summary: List settings currencies
 *     tags: [SettingsCurrencies]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Currencies retrieved
 */
router.get('/', asyncHandler(SettingsCurrencyController.list));

/**
 * @swagger
 * /admin/settings/currencies:
 *   post:
 *     summary: Create settings currency
 *     tags: [SettingsCurrencies]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Currency created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadSingle('icon'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createSettingsCurrencySchema),
  asyncHandler(SettingsCurrencyController.create)
);

/**
 * @swagger
 * /admin/settings/currencies/{id}:
 *   patch:
 *     summary: Update settings currency
 *     tags: [SettingsCurrencies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Currency updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadSingle('icon'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateSettingsCurrencySchema),
  asyncHandler(SettingsCurrencyController.update)
);

export default router;
