import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { SettingsAppService } from './settings-app.service';

export class SettingsAppController {
  static async get(req: Request, res: Response) {
    const settings = await SettingsAppService.get();
    sendSuccess(res, settings, translate('settingsApp.retrieved', req.language));
  }

  static async update(req: Request, res: Response) {
    const settings = await SettingsAppService.update(
      req.body,
      req.user!.id,
      (req.files || {}) as { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, settings, translate('settingsApp.updated', req.language));
  }
}
