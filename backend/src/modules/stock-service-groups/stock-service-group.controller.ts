import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { StockServiceGroupService } from './stock-service-group.service';

export class StockServiceGroupController {
  static async list(req: Request, res: Response) {
    const result = await StockServiceGroupService.list(req.query);
    sendSuccess(res, result.data, translate('stockServiceGroups.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const group = await StockServiceGroupService.create(
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, group, translate('stockServiceGroups.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const group = await StockServiceGroupService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, group, translate('stockServiceGroups.updated', req.language));
  }
}
