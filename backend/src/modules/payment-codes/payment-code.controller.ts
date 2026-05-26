import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { PaymentCodeService } from './payment-code.service';

export class PaymentCodeController {
  static async list(req: Request, res: Response) {
    const result = await PaymentCodeService.list(req.query);
    sendSuccess(res, result.data, translate('paymentCodes.retrieved', req.language), { ...result.meta });
  }

  static async listJournal(req: Request, res: Response) {
    const result = await PaymentCodeService.listJournal(req.query);
    sendSuccess(res, result.data, translate('paymentCodes.journal_retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const result = await PaymentCodeService.create(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('paymentCodes.created', req.language), null, 201);
  }

  static async generate(req: Request, res: Response) {
    const result = await PaymentCodeService.generate(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('paymentCodes.generated', req.language), null, 201);
  }

  static async import(req: Request, res: Response) {
    const result = await PaymentCodeService.import(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('paymentCodes.imported', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const result = await PaymentCodeService.update(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('paymentCodes.updated', req.language));
  }

  static async redeem(req: Request, res: Response) {
    const result = await PaymentCodeService.redeem(req.user!.id, req.body.code, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('paymentCodes.redeemed', req.language));
  }
}
