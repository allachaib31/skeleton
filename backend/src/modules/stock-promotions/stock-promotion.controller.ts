import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { StockPromotionService } from './stock-promotion.service';

export class StockPromotionController {
  static async list(req: Request, res: Response) {
    const result = await StockPromotionService.list(req.query);
    sendSuccess(res, result.data, translate('stockPromotions.retrieved', req.language), { ...result.meta });
  }

  static async listUsages(req: Request, res: Response) {
    const result = await StockPromotionService.listUsages(req.query);
    sendSuccess(res, result.data, translate('stockPromotions.usages_retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const promotion = await StockPromotionService.create(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, promotion, translate('stockPromotions.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const promotion = await StockPromotionService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, promotion, translate('stockPromotions.updated', req.language));
  }
}
