import mongoose from 'mongoose';
import { Role } from '../../modules/roles/role.model';
import { Permission } from '../../modules/permissions/permission.model';
import { User } from '../../modules/users/user.model';
import { env } from '../../config/env.config';
import { logger } from '../../common/utils/logger';

const defaultPermissions = [
  { name: 'users.read', module: 'users', action: 'read' },
  { name: 'users.create', module: 'users', action: 'create' },
  { name: 'users.update', module: 'users', action: 'update' },
  { name: 'users.delete', module: 'users', action: 'delete' },
  { name: 'roles.read', module: 'roles', action: 'read' },
  { name: 'roles.create', module: 'roles', action: 'create' },
  { name: 'roles.update', module: 'roles', action: 'update' },
  { name: 'roles.delete', module: 'roles', action: 'delete' },
  { name: 'uploads.read', module: 'uploads', action: 'read' },
  { name: 'uploads.delete', module: 'uploads', action: 'delete' },
  { name: 'admin.dashboard.read', module: 'admin', action: 'read' },
  { name: 'audit.read', module: 'audit', action: 'read' },
  { name: 'notifications.read', module: 'notifications', action: 'read' },
  { name: 'notifications.manage', module: 'notifications', action: 'manage' }
];

export const seedRolesAndPermissions = async () => {
  try {
    logger.info('🌱 Starting roles and permissions seeder...');
    
    // Seed Permissions
    const permissionIds: mongoose.Types.ObjectId[] = [];
    for (const p of defaultPermissions) {
      const perm = await Permission.findOneAndUpdate(
        { name: p.name },
        p,
        { upsert: true, new: true }
      );
      permissionIds.push(perm._id as mongoose.Types.ObjectId);
    }
    
    logger.info(`✅ Seeded ${permissionIds.length} permissions.`);

    // Seed Roles
    const superAdminRole = await Role.findOneAndUpdate(
      { name: 'SUPER_ADMIN' },
      { name: 'SUPER_ADMIN', permissions: permissionIds, description: 'Super Administrator', isSystem: true },
      { upsert: true, new: true }
    );
    
    await Role.findOneAndUpdate(
      { name: 'ADMIN' },
      { name: 'ADMIN', permissions: permissionIds.slice(0, 10), description: 'Administrator', isSystem: true },
      { upsert: true, new: true }
    );
    
    await Role.findOneAndUpdate(
      { name: 'MODERATOR' },
      { name: 'MODERATOR', permissions: [], description: 'Moderator', isSystem: true },
      { upsert: true, new: true }
    );
    
    await Role.findOneAndUpdate(
      { name: 'USER' },
      { name: 'USER', permissions: [], description: 'Standard User', isSystem: true },
      { upsert: true, new: true }
    );
    
    await Role.findOneAndUpdate(
      { name: 'GUEST' },
      { name: 'GUEST', permissions: [], description: 'Guest User', isSystem: true },
      { upsert: true, new: true }
    );
    
    logger.info('✅ Seeded default roles.');

    // Seed SUPER_ADMIN User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
        role: superAdminRole._id,
        status: 'active',
        isEmailVerified: true,
      });
      logger.info(`✅ Seeded super admin: ${adminEmail}`);
    }

    logger.info('🌱 Seeding completed successfully.');
  } catch (error) {
    logger.error(`❌ Seeder error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
