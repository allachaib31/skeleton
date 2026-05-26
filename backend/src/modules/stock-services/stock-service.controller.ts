import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { StockServiceService } from './stock-service.service';

export class StockServiceController {
  static async list(req: Request, res: Response) {
    const result = await StockServiceService.list(req.query);
    sendSuccess(res, result.data, translate('stockServices.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    if (!req.file) {
      throw HttpError.badRequest('uploads.no_file');
    }

    const service = await StockServiceService.create(
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, service, translate('stockServices.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const service = await StockServiceService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, service, translate('stockServices.updated', req.language));
  }

  static async reorder(req: Request, res: Response) {
    await StockServiceService.reorder(
      req.body.orderedIds,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, null, translate('stockServices.reordered', req.language));
  }
}
