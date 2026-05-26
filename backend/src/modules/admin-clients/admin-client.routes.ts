import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import { scanUploadedFiles, uploadSingle, validateImageFileSignature, validateUploadPolicy } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { AdminClientController } from './admin-client.controller';
import {
  bulkDeleteClientSpecialPricesSchema,
  createAdminClientSchema,
  createClientMovementSchema,
  createClientSpecialPriceSchema,
  updateClientSpecialPriceSchema,
  updateAdminClientSchema,
  updateClientLevelSchema,
  updateClientOpenCreditSchema,
} from './admin-client.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/clients:
 *   get:
 *     summary: List admin clients
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Clients retrieved
 */
router.get('/', asyncHandler(AdminClientController.list));

/**
 * @swagger
 * /admin/clients:
 *   post:
 *     summary: Create admin client
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Client created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadSingle('avatar'),
  validateUploadPolicy('avatar'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createAdminClientSchema),
  asyncHandler(AdminClientController.create)
);

/**
 * @swagger
 * /admin/clients/financial-movements:
 *   get:
 *     summary: List all client financial movements
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Financial movements retrieved
 */
router.get('/financial-movements', asyncHandler(AdminClientController.listAllMovements));

/**
 * @swagger
 * /admin/clients/special-prices:
 *   get:
 *     summary: List all client product special prices
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Client special prices retrieved
 */
router.get('/special-prices', asyncHandler(AdminClientController.listAllSpecialPrices));

/**
 * @swagger
 * /admin/clients/special-prices/bulk-delete:
 *   patch:
 *     summary: Soft delete selected client product special prices
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Client special prices soft deleted
 */
router.patch('/special-prices/bulk-delete', validate(bulkDeleteClientSpecialPricesSchema), asyncHandler(AdminClientController.bulkDeleteAllSpecialPrices));

/**
 * @swagger
 * /admin/clients/special-prices/{specialPriceId}:
 *   patch:
 *     summary: Update client product special price
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialPriceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client special price updated
 */
router.patch('/special-prices/:specialPriceId', validate(updateClientSpecialPriceSchema), asyncHandler(AdminClientController.updateSpecialPrice));

/**
 * @swagger
 * /admin/clients/{id}:
 *   get:
 *     summary: Get admin client details
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client retrieved
 */
router.get('/:id', asyncHandler(AdminClientController.get));

/**
 * @swagger
 * /admin/clients/{id}:
 *   patch:
 *     summary: Update admin client
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadSingle('avatar'),
  validateUploadPolicy('avatar'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateAdminClientSchema),
  asyncHandler(AdminClientController.update)
);

/**
 * @swagger
 * /admin/clients/{id}:
 *   delete:
 *     summary: Soft delete admin client
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client soft deleted
 */
router.delete('/:id', asyncHandler(AdminClientController.softDelete));

/**
 * @swagger
 * /admin/clients/{id}/movements:
 *   post:
 *     summary: Create client financial movement
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Financial movement created
 */
router.post('/:id/movements', validate(createClientMovementSchema), asyncHandler(AdminClientController.createMovement));

/**
 * @swagger
 * /admin/clients/{id}/open-credit:
 *   patch:
 *     summary: Update client open credit limit
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client open credit updated
 */
router.patch('/:id/open-credit', validate(updateClientOpenCreditSchema), asyncHandler(AdminClientController.updateOpenCredit));

/**
 * @swagger
 * /admin/clients/{id}/levels:
 *   get:
 *     summary: List client service levels
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client levels retrieved
 */
router.get('/:id/levels', asyncHandler(AdminClientController.listLevels));

/**
 * @swagger
 * /admin/clients/{id}/levels/generate:
 *   post:
 *     summary: Generate missing client service levels
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client levels generated
 */
router.post('/:id/levels/generate', asyncHandler(AdminClientController.generateLevels));

/**
 * @swagger
 * /admin/clients/{id}/levels/{levelId}:
 *   patch:
 *     summary: Update client service level
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client level updated
 */
router.patch('/:id/levels/:levelId', validate(updateClientLevelSchema), asyncHandler(AdminClientController.updateLevel));

/**
 * @swagger
 * /admin/clients/{id}/special-prices:
 *   get:
 *     summary: List client product special prices
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client special prices retrieved
 */
router.get('/:id/special-prices', asyncHandler(AdminClientController.listSpecialPrices));

/**
 * @swagger
 * /admin/clients/{id}/special-prices:
 *   post:
 *     summary: Create client product special price
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Client special price created
 */
router.post('/:id/special-prices', validate(createClientSpecialPriceSchema), asyncHandler(AdminClientController.createSpecialPrice));

/**
 * @swagger
 * /admin/clients/{id}/special-prices/bulk-delete:
 *   patch:
 *     summary: Soft delete selected client product special prices
 *     tags: [AdminClients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client special prices soft deleted
 */
router.patch(
  '/:id/special-prices/bulk-delete',
  validate(bulkDeleteClientSpecialPricesSchema),
  asyncHandler(AdminClientController.bulkDeleteSpecialPrices)
);

export default router;
