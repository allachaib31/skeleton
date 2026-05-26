import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { StockProductRequirementService } from './stock-product-requirement.service';

export class StockProductRequirementController {
  static async list(req: Request, res: Response) {
    const result = await StockProductRequirementService.list(req.query);
    sendSuccess(res, result.data, translate('stockProductRequirements.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const requirement = await StockProductRequirementService.create(
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, requirement, translate('stockProductRequirements.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const requirement = await StockProductRequirementService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, requirement, translate('stockProductRequirements.updated', req.language));
  }
}
