import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { SettingsPaymentGatewayService } from './settings-payment-gateway.service';

const getUploadedFiles = (req: Request, fieldName: string): Express.Multer.File[] => {
  if (!req.files || Array.isArray(req.files)) return [];
  return (req.files[fieldName] || []) as Express.Multer.File[];
};

export class SettingsPaymentGatewayController {
  static async list(req: Request, res: Response) {
    const result = await SettingsPaymentGatewayService.list(req.query);
    sendSuccess(res, result.data, translate('settingsPaymentGateways.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const imageFile = getUploadedFiles(req, 'image')[0];
    if (!imageFile) throw HttpError.badRequest('uploads.no_file');
    const item = await SettingsPaymentGatewayService.create(
      req.body,
      req.user!.id,
      imageFile,
      getUploadedFiles(req, 'infoFiles'),
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, item, translate('settingsPaymentGateways.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const item = await SettingsPaymentGatewayService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      getUploadedFiles(req, 'image')[0],
      getUploadedFiles(req, 'infoFiles'),
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, item, translate('settingsPaymentGateways.updated', req.language));
  }
}
