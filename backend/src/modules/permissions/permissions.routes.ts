import { Router } from 'express';
import { PermissionsController } from './permissions.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/permissions:
 *   get:
 *     summary: List all permissions
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', asyncHandler(PermissionsController.getPermissions));

export default router;
