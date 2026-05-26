import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { StockCategoryService } from './stock-category.service';

export class StockCategoryController {
  static async list(req: Request, res: Response) {
    const result = await StockCategoryService.list(req.query);
    sendSuccess(res, result.data, translate('stockCategories.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('uploads.no_file');

    const category = await StockCategoryService.create(
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, category, translate('stockCategories.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const category = await StockCategoryService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, category, translate('stockCategories.updated', req.language));
  }

  static async reorder(req: Request, res: Response) {
    await StockCategoryService.reorder(req.body.orderedIds, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('stockCategories.reordered', req.language));
  }
}
