import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { HttpError } from '../../common/errors/HttpError';
import { I18nService } from './i18n.service';
import { translate } from '../../config/i18n.config';

export class I18nController {
  static async listLanguages(req: Request, res: Response) {
    const languages = await I18nService.listLanguages();
    sendSuccess(res, languages, translate('common.operation_successful', req.language));
  }

  static async getLanguage(req: Request, res: Response) {
    const language = await I18nService.getLanguage(req.params.code as string);
    sendSuccess(res, language, translate('common.operation_successful', req.language));
  }

  static async downloadTemplate(req: Request, res: Response) {
    const template = await I18nService.getTemplate();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="language-template.en.json"');
    res.status(200).send(JSON.stringify(template, null, 2));
  }

  static async uploadLanguage(req: Request, res: Response) {
    if (!req.file) {
      throw HttpError.badRequest('i18n.file_required');
    }

    const language = await I18nService.upsertLanguage({
      code: String(req.body.code ?? ''),
      name: String(req.body.name ?? ''),
      direction: req.body.direction === 'rtl' ? 'rtl' : 'ltr',
      content: req.file.buffer,
    });

    sendSuccess(res, language, translate('i18n.uploaded', req.language), null, 201);
  }
}
