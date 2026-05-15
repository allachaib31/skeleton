import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  scanUploadedFiles,
  uploadSingle,
  validateImageFileSignature,
  validateUploadPolicy,
} from '../../middlewares/upload.middleware';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import {
  updateProfileSchema,
  deleteAccountSchema,
  changePasswordSchema
} from './users.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', asyncHandler(UsersController.getProfile));

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update own profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  asyncHandler(UsersController.updateProfile)
);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Soft-delete own account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete(
  '/me',
  validate(deleteAccountSchema),
  asyncHandler(UsersController.deleteAccount)
);

/**
 * @swagger
 * /users/me/avatar:
 *   patch:
 *     summary: Upload avatar
 *     tags: [Users]
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
 *         description: Avatar uploaded
 */
router.patch(
  '/me/avatar',
  uploadRateLimit,
  uploadSingle('avatar'),
  validateUploadPolicy('avatar'),
  validateImageFileSignature,
  scanUploadedFiles,
  asyncHandler(UsersController.updateAvatar)
);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.patch(
  '/me/password',
  validate(changePasswordSchema),
  asyncHandler(UsersController.changePassword)
);

/**
 * @swagger
 * /users/me/sessions:
 *   get:
 *     summary: List active sessions
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/me/sessions', asyncHandler(UsersController.getSessions));

/**
 * @swagger
 * /users/me/sessions/{id}:
 *   delete:
 *     summary: Revoke a session
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete('/me/sessions/:id', asyncHandler(UsersController.revokeSession));

export default router;
