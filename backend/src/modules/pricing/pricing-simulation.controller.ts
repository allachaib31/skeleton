import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { PricingService } from './pricing.service';

export class PricingSimulationController {
  static async calculate(req: Request, res: Response) {
    const result = await PricingService.calculateForClient(req.body);
    sendSuccess(res, result, translate('pricingSimulation.calculated', req.language));
  }
}
