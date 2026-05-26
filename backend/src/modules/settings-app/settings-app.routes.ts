import { Router } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import {
  scanUploadedFiles,
  uploadFields,
  validateImageFileSignature,
  validateUploadPolicy,
} from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { SettingsAppController } from './settings-app.controller';
import { updateSettingsAppSchema } from './settings-app.validator';

const router = Router();

/**
 * @swagger
 * /settings/app:
 *   get:
 *     summary: Get public application branding settings
 *     tags: [SettingsApp]
 *     responses:
 *       200:
 *         description: App settings retrieved
 */
router.get('/', asyncHandler(SettingsAppController.get));

/**
 * @swagger
 * /settings/app:
 *   patch:
 *     summary: Update application branding settings
 *     tags: [SettingsApp]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: App settings updated
 */
router.patch(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  uploadRateLimit,
  uploadFields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateSettingsAppSchema),
  asyncHandler(SettingsAppController.update)
);

export default router;
