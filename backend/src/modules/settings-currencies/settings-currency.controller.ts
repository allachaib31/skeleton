import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { SettingsCurrencyService } from './settings-currency.service';

export class SettingsCurrencyController {
  static async list(req: Request, res: Response) {
    const result = await SettingsCurrencyService.list(req.query);
    sendSuccess(res, result.data, translate('settingsCurrencies.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('uploads.no_file');
    const currency = await SettingsCurrencyService.create(req.body, req.user!.id, req.file, req.ip, req.headers['user-agent']);
    sendSuccess(res, currency, translate('settingsCurrencies.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const currency = await SettingsCurrencyService.update(req.params.id as string, req.body, req.user!.id, req.file, req.ip, req.headers['user-agent']);
    sendSuccess(res, currency, translate('settingsCurrencies.updated', req.language));
  }
}
