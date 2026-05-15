import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { createRoleSchema, updateRoleSchema } from './roles.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', asyncHandler(RolesController.getRoles));

/**
 * @swagger
 * /admin/roles:
 *   post:
 *     summary: Create custom role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, permissionIds]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               permissionIds: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Role created
 */
router.post(
  '/',
  validate(createRoleSchema),
  asyncHandler(RolesController.createRole)
);

/**
 * @swagger
 * /admin/roles/{id}:
 *   patch:
 *     summary: Update role
 *     tags: [Roles]
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
 *               name: { type: string }
 *               description: { type: string }
 *               permissionIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch(
  '/:id',
  validate(updateRoleSchema),
  asyncHandler(RolesController.updateRole)
);

/**
 * @swagger
 * /admin/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete('/:id', asyncHandler(RolesController.deleteRole));

export default router;
