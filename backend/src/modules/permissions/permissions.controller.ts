import { Request, Response } from 'express';
import { PermissionsService } from './permissions.service';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';

export class PermissionsController {
  static async getPermissions(req: Request, res: Response) {
    const grouped = await PermissionsService.getPermissions();
    sendSuccess(res, grouped, translate('permissions.retrieved', req.language));
  }
}
