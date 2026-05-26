import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '../../common/responses/api.response';
import jwt from 'jsonwebtoken';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';

export class UsersController {
  static async getProfile(req: Request, res: Response) {
    const user = await UsersService.getProfile(req.user!.id);
    sendSuccess(res, user, translate('users.profile_retrieved', req.language));
  }

  static async updateProfile(req: Request, res: Response) {
    const user = await UsersService.updateProfile(req.user!.id, req.body, req.ip, req.headers['user-agent']);
    sendSuccess(res, user, translate('users.profile_updated', req.language));
  }

  static async getLevels(req: Request, res: Response) {
    const levels = await UsersService.getLevels(req.user!.id);
    sendSuccess(res, levels, translate('users.levels_retrieved', req.language));
  }

  static async getFinancialMovements(req: Request, res: Response) {
    const result = await UsersService.getFinancialMovements(req.user!.id, req.query);
    sendSuccess(res, result.data, translate('users.movements_retrieved', req.language), result.meta);
  }

  static async deleteAccount(req: Request, res: Response) {
    const token = req.headers.authorization!.split(' ')[1];
    const decoded = jwt.decode(token) as { jti: string };
    
    await UsersService.deleteAccount(req.user!.id, req.body.password, decoded.jti, req.ip, req.headers['user-agent']);
    
    res.clearCookie('refreshToken');
    sendSuccess(res, null, translate('users.account_deleted', req.language));
  }

  static async updateAvatar(req: Request, res: Response) {
    if (!req.file) {
      throw HttpError.badRequest('users.no_file_uploaded');
    }
    const result = await UsersService.updateAvatar(req.user!.id, req.file, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('users.avatar_updated', req.language));
  }

  static async changePassword(req: Request, res: Response) {
    await UsersService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('users.password_changed', req.language));
  }

  static async getSessions(req: Request, res: Response) {
    const token = req.headers.authorization!.split(' ')[1];
    const decoded = jwt.decode(token) as { sessionId?: string };
    
    const sessions = await UsersService.getSessions(req.user!.id, decoded.sessionId);
    sendSuccess(res, sessions, translate('users.sessions_retrieved', req.language));
  }

  static async revokeSession(req: Request, res: Response) {
    await UsersService.revokeSession(req.user!.id, req.params.id as string, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('users.session_revoked', req.language));
  }
}
