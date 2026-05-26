import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { StockProductGroupService } from './stock-product-group.service';

const getUploadedField = (req: Request, fieldName: string) => {
  if (!req.files || Array.isArray(req.files)) return undefined;
  return req.files[fieldName]?.[0];
};

export class StockProductGroupController {
  static async list(req: Request, res: Response) {
    const result = await StockProductGroupService.list(req.query);
    sendSuccess(res, result.data, translate('stockProductGroups.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const image = getUploadedField(req, 'image');
    const coverImage = getUploadedField(req, 'coverImage');
    if (!image || !coverImage) throw HttpError.badRequest('uploads.no_file');

    const group = await StockProductGroupService.create(
      req.body,
      req.user!.id,
      image,
      coverImage,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, group, translate('stockProductGroups.created', req.language), null, 201);
  }
}
