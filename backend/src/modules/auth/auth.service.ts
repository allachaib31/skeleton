import crypto from 'crypto';
import * as argon2 from 'argon2';
import { ClientSession } from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { Session } from './session.model';
import { RefreshToken } from './refresh-token.model';
import { AuditLog } from '../audit/audit-log.model';
import { Role, IRole } from '../roles/role.model';
import { HttpError } from '../../common/errors/HttpError';
import { emailQueue } from '../../queues/email.queue';
import * as TokenService from './token.service';
import { redisSet, redisGet } from '../../config/redis.config';
import { withTransaction } from '../../database/transaction';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto, LoginDto, DeviceInfo, LoginResponse, AuthTokens } from './auth.types';
import { env } from '../../config/env.config';

export class AuthService {
  static async register(data: RegisterDto, ip?: string, userAgent?: string, lang?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const existingUser = await User.findOne({ email: data.email }).session(session);
      if (existingUser) {
        throw HttpError.conflict('auth.email_taken');
      }

      const defaultRole = await Role.findOne({ name: 'USER' }).session(session);
      if (!defaultRole) {
        throw HttpError.internal('auth.default_role_missing');
      }

      // Pre-save hook hashes password via argon2
      const user = new User({
        email: data.email,
        password: data.password,
        name: data.name,
        role: defaultRole._id,
        status: 'pending_verification'
      });

      // Verification token
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = TokenService.hashToken(rawToken);
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await user.save({ session });

      // Audit Log
      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'REGISTER',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      // Queue Email
      await emailQueue.add('send-verification-email', {
        email: user.email,
        token: rawToken,
        name: user.name,
        lang
      });

      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    });
  }

  static async login(data: LoginDto, deviceInfo: DeviceInfo): Promise<LoginResponse> {
    const user = await User.findOne({ email: data.email }).select('+password').populate<{role: IRole}>('role');
    
    if (!user) {
      throw HttpError.unauthorized('auth.invalid_credentials');
    }

    if (user.status === 'banned' || user.status === 'inactive') {
      throw HttpError.forbidden(`auth.account_${user.status}`);
    }

    if (user.isLocked()) {
      throw HttpError.unauthorized('auth.account_locked_try_later');
    }

    const isValid = await argon2.verify(user.password!, data.password ?? '');
    
    if (!isValid) {
      await user.incrementFailedAttempts();
      if (user.isLocked()) {
        await NotificationsService.createNotification({
          userId: user._id.toString(),
          type: 'account_locked',
          title: 'Account Locked',
          message: 'Your account has been locked due to multiple failed login attempts.'
        }).catch(e => console.error(e));
      }
      throw HttpError.unauthorized('auth.invalid_credentials');
    }

    await user.resetFailedAttempts();
    user.lastLoginAt = new Date();
    user.lastLoginIp = deviceInfo.ip;
    await user.save();

    // Create session
    const dbSession = await Session.create({
      userId: user._id,
      deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const permissions = (user.role as IRole).permissions.map(p => p.toString());
    const roleName = (user.role as IRole).name;

    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: roleName, permissions: permissions },
      env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m', jwtid: dbSession._id.toString() }
    );

    const rawRefreshToken = TokenService.generateRefreshToken();
    const rtHash = TokenService.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: rtHash,
      sessionId: dbSession._id,
      expiresAt: refreshExpiresAt
    });

    // Cache permissions natively
    await redisSet(`permissions:${user._id}`, permissions, 30 * 24 * 60 * 60);

    await AuditLog.create({
      actorId: user._id,
      action: 'LOGIN',
      entity: 'Auth',
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    await NotificationsService.createNotification({
      userId: user._id.toString(),
      type: 'login',
      title: 'New Login Detected',
      message: 'A new login was detected on your account.',
      data: { ip: deviceInfo.ip }
    }).catch(e => console.error(e));

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, accessToken, refreshToken: rawRefreshToken, refreshExpiresAt };
  }

  static async logout(user: { id: string }, jti: string, refreshTokenStr?: string, deviceInfo?: DeviceInfo) {
    return await withTransaction(async (session: ClientSession) => {
      // Access token TTL fallback - realistically should pull exp from JWT
      await TokenService.blacklistToken(jti, 15 * 60);

      if (refreshTokenStr) {
        const hash = TokenService.hashToken(refreshTokenStr);
        const rt = await RefreshToken.findOne({ tokenHash: hash }).session(session);
        if (rt) {
          rt.isRevoked = true;
          await rt.save({ session });
          
          if (rt.sessionId) {
            await Session.findByIdAndUpdate(rt.sessionId, { isActive: false }, { session });
          }
        }
      }

      await AuditLog.create([{
        actorId: user.id,
        action: 'LOGOUT',
        entity: 'Auth',
        ip: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
      }], { session });
    });
  }

  static async refreshToken(refreshTokenStr: string): Promise<AuthTokens> {
    const hash = TokenService.hashToken(refreshTokenStr);
    
    const rt = await RefreshToken.findOne({ tokenHash: hash, isRevoked: false, expiresAt: { $gt: new Date() } });
    if (!rt) {
      throw HttpError.unauthorized('auth.invalid_or_expired_refresh_token');
    }

    const session = await Session.findOne({ _id: rt.sessionId, isActive: true });
    if (!session || session.expiresAt < new Date()) {
      throw HttpError.unauthorized('auth.session_invalid_or_expired');
    }

    const user = await User.findById(rt.userId).populate<{role: IRole}>('role');
    if (!user || user.status === 'banned') {
      throw HttpError.forbidden('auth.user_unavailable');
    }

    // Revoke old
    rt.isRevoked = true;
    await rt.save();

    // Issue new
    const permissions = (user.role as IRole).permissions.map(p => p.toString());
    const roleName = (user.role as IRole).name;

    const accessToken = TokenService.generateAccessToken({
      userId: user._id,
      role: roleName,
      permissions,
      sessionId: session._id
    });

    const newRawRt = TokenService.generateRefreshToken();
    const newRtHash = TokenService.hashToken(newRawRt);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRtHash,
      sessionId: session._id,
      expiresAt: refreshExpiresAt
    });

    return { accessToken, refreshToken: newRawRt, refreshExpiresAt };
  }

  static async verifyEmail(token: string) {
    const hash = TokenService.hashToken(token);
    
    const user = await User.findOne({
      emailVerificationToken: hash,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw HttpError.badRequest('auth.token_invalid_or_expired');
    }

    user.isEmailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    return true;
  }

  static async forgotPassword(email: string, lang?: string) {
    const key = `rate-limit:forgot-pwd:${email}`;
    const limit = await redisGet(key);
    if (limit) throw HttpError.conflict('auth.forgot_password_rate_limited');

    const user = await User.findOne({ email });
    if (!user) return true; // Pretend it succeeded

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = TokenService.hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    await redisSet(key, 'true', 300); // 5 mins cooldown

    await emailQueue.add('send-password-reset', {
      email: user.email,
      token: rawToken,
      name: user.name,
      lang
    });

    return true;
  }

  static async resetPassword(token: string, newPassword: string, deviceInfo?: DeviceInfo) {
    return await withTransaction(async (session: ClientSession) => {
      const hash = TokenService.hashToken(token);
      
      const user = await User.findOne({
        passwordResetToken: hash,
        passwordResetExpires: { $gt: new Date() }
      }).session(session);

      if (!user) throw HttpError.badRequest('auth.token_invalid_or_expired');

      user.password = newPassword; 
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ session });

      // Revoke all sessions and RTs
      await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true }, { session });
      await Session.updateMany({ userId: user._id }, { isActive: false }, { session });

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'PASSWORD_RESET',
        entity: 'Auth',
        ip: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
      }], { session });
    });
  }

  static async changePassword(userId: string, current: string, updated: string, deviceInfo?: DeviceInfo) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).select('+password').session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');

      const isValid = await argon2.verify(user.password!, current);
      if (!isValid) throw HttpError.badRequest('auth.current_password_incorrect');

      user.password = updated;
      await user.save({ session });

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'PASSWORD_CHANGED',
        entity: 'Auth',
        ip: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: user._id.toString(),
        type: 'password_changed',
        title: 'Password Changed',
        message: 'Your password was successfully changed.'
      }).catch(e => console.error(e));
    });
  }
}
