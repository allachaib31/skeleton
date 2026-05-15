import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  scanUploadedFiles,
  uploadSingle,
  validateImageFileSignature,
  validateUploadPolicy,
} from '../../middlewares/upload.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /uploads/avatar:
 *   post:
 *     summary: Upload avatar file
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post(
  '/avatar',
  uploadSingle('avatar'),
  validateUploadPolicy('avatar'),
  validateImageFileSignature,
  scanUploadedFiles,
  asyncHandler(UploadController.uploadAvatar)
);

/**
 * @swagger
 * /uploads:
 *   get:
 *     summary: Get my uploads
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user uploads
 */
router.get('/', asyncHandler(UploadController.getMyUploads));

/**
 * @swagger
 * /uploads/{id}:
 *   delete:
 *     summary: Delete an upload
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Upload deleted
 */
router.delete('/:id', asyncHandler(UploadController.deleteUpload));

export default router;
