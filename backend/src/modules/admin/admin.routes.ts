import { Router, Request, Response, NextFunction } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuditLog } from '../audit/audit-log.model';
import { uploadJsonSingle } from '../../middlewares/upload.middleware';
import { I18nController } from '../i18n/i18n.controller';

import { logger } from '../../common/utils/logger';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

// Audit logging middleware for all admin routes
router.use(asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // We log all admin access in background to not block the request
  AuditLog.create({
    actorId: req.user!.id,
    action: `ADMIN_ACCESS_${req.method}_${req.path.replace(/\//g, '_').toUpperCase()}`,
    entity: 'Admin',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(err => logger.error('Admin Audit Log Error', err));
  
  next();
}));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', asyncHandler(AdminController.getDashboard));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List users with filters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, banned] }
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', asyncHandler(AdminController.getUsers));

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User data
 */
router.get('/users/:id', asyncHandler(AdminController.getUser));

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [active, inactive, banned] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/users/:id/status', asyncHandler(AdminController.updateUserStatus));

/**
 * @swagger
 * /admin/users/{id}/roles:
 *   patch:
 *     summary: Update user roles
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName: { type: string }
 *     responses:
 *       200:
 *         description: Roles updated
 */
router.patch('/users/:id/roles', asyncHandler(AdminController.updateUserRole));

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', asyncHandler(AdminController.deleteUser));

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Audit log list
 */
router.get('/audit-logs', asyncHandler(AdminController.getAuditLogs));

/**
 * @swagger
 * /admin/sessions:
 *   get:
 *     summary: List active sessions
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 */
router.get('/sessions', asyncHandler(AdminController.getSessions));

/**
 * @swagger
 * /admin/sessions/{id}:
 *   delete:
 *     summary: Revoke session
 *     tags: [Admin]
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
router.delete('/sessions/:id', asyncHandler(AdminController.deleteSession));

/**
 * @swagger
 * /admin/uploads:
 *   get:
 *     summary: List uploads
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of uploads
 */
router.get('/uploads', asyncHandler(AdminController.getUploads));

/**
 * @swagger
 * /admin/uploads/{id}:
 *   delete:
 *     summary: Delete upload
 *     tags: [Admin]
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
router.delete('/uploads/:id', asyncHandler(AdminController.deleteUpload));

/**
 * @swagger
 * /admin/languages:
 *   get:
 *     summary: List manageable languages
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available languages
 */
router.get('/languages', asyncHandler(I18nController.listLanguages));

/**
 * @swagger
 * /admin/languages/template:
 *   get:
 *     summary: Download language JSON template
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: English language model JSON
 */
router.get('/languages/template', asyncHandler(I18nController.downloadTemplate));

/**
 * @swagger
 * /admin/languages:
 *   post:
 *     summary: Upload language JSON file
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               direction: { type: string, enum: [ltr, rtl] }
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Language uploaded
 */
router.post('/languages', uploadJsonSingle('file'), asyncHandler(I18nController.uploadLanguage));

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     summary: Get system health
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Health status
 */
router.get('/system/health', asyncHandler(AdminController.getSystemHealth));

/**
 * @swagger
 * /admin/system/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/system/metrics', asyncHandler(AdminController.getSystemMetrics));

export default router;
