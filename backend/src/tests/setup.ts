import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { redis } from '../config/redis.config';
import { User } from '../modules/users/user.model';
import { Role, IRole } from '../modules/roles/role.model';
import { Permission } from '../modules/permissions/permission.model';

let mongoServer: MongoMemoryReplSet;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
    instanceOpts: [{
      ip: '127.0.0.1',
    } as any],
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  await redis.quit();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await redis.flushdb();
};

interface CreateTestUserOptions {
  email?: string;
  password?: string;
  name?: string;
  status?: 'active' | 'inactive' | 'banned' | 'pending_verification';
  isEmailVerified?: boolean;
}

export const createTestUser = async (
  roleName: IRole['name'] = 'USER',
  options: CreateTestUserOptions = {}
) => {
  const role = await Role.findOne({ name: roleName });
  if (!role) throw new Error(`Role ${roleName} not found`);

  const user = await User.create({
    email: options.email ?? 'test@example.com',
    password: options.password ?? 'Password123!',
    name: options.name ?? 'Test User',
    role: role._id,
    isEmailVerified: options.isEmailVerified ?? true,
    status: options.status ?? 'active'
  });

  return user;
};

export const initTestData = async () => {
  const permissions = await Permission.insertMany([
    { name: 'users.read', description: 'Read users', module: 'users', action: 'read' },
    { name: 'users.write', description: 'Write users', module: 'users', action: 'write' }
  ]);

  await Role.insertMany([
    { name: 'USER', permissions: [], isSystem: true },
    { name: 'ADMIN', permissions: permissions.map(p => p._id), isSystem: true },
    { name: 'SUPER_ADMIN', permissions: permissions.map(p => p._id), isSystem: true }
  ]);
};
