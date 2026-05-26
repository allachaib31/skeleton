import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { authRateLimit } from '../../middlewares/rateLimit.middleware';
import { languageMiddleware } from '../../middlewares/language.middleware';
import { csrfOriginGuard } from '../../middlewares/csrf.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import {
  registerSchema,
  loginSchema,
  verifyTwoFactorLoginSchema,
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from './auth.validator';

const router = Router();

router.use(languageMiddleware);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account banned or locked
 */
router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * @swagger
 * /auth/2fa/verify-login:
 *   post:
 *     summary: Complete login with two-factor authentication
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  '/2fa/verify-login',
  authRateLimit,
  validate(verifyTwoFactorLoginSchema),
  asyncHandler(AuthController.verifyTwoFactorLogin)
);

/**
 * @swagger
 * /auth/2fa/setup:
 *   post:
 *     summary: Start two-factor authentication setup
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Two-factor setup started
 */
router.post(
  '/2fa/setup',
  csrfOriginGuard,
  authenticate,
  asyncHandler(AuthController.setupTwoFactor)
);

/**
 * @swagger
 * /auth/2fa/enable:
 *   post:
 *     summary: Enable two-factor authentication
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Two-factor authentication enabled
 */
router.post(
  '/2fa/enable',
  csrfOriginGuard,
  authenticate,
  validate(enableTwoFactorSchema),
  asyncHandler(AuthController.enableTwoFactor)
);

/**
 * @swagger
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Two-factor authentication disabled
 */
router.post(
  '/2fa/disable',
  csrfOriginGuard,
  authenticate,
  validate(disableTwoFactorSchema),
  asyncHandler(AuthController.disableTwoFactor)
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  '/logout',
  csrfOriginGuard,
  authenticate,
  asyncHandler(AuthController.logout)
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh-token',
  csrfOriginGuard,
  asyncHandler(AuthController.refreshToken)
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid token
 */
router.post(
  '/verify-email',
  authRateLimit,
  validate(verifyEmailSchema),
  asyncHandler(AuthController.verifyEmail)
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post(
  '/resend-verification',
  authRateLimit,
  asyncHandler(AuthController.resendVerification)
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword)
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token
 */
router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword)
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password while logged in
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect current password
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
);

export default router;
