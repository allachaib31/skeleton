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
import { StockServiceController } from './stock-service.controller';
import { createStockServiceSchema, listStockServicesSchema, reorderStockServicesSchema, updateStockServiceSchema } from './stock-service.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/stocks/services:
 *   get:
 *     summary: List stock services
 *     tags: [StockServices]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stock services retrieved
 */
router.get('/', validate(listStockServicesSchema, 'query'), asyncHandler(StockServiceController.list));

/**
 * @swagger
 * /admin/stocks/services:
 *   post:
 *     summary: Create stock service
 *     tags: [StockServices]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: JSON object with en, fr, ar }
 *               description: { type: string, description: JSON object with en, fr, ar }
 *               type: { type: string, enum: [DIGITAL_BASICS, SOCIAL_REINFORCERS, ESIM_NUMBER, PHONE_NUMBER_GENERATOR] }
 *               isVisible: { type: boolean }
 *               isDeleted: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Stock service created
 */
router.post(
  '/',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createStockServiceSchema),
  asyncHandler(StockServiceController.create)
);

router.patch(
  '/reorder',
  validate(reorderStockServicesSchema),
  asyncHandler(StockServiceController.reorder)
);

/**
 * @swagger
 * /admin/stocks/services/{id}:
 *   patch:
 *     summary: Update stock service
 *     tags: [StockServices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: JSON object with en, fr, ar }
 *               description: { type: string, description: JSON object with en, fr, ar }
 *               type: { type: string, enum: [DIGITAL_BASICS, SOCIAL_REINFORCERS, ESIM_NUMBER, PHONE_NUMBER_GENERATOR] }
 *               isVisible: { type: boolean }
 *               isDeleted: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Stock service updated
 */
router.patch(
  '/:id',
  uploadRateLimit,
  uploadSingle('image'),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(updateStockServiceSchema),
  asyncHandler(StockServiceController.update)
);

export default router;
