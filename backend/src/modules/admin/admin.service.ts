import mongoose, { ClientSession } from 'mongoose';
import os from 'os';
import { User } from '../users/user.model';
import { Role } from '../roles/role.model';
import { Session } from '../auth/session.model';
import { RefreshToken } from '../auth/refresh-token.model';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { HttpError } from '../../common/errors/HttpError';
import { redisGet, redisSet, redis } from '../../config/redis.config';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { emailQueue } from '../../queues/email.queue';
import { withTransaction } from '../../database/transaction';
import { NotificationsService } from '../notifications/notifications.service';
import { logger } from '../../common/utils/logger';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class AdminService {
  // --- DASHBOARD ---
  static async getDashboard() {
    const cacheKey = 'settings:dashboard';
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      usersByStatus,
      totalUploads,
      storageUsedResult,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Upload.countDocuments(),
      Upload.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(5).populate('actorId', 'name email')
    ]);

    const storageUsed = storageUsedResult[0]?.totalSize || 0;
    
    const dashboard = {
      users: {
        total: totalUsers,
        new: { today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
        byStatus: usersByStatus.reduce((acc: Record<string, number>, curr: { _id: string, count: number }) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
      storage: {
        totalUploads,
        storageUsedBytes: storageUsed,
      },
      recentAuditLogs: recentLogs,
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }
    };

    await redisSet(cacheKey, dashboard, 60); // 60s cache
    return dashboard;
  }

  // --- USERS ---
  static async getUsers(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status as string;
    if (query.role) filter.role = query.role as string;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search as string, $options: 'i' } },
        { email: { $regex: query.search as string, $options: 'i' } }
      ];
    }

    const sortConfig: Record<string, 1 | -1> = {};
    if (typeof query.sort === 'string') {
      const isDesc = query.sort.startsWith('-');
      const field = isDesc ? query.sort.substring(1) : query.sort;
      sortConfig[field] = isDesc ? -1 : 1;
    } else {
      sortConfig.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .select('-password')
        .populate('role', 'name'),
      User.countDocuments(filter)
    ]);

    return { data, ...buildPaginationMeta(total, page, limit) };
  }

  static async getUser(userId: string) {
    const user = await User.findById(userId).select('-password').populate({
      path: 'role',
      populate: { path: 'permissions' }
    });
    if (!user) throw HttpError.notFound('admin.user_not_found');

    const [sessions, uploadCount] = await Promise.all([
      Session.find({ userId }).sort({ createdAt: -1 }).limit(5),
      Upload.countDocuments({ ownerId: userId })
    ]);

    return { ...user.toObject(), sessions, uploadCount };
  }

  static async updateUserStatus(userId: string, status: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).session(session);
      if (!user) throw HttpError.notFound('admin.user_not_found');

      const validStatuses = ['active', 'inactive', 'banned', 'pending_verification'];
      if (!validStatuses.includes(status)) throw HttpError.badRequest('admin.invalid_status');

      const before = user.status;
      user.status = status as any;
      await user.save({ session });

      if (status === 'banned') {
        await Session.updateMany({ userId }, { isActive: false }, { session });
        await RefreshToken.updateMany({ userId }, { isRevoked: true }, { session });
        
        await NotificationsService.createNotification({
          userId: user._id.toString(),
          type: 'account_banned',
          title: 'Account Banned',
          message: 'Your account has been banned by an administrator.'
        }).catch(e => logger.error('Banned notification error', e));
      }

      await redisSet(`permissions:${user._id}`, null, 1); 

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: user._id.toString(),
        action: status === 'banned' ? 'USER_BANNED' : (status === 'active' ? 'USER_UNBANNED' : 'USER_STATUS_CHANGED'),
        entity: 'User',
        before: { status: before },
        after: { status: user.status },
        ip,
        userAgent
      }], { session });

      return user.toObject();
    });
  }

  static async updateUserRole(userId: string, roleId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).session(session);
      if (!user) throw HttpError.notFound('admin.user_not_found');

      const newRole = await Role.findById(roleId).session(session);
      if (!newRole) throw HttpError.notFound('admin.role_not_found');

      if (newRole.name === 'SUPER_ADMIN') {
        throw HttpError.forbidden('admin.cannot_assign_super_admin');
      }

      const before = user.role;
      user.role = newRole._id as any;
      await user.save({ session });

      await redisSet(`permissions:${user._id}`, null, 1); 

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: user._id,
        action: 'ROLE_CHANGED',
        entity: 'User',
        before: { role: before },
        after: { role: user.role },
        ip,
        userAgent
      }], { session });

      await NotificationsService.createNotification({
          userId: user._id.toString(),
        type: 'role_changed',
        title: 'Role Updated',
        message: `Your role has been updated to an administrative or custom role.`
      }).catch(e => logger.error('Role update notification error', e));

      return user.toObject();
    });
  }

  static async deleteUser(userId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      if (userId === actorId) {
        throw HttpError.badRequest('admin.cannot_delete_self');
      }

      const user = await User.findById(userId).populate<{role: any}>('role').session(session);
      if (!user) throw HttpError.notFound('admin.user_not_found');

      if (user.role && user.role.name === 'SUPER_ADMIN') {
        throw HttpError.forbidden('admin.cannot_delete_super_admin');
      }

      user.status = 'inactive';
      await user.save({ session });

      await Session.updateMany({ userId }, { isActive: false }, { session });
      await RefreshToken.updateMany({ userId }, { isRevoked: true }, { session });

      if (user.avatar) {
        await cleanupQueue.add('delete-cloudinary-file', { url: user.avatar });
      }

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: user._id,
        action: 'ADMIN_USER_DELETED',
        entity: 'User',
        ip,
        userAgent
      }], { session });
    });
  }

  // --- AUDIT LOGS ---
  static async getAuditLogs(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    
    if (query.actorId) filter.actorId = query.actorId;
    if (typeof query.action === 'string' && query.action.trim()) {
      filter.action = { $regex: escapeRegex(query.action.trim()), $options: 'i' };
    }
    if (typeof query.entity === 'string' && query.entity.trim()) {
      filter.entity = { $regex: escapeRegex(query.entity.trim()), $options: 'i' };
    }
    if (query.search && typeof query.search === 'string') {
      const search = query.search.trim();
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i');
        const searchFilters: Record<string, unknown>[] = [
          { action: searchRegex },
          { entity: searchRegex },
          { ip: searchRegex },
          { userAgent: searchRegex },
          { 'after.providerAction': searchRegex },
          { 'after.apiGroup': searchRegex },
          { 'after.request.curl': searchRegex },
          { 'after.request.url': searchRegex },
          { 'after.request.body': searchRegex },
          { 'after.response.raw': searchRegex },
          { 'after.response.errorInfo.key': searchRegex },
          { 'after.error.message': searchRegex },
        ];
        if (mongoose.Types.ObjectId.isValid(search)) {
          searchFilters.push({ targetId: new mongoose.Types.ObjectId(search) });
          searchFilters.push({ actorId: new mongoose.Types.ObjectId(search) });
        }
        filter.$or = searchFilters;
      }
    }
    
    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (query.dateFrom) createdAt.$gte = new Date(query.dateFrom as string);
      if (query.dateTo) createdAt.$lte = new Date(query.dateTo as string);
      filter.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email'),
      AuditLog.countDocuments(filter),
    ]);

    return { data, ...buildPaginationMeta(total, page, limit) };
  }

  // --- SESSIONS ---
  static async getSessions(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);

    const filter: Record<string, unknown> = { isActive: true };
    if (query.userId) filter.userId = query.userId as string;

    const [data, total] = await Promise.all([
      Session.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      Session.countDocuments(filter)
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteSession(sessionId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const s = await Session.findById(sessionId).session(session);
      if (!s) throw HttpError.notFound('admin.session_not_found');

      s.isActive = false;
      await s.save({ session });

      await RefreshToken.updateMany({ sessionId }, { isRevoked: true }, { session });

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: s.userId,
        action: 'SESSION_REVOKED_BY_ADMIN',
        entity: 'Session',
        ip,
        userAgent
      }], { session });
    });
  }

  // --- UPLOADS ---
  static async getUploads(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);

    const filter: Record<string, unknown> = {};
    if (query.ownerId) filter.ownerId = query.ownerId as string;
    if (query.format) filter.format = query.format as string;
    
    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (query.dateFrom) createdAt.$gte = new Date(query.dateFrom as string);
      if (query.dateTo) createdAt.$lte = new Date(query.dateTo as string);
      filter.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      Upload.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name email'),
      Upload.countDocuments(filter)
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteUpload(uploadId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const upload = await Upload.findById(uploadId).session(session);
      if (!upload) throw HttpError.notFound('admin.upload_not_found');

      await cleanupQueue.add('delete-cloudinary-file', { publicId: upload.publicId });
      
      await upload.deleteOne({ session });

      await AuditLog.create([{
        actorId: actorId as any,
        targetId: upload._id,
        action: 'UPLOAD_DELETED_BY_ADMIN',
        entity: 'Upload',
        ip,
        userAgent
      }], { session });
    });
  }

  // --- SYSTEM ---
  static async getSystemHealth() {
    let redisStatus = 'ok';
    try {
      await redis.ping();
    } catch {
      redisStatus = 'down';
    }

    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'ok' : 'down';

    return {
      status: (redisStatus === 'ok' && dbStatus === 'ok') ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      loadavg: os.loadavg()
    };
  }

  static async getSystemMetrics() {
    const [emailCounts, cleanupCounts] = await Promise.all([
      emailQueue.getJobCounts('waiting', 'active', 'failed', 'completed'),
      cleanupQueue.getJobCounts('waiting', 'active', 'failed', 'completed')
    ]);

    const redisInfo = await redis.info('memory');
    let mongoStats = null;
    if (mongoose.connection.db) {
      mongoStats = await mongoose.connection.db.stats();
    }

    return {
      queues: {
        email: emailCounts,
        cleanup: cleanupCounts
      },
      redis: redisInfo,
      mongoDB: mongoStats
    };
  }
}
