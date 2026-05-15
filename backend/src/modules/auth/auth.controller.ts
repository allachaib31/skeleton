import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config';
import { HttpError } from '../../common/errors/HttpError';

const firstHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const refreshCookieBaseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: `${env.API_PREFIX}/auth`,
};

export class AuthController {
  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body, req.ip, firstHeader(req.headers['user-agent']), req.language);
    sendSuccess(res, user, translate('auth.register_success', req.language), null, 201);
  }

  static async login(req: Request, res: Response) {
    const deviceInfo = {
      ip: req.ip,
      userAgent: firstHeader(req.headers['user-agent'])
    };

    const { user, accessToken, refreshToken, refreshExpiresAt } = await AuthService.login(req.body, deviceInfo);

    res.cookie('refreshToken', refreshToken, {
      ...refreshCookieBaseOptions,
      expires: refreshExpiresAt
    });

    sendSuccess(res, { user, accessToken }, translate('auth.login_success', req.language));
  }

  static async logout(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader!.split(' ')[1];
    const decoded = jwt.decode(accessToken) as { jti: string };
    
    const refreshToken = req.cookies.refreshToken;
    const deviceInfo = {
      ip: req.ip,
      userAgent: firstHeader(req.headers['user-agent'])
    };

    await AuthService.logout(req.user!, decoded.jti, refreshToken, deviceInfo);

    res.clearCookie('refreshToken', refreshCookieBaseOptions);
    sendSuccess(res, null, translate('auth.logout_success', req.language));
  }

  static async refreshToken(req: Request, res: Response) {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw HttpError.unauthorized('auth.refresh_token_missing');
    }

    const { accessToken, refreshToken, refreshExpiresAt } = await AuthService.refreshToken(token);

    res.cookie('refreshToken', refreshToken, {
      ...refreshCookieBaseOptions,
      expires: refreshExpiresAt
    });

    sendSuccess(res, { accessToken }, translate('auth.token_refreshed', req.language));
  }

  static async verifyEmail(req: Request, res: Response) {
    await AuthService.verifyEmail(req.body.token);
    sendSuccess(res, null, translate('auth.email_verified', req.language));
  }

  static async resendVerification(req: Request, res: Response) {
    // Optional placeholder endpoint for resend verification
    sendSuccess(res, null, translate('auth.verification_email_queued', req.language));
  }

  static async forgotPassword(req: Request, res: Response) {
    await AuthService.forgotPassword(req.body.email, req.language);
    sendSuccess(res, null, translate('auth.password_reset_email_sent', req.language));
  }

  static async resetPassword(req: Request, res: Response) {
    const deviceInfo = { ip: req.ip, userAgent: firstHeader(req.headers['user-agent']) };
    await AuthService.resetPassword(req.body.token, req.body.password, deviceInfo);
    sendSuccess(res, null, translate('auth.password_reset_success', req.language));
  }

  static async changePassword(req: Request, res: Response) {
    const deviceInfo = { ip: req.ip, userAgent: firstHeader(req.headers['user-agent']) };
    await AuthService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword, deviceInfo);
    sendSuccess(res, null, translate('auth.password_changed_success', req.language));
  }
}
