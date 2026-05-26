import mongoose from 'mongoose';
import { Role } from '../../modules/roles/role.model';
import { Permission } from '../../modules/permissions/permission.model';
import { User } from '../../modules/users/user.model';
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
  { name: 'stocks.services.read', module: 'stocks.services', action: 'read' },
  { name: 'stocks.services.create', module: 'stocks.services', action: 'create' },
  { name: 'stocks.services.update', module: 'stocks.services', action: 'update' },
  { name: 'stocks.services.delete', module: 'stocks.services', action: 'delete' },
  { name: 'stocks.categories.read', module: 'stocks.categories', action: 'read' },
  { name: 'stocks.categories.create', module: 'stocks.categories', action: 'create' },
  { name: 'stocks.categories.update', module: 'stocks.categories', action: 'update' },
  { name: 'stocks.categories.delete', module: 'stocks.categories', action: 'delete' },
  { name: 'stocks.products.read', module: 'stocks.products', action: 'read' },
  { name: 'stocks.products.create', module: 'stocks.products', action: 'create' },
  { name: 'stocks.products.update', module: 'stocks.products', action: 'update' },
  { name: 'stocks.products.delete', module: 'stocks.products', action: 'delete' },
  { name: 'stocks.productRequirements.read', module: 'stocks.productRequirements', action: 'read' },
  { name: 'stocks.productRequirements.create', module: 'stocks.productRequirements', action: 'create' },
  { name: 'stocks.productRequirements.update', module: 'stocks.productRequirements', action: 'update' },
  { name: 'stocks.productRequirements.delete', module: 'stocks.productRequirements', action: 'delete' },
  { name: 'stocks.productGroups.read', module: 'stocks.productGroups', action: 'read' },
  { name: 'stocks.productGroups.create', module: 'stocks.productGroups', action: 'create' },
  { name: 'stocks.productGroups.update', module: 'stocks.productGroups', action: 'update' },
  { name: 'stocks.productGroups.delete', module: 'stocks.productGroups', action: 'delete' },
  { name: 'settings.currencies.read', module: 'settings.currencies', action: 'read' },
  { name: 'settings.currencies.create', module: 'settings.currencies', action: 'create' },
  { name: 'settings.currencies.update', module: 'settings.currencies', action: 'update' },
  { name: 'settings.currencies.delete', module: 'settings.currencies', action: 'delete' },
  { name: 'settings.apis.read', module: 'settings.apis', action: 'read' },
  { name: 'settings.apis.create', module: 'settings.apis', action: 'create' },
  { name: 'settings.apis.update', module: 'settings.apis', action: 'update' },
  { name: 'settings.apis.delete', module: 'settings.apis', action: 'delete' },
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
        { upsert: true, returnDocument: 'after' }
      );
      permissionIds.push(perm._id as mongoose.Types.ObjectId);
    }
    
    logger.info(`✅ Seeded ${permissionIds.length} permissions.`);

    // Seed Roles
    const superAdminRole = await Role.findOneAndUpdate(
      { name: 'SUPER_ADMIN' },
      { name: 'SUPER_ADMIN', permissions: permissionIds, description: 'Super Administrator', isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
    
    await Role.findOneAndUpdate(
      { name: 'ADMIN' },
      { name: 'ADMIN', permissions: permissionIds, description: 'Administrator', isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
    
    await Role.findOneAndUpdate(
      { name: 'MODERATOR' },
      { name: 'MODERATOR', permissions: [], description: 'Moderator', isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
    
    await Role.findOneAndUpdate(
      { name: 'USER' },
      { name: 'USER', permissions: [], description: 'Standard User', isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
    
    await Role.findOneAndUpdate(
      { name: 'GUEST' },
      { name: 'GUEST', permissions: [], description: 'Guest User', isSystem: true },
      { upsert: true, returnDocument: 'after' }
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
