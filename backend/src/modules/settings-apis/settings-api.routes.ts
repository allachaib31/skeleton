import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { SettingsApiController } from './settings-api.controller';
import { createSettingsApiSchema, simulateGiftCardProviders2Schema, simulateGiftCardProvidersSchema, simulateSocialMediaServiceProvidersSchema, simulateTemporaryNumberCodingSitesSchema, updateSettingsApiSchema } from './settings-api.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/settings/apis:
 *   get:
 *     summary: List settings APIs
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: APIs retrieved
 */
router.get('/', asyncHandler(SettingsApiController.list));

/**
 * @swagger
 * /admin/settings/apis/gift-card-providers/simulate:
 *   post:
 *     summary: Simulate Gift Card Providers API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Gift Card Providers API simulated
 */
router.post('/gift-card-providers/simulate', validate(simulateGiftCardProvidersSchema), asyncHandler(SettingsApiController.simulateGiftCardProviders));

/**
 * @swagger
 * /admin/settings/apis/gift-card-providers-2/simulate:
 *   post:
 *     summary: Simulate Gift Card Providers2 API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Gift Card Providers2 API simulated
 */
router.post('/gift-card-providers-2/simulate', validate(simulateGiftCardProviders2Schema), asyncHandler(SettingsApiController.simulateGiftCardProviders2));

/**
 * @swagger
 * /admin/settings/apis/social-media-service-providers/simulate:
 *   post:
 *     summary: Simulate Social Media Service Providers API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Social Media Service Providers API simulated
 */
router.post('/social-media-service-providers/simulate', validate(simulateSocialMediaServiceProvidersSchema), asyncHandler(SettingsApiController.simulateSocialMediaServiceProviders));

/**
 * @swagger
 * /admin/settings/apis/temporary-number-coding-sites/simulate:
 *   post:
 *     summary: Simulate Temporary Number Coding Sites API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Temporary Number Coding Sites API simulated
 */
router.post('/temporary-number-coding-sites/simulate', validate(simulateTemporaryNumberCodingSitesSchema), asyncHandler(SettingsApiController.simulateTemporaryNumberCodingSites));

/**
 * @swagger
 * /admin/settings/apis/sync-all:
 *   post:
 *     summary: Force sync all supported settings APIs
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: APIs synced
 */
router.post('/sync-all', asyncHandler(SettingsApiController.syncAll));

/**
 * @swagger
 * /admin/settings/apis:
 *   post:
 *     summary: Create settings API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: API created
 */
router.post('/', validate(createSettingsApiSchema), asyncHandler(SettingsApiController.create));

/**
 * @swagger
 * /admin/settings/apis/{id}/sync:
 *   post:
 *     summary: Force sync one settings API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: API synced
 */
router.post('/:id/sync', asyncHandler(SettingsApiController.sync));

/**
 * @swagger
 * /admin/settings/apis/{id}:
 *   patch:
 *     summary: Update settings API
 *     tags: [SettingsApis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: API updated
 */
router.patch('/:id', validate(updateSettingsApiSchema), asyncHandler(SettingsApiController.update));

export default router;
