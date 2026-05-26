import * as argon2 from 'argon2';
import { ClientSession } from 'mongoose';
import { User } from './user.model';
import { Session } from '../auth/session.model';
import { RefreshToken } from '../auth/refresh-token.model';
import { AuditLog } from '../audit/audit-log.model';
import { ClientFinancialMovement } from '../admin-clients/client-financial-movement.model';
import { Upload } from '../uploads/upload.model';
import { Role } from '../roles/role.model';
import { StockService } from '../stock-services/stock-service.model';
import { StockServiceGroup } from '../stock-service-groups/stock-service-group.model';
import { UserLevelGroupe } from '../admin-clients/user-level-groupe.model';
import { HttpError } from '../../common/errors/HttpError';
import { redisGet, redisSet, redisDel } from '../../config/redis.config';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import * as TokenService from '../auth/token.service';
import streamifier from 'streamifier';

export const getUserProfileCacheKey = (userId: string) => `user:${userId}:profile:v2`;
export const getLegacyUserProfileCacheKey = (userId: string) => `user:${userId}`;

export const clearUserProfileCache = async (userId: string) => {
  await Promise.all([
    redisDel(getUserProfileCacheKey(userId)),
    redisDel(getLegacyUserProfileCacheKey(userId)),
  ]);
};

export class UsersService {
  static async getProfile(userId: string) {
    const cacheKey = getUserProfileCacheKey(userId);
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const user = await User.findById(userId)
      .populate('role')
      .select('-password -__v -emailVerificationToken -passwordResetToken -failedLoginAttempts -lockUntil');

    if (!user) throw HttpError.notFound('users.user_not_found');

    const userObj = user.toObject();
    await redisSet(cacheKey, userObj, 300); // 5 minutes cache

    return userObj;
  }

  static async updateProfile(userId: string, data: any, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).select('-password').session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');

      if (data.username) {
        const existing = await User.findOne({ username: data.username, _id: { $ne: userId } }).session(session).lean();
        if (existing) throw HttpError.conflict('users.username_taken');
        user.username = data.username;
      }

      if (data.name !== undefined) user.name = data.name;
      if (data.firstName !== undefined) user.firstName = data.firstName;
      if (data.lastName !== undefined) user.lastName = data.lastName;
      if (data.phoneNumber !== undefined || data.phone !== undefined) {
        user.phoneNumber = data.phoneNumber ?? data.phone;
      }
      if (data.countryCode !== undefined) user.countryCode = data.countryCode;
      if (data.countryIso !== undefined) user.countryIso = data.countryIso;
      if (data.countryFlag !== undefined) user.countryFlag = data.countryFlag;

      await user.save({ session });

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'PROFILE_UPDATED',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      await clearUserProfileCache(userId);

      const populated = await User.findById(userId)
        .populate('role')
        .select('-password -__v -emailVerificationToken -passwordResetToken -failedLoginAttempts -lockUntil')
        .session(session)
        .lean();

      return populated;
    });
  }

  static async getLevels(userId: string) {
    const [services, levels] = await Promise.all([
      StockService.find({ isDeleted: { $ne: true }, isVisible: { $ne: false } }).select('_id').lean(),
      UserLevelGroupe.find({ clientId: userId })
        .populate('serviceId', 'name type image isVisible')
        .populate('groupId', 'name entitlementValue pricingType value negativeValue percentAgent isDefault isDeleted')
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const activeServiceIds = services.map((service) => service._id);
    const groups = await StockServiceGroup.find({ serviceId: { $in: activeServiceIds }, isDeleted: { $ne: true } })
      .select('name serviceId entitlementValue pricingType value negativeValue percentAgent isDefault')
      .sort({ serviceId: 1, entitlementValue: 1, createdAt: 1 })
      .lean();

    const groupsByService = new Map<string, typeof groups>();
    for (const group of groups) {
      const serviceId = group.serviceId.toString();
      groupsByService.set(serviceId, [...(groupsByService.get(serviceId) || []), group]);
    }

    const levelsWithGroups = levels.map((level) => {
      const service = level.serviceId as any;
      const serviceId = service?._id || service;
      return {
        ...level,
        availableGroups: serviceId ? groupsByService.get(serviceId.toString()) || [] : [],
      };
    }).filter((level) => Boolean(level.serviceId));

    return {
      levels: levelsWithGroups,
      groups,
      missingLevelCount: 0,
      invalidLevelCount: 0,
      skippedNoGroupCount: 0,
      canGenerateLevels: false,
    };
  }

  static async getFinancialMovements(userId: string, query: Record<string, unknown>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { clientId: userId };
    if (query.type) filter.type = query.type;
    if (query.excludeSource) filter.source = { $ne: query.excludeSource };

    const [data, total] = await Promise.all([
      ClientFinancialMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('paymentMethodId', 'name kind image')
        .lean(),
      ClientFinancialMovement.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  static async deleteAccount(userId: string, passwordConfirm: string, jti: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).select('+password').session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');

      const isValid = await argon2.verify(user.password!, passwordConfirm);
      if (!isValid) throw HttpError.badRequest('users.incorrect_password');

      user.status = 'inactive';
      await user.save({ session });

      // Revoke sessions and tokens
      await Session.updateMany({ userId }, { isActive: false }, { session });
      await RefreshToken.updateMany({ userId }, { isRevoked: true }, { session });
      await TokenService.blacklistToken(jti, 15 * 60);

      // Audit Log
      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'USER_DELETED',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      await clearUserProfileCache(userId);
    });
  }

  static async updateAvatar(userId: string, file: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');

      // Upload to cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const cldStream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(cldStream);
      });

      // Save upload doc
      const uploadDoc = new Upload({
        ownerId: user._id,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        size: uploadResult.bytes,
        provider: 'cloudinary',
        resourceType: uploadResult.resource_type,
      });
      await uploadDoc.save({ session });

      const oldAvatarUrl = user.avatar;

      user.avatar = uploadResult.secure_url;
      await user.save({ session });

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'AVATAR_UPDATED',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary')) {
        await cleanupQueue.add('delete-cloudinary-file', {
          url: oldAvatarUrl
        });
      }

      await clearUserProfileCache(userId);

      return { avatarUrl: user.avatar };
    });
  }

  static async changePassword(userId: string, current: string, newPass: string, ip?: string, userAgent?: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw HttpError.notFound('users.user_not_found');

    const isValid = await argon2.verify(user.password!, current);
    if (!isValid) throw HttpError.badRequest('auth.current_password_incorrect');

    user.password = newPass;
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      targetId: user._id,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      ip,
      userAgent,
    });
  }

  static async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await Session.find({ userId, isActive: true }).sort({ createdAt: -1 });
    
    return sessions.map(s => {
      const isCurrent = currentSessionId ? s._id.toString() === currentSessionId : false;
      return {
        _id: s._id,
        id: s._id,
        deviceInfo: s.deviceInfo,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent
      };
    });
  }

  static async revokeSession(userId: string, sessionId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const s = await Session.findOne({ _id: sessionId, userId, isActive: true }).session(session);
      if (!s) throw HttpError.notFound('users.session_not_found');

      s.isActive = false;
      await s.save({ session });

      await RefreshToken.updateMany({ sessionId }, { isRevoked: true }, { session });

      await AuditLog.create([{
        actorId: userId as any,
        targetId: userId as any,
        action: 'SESSION_REVOKED',
        entity: 'Auth',
        ip,
        userAgent,
      }], { session });
    });
  }
}
