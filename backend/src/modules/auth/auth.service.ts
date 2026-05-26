import crypto from 'crypto';
import * as argon2 from 'argon2';
import { ClientSession } from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { clearUserProfileCache } from '../users/users.service';
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
import { translate } from '../../config/i18n.config';
import {
  buildOtpAuthUrl,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotpCode,
} from './totp.service';

const QRCode = require('qrcode') as { toDataURL: (text: string) => Promise<string> };

const sanitizeUser = (user: any) => {
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.twoFactorSecret;
  delete userObj.twoFactorPendingSecret;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;
  return userObj;
};

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

  private static async issueLoginTokens(user: any, deviceInfo: DeviceInfo): Promise<LoginResponse> {
    user.lastLoginAt = new Date();
    user.lastLoginIp = deviceInfo.ip;
    await user.save();

    const dbSession = await Session.create({
      userId: user._id,
      deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const permissions = (user.role as IRole).permissions.map((p: any) => p.toString());
    const roleName = (user.role as IRole).name;

    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: roleName, permissions },
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
      expiresAt: refreshExpiresAt,
    });

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
      title: translate('notifications.login_detected_title', 'en'),
      message: translate('notifications.login_detected_message', 'en'),
      data: {
        ip: deviceInfo.ip,
        titleKey: 'notifications.loginDetectedTitle',
        messageKey: 'notifications.loginDetectedMessage',
      },
    }).catch(e => console.error(e));

    return { user: sanitizeUser(user), accessToken, refreshToken: rawRefreshToken, refreshExpiresAt };
  }

  static async login(data: LoginDto, deviceInfo: DeviceInfo): Promise<LoginResponse | { requiresTwoFactor: true; twoFactorToken: string }> {
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
          title: translate('notifications.account_locked_title', 'en'),
          message: translate('notifications.account_locked_message', 'en'),
          data: {
            titleKey: 'notifications.accountLockedTitle',
            messageKey: 'notifications.accountLockedMessage',
          },
        }).catch(e => console.error(e));
      }
      throw HttpError.unauthorized('auth.invalid_credentials');
    }

    await user.resetFailedAttempts();

    if (user.twoFactorEnabled) {
      const twoFactorToken = jwt.sign(
        { userId: user._id.toString(), purpose: '2fa-login' },
        env.JWT_ACCESS_SECRET!,
        { expiresIn: '5m' }
      );
      return { requiresTwoFactor: true, twoFactorToken };
    }

    return this.issueLoginTokens(user, deviceInfo);
  }

  static async verifyTwoFactorLogin(twoFactorToken: string, code: string, deviceInfo: DeviceInfo): Promise<LoginResponse> {
    let payload: { userId: string; purpose: string };
    try {
      payload = jwt.verify(twoFactorToken, env.JWT_ACCESS_SECRET!) as { userId: string; purpose: string };
    } catch {
      throw HttpError.unauthorized('auth.two_factor_challenge_invalid');
    }

    if (payload.purpose !== '2fa-login') throw HttpError.unauthorized('auth.two_factor_challenge_invalid');

    const user = await User.findById(payload.userId).select('+twoFactorSecret').populate<{role: IRole}>('role');
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) throw HttpError.unauthorized('auth.two_factor_challenge_invalid');
    if (user.status === 'banned' || user.status === 'inactive') throw HttpError.forbidden(`auth.account_${user.status}`);

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!verifyTotpCode(secret, code)) {
      await AuditLog.create({
        actorId: user._id,
        action: 'TWO_FACTOR_LOGIN_FAILED',
        entity: 'Auth',
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
      });
      throw HttpError.unauthorized('auth.two_factor_invalid_code');
    }

    return this.issueLoginTokens(user, deviceInfo);
  }

  static async setupTwoFactor(userId: string, ip?: string, userAgent?: string) {
    const user = await User.findById(userId).select('+twoFactorPendingSecret +twoFactorSecret');
    if (!user) throw HttpError.notFound('users.user_not_found');
    if (user.twoFactorEnabled) throw HttpError.conflict('auth.two_factor_already_enabled');

    const secret = generateTotpSecret();
    const otpAuthUrl = buildOtpAuthUrl(secret, user.email);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    user.twoFactorPendingSecret = encryptTotpSecret(secret);
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      targetId: user._id,
      action: 'TWO_FACTOR_SETUP_STARTED',
      entity: 'User',
      ip,
      userAgent,
    });

    return { secret, otpAuthUrl, qrCodeDataUrl };
  }

  static async enableTwoFactor(userId: string, code: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).select('+twoFactorPendingSecret +twoFactorSecret').session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');
      if (!user.twoFactorPendingSecret) throw HttpError.badRequest('auth.two_factor_setup_required');

      const secret = decryptTotpSecret(user.twoFactorPendingSecret);
      if (!verifyTotpCode(secret, code)) throw HttpError.badRequest('auth.two_factor_invalid_code');

      user.twoFactorSecret = user.twoFactorPendingSecret;
      user.twoFactorPendingSecret = undefined;
      user.twoFactorEnabled = true;
      await user.save({ session });
      await clearUserProfileCache(userId);

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'TWO_FACTOR_ENABLED',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: user._id.toString(),
        type: 'two_factor_enabled',
        title: translate('notifications.two_factor_enabled_title', 'en'),
        message: translate('notifications.two_factor_enabled_message', 'en'),
        data: {
          titleKey: 'notifications.twoFactorEnabledTitle',
          messageKey: 'notifications.twoFactorEnabledMessage',
        },
      }).catch(() => undefined);

      return sanitizeUser(user);
    });
  }

  static async disableTwoFactor(userId: string, currentPassword: string, code: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const user = await User.findById(userId).select('+password +twoFactorSecret +twoFactorPendingSecret').session(session);
      if (!user) throw HttpError.notFound('users.user_not_found');
      if (!user.twoFactorEnabled || !user.twoFactorSecret) throw HttpError.badRequest('auth.two_factor_not_enabled');

      const validPassword = await argon2.verify(user.password!, currentPassword);
      if (!validPassword) throw HttpError.badRequest('auth.current_password_incorrect');

      const secret = decryptTotpSecret(user.twoFactorSecret);
      if (!verifyTotpCode(secret, code)) throw HttpError.badRequest('auth.two_factor_invalid_code');

      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorPendingSecret = undefined;
      await user.save({ session });
      await clearUserProfileCache(userId);

      await AuditLog.create([{
        actorId: user._id,
        targetId: user._id,
        action: 'TWO_FACTOR_DISABLED',
        entity: 'User',
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: user._id.toString(),
        type: 'two_factor_disabled',
        title: translate('notifications.two_factor_disabled_title', 'en'),
        message: translate('notifications.two_factor_disabled_message', 'en'),
        data: {
          titleKey: 'notifications.twoFactorDisabledTitle',
          messageKey: 'notifications.twoFactorDisabledMessage',
        },
      }).catch(() => undefined);

      return sanitizeUser(user);
    });
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
        title: translate('notifications.password_changed_title', 'en'),
        message: translate('notifications.password_changed_message', 'en'),
        data: {
          titleKey: 'notifications.passwordChangedTitle',
          messageKey: 'notifications.passwordChangedMessage',
        },
      }).catch(e => console.error(e));
    });
  }
}
