import { ClientSession } from 'mongoose';
import { Role } from './role.model';
import { Permission } from '../permissions/permission.model';
import { User } from '../users/user.model';
import { AuditLog } from '../audit/audit-log.model';
import { HttpError } from '../../common/errors/HttpError';
import { redisDel } from '../../config/redis.config';
import { withTransaction } from '../../database/transaction';

export class RolesService {
  static async getRoles() {
    return await Role.find().populate('permissions');
  }

  static async createRole(data: any, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const existing = await Role.findOne({ name: data.name }).session(session);
      if (existing) throw HttpError.conflict('roles.name_exists');

      if (data.permissionIds && data.permissionIds.length > 0) {
        const permsCount = await Permission.countDocuments({ _id: { $in: data.permissionIds } }).session(session);
        if (permsCount !== data.permissionIds.length) {
          throw HttpError.badRequest('roles.invalid_permissions');
        }
      }

      const role = new Role({
        name: data.name,
        description: data.description,
        permissions: data.permissionIds || [],
        isSystem: false,
      });

      await role.save({ session });

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: role._id,
        action: 'ROLE_CREATED',
        entity: 'Role',
        after: role.toObject(),
        ip,
        userAgent,
      }], { session });

      return role;
    });
  }

  static async updateRole(roleId: string, data: any, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const role = await Role.findById(roleId).session(session);
      if (!role) throw HttpError.notFound('roles.not_found');

      if (role.isSystem) {
        throw HttpError.forbidden('roles.cannot_edit_system');
      }

      if (data.name && data.name !== role.name) {
        const existing = await Role.findOne({ name: data.name }).session(session);
        if (existing) throw HttpError.conflict('roles.name_exists');
      }

      if (data.permissionIds && data.permissionIds.length > 0) {
        const permsCount = await Permission.countDocuments({ _id: { $in: data.permissionIds } }).session(session);
        if (permsCount !== data.permissionIds.length) {
          throw HttpError.badRequest('roles.invalid_permissions');
        }
      }

      const before = role.toObject();

      if (data.name) role.name = data.name;
      if (data.description !== undefined) role.description = data.description;
      if (data.permissionIds) role.permissions = data.permissionIds;

      await role.save({ session });

      // Invalidate cache for users with this role
      const usersWithRole = await User.find({ role: role._id }).select('_id').session(session);
      for (const u of usersWithRole) {
        await redisDel(`permissions:${u._id}`);
      }

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: role._id,
        action: 'ROLE_UPDATED',
        entity: 'Role',
        before,
        after: role.toObject(),
        ip,
        userAgent,
      }], { session });

      return role;
    });
  }

  static async deleteRole(roleId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const role = await Role.findById(roleId).session(session);
      if (!role) throw HttpError.notFound('roles.not_found');

      if (role.isSystem) {
        throw HttpError.forbidden('roles.cannot_delete_system');
      }

      const usersCount = await User.countDocuments({ role: roleId }).session(session);
      if (usersCount > 0) {
        throw HttpError.badRequest('roles.cannot_delete_assigned');
      }

      await role.deleteOne({ session });

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: role._id,
        action: 'ROLE_DELETED',
        entity: 'Role',
        before: role.toObject(),
        ip,
        userAgent,
      }], { session });
    });
  }
}
