import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { PaymentRequestService } from './payment-request.service';

const getProofFile = (req: Request) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.proofImage?.[0];
};

export class PaymentRequestController {
  static async listBanks(req: Request, res: Response) {
    const result = await PaymentRequestService.listBanks();
    sendSuccess(res, result, translate('paymentRequests.banks_retrieved', req.language));
  }

  static async create(req: Request, res: Response) {
    const result = await PaymentRequestService.create(
      req.user!.id,
      req.body,
      getProofFile(req),
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('paymentRequests.created', req.language), null, 201);
  }

  static async listMine(req: Request, res: Response) {
    const result = await PaymentRequestService.listForClient(req.user!.id, req.query);
    sendSuccess(res, result.data, translate('paymentRequests.retrieved', req.language), result.meta as unknown as Record<string, unknown>);
  }

  static async listAdmin(req: Request, res: Response) {
    const result = await PaymentRequestService.listForAdmin(req.query);
    sendSuccess(res, result.data, translate('paymentRequests.retrieved', req.language), result.meta as unknown as Record<string, unknown>);
  }

  static async getAdmin(req: Request, res: Response) {
    const result = await PaymentRequestService.getForAdmin(req.params.id as string);
    sendSuccess(res, result, translate('paymentRequests.retrieved', req.language));
  }

  static async approve(req: Request, res: Response) {
    const result = await PaymentRequestService.approve(
      req.params.id as string,
      req.user!.id,
      req.body.adminComment,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('paymentRequests.approved', req.language));
  }

  static async reject(req: Request, res: Response) {
    const result = await PaymentRequestService.reject(
      req.params.id as string,
      req.user!.id,
      req.body.adminComment,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('paymentRequests.rejected', req.language));
  }
}
