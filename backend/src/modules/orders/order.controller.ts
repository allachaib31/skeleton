import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { OrderService } from './order.service';

export class OrderController {
  static async list(req: Request, res: Response) {
    const result = await OrderService.list(req.query);
    sendSuccess(res, result.data, translate('orders.retrieved', req.language), { ...result.meta });
  }

  static async getById(req: Request, res: Response) {
    const result = await OrderService.getById(req.params.id as string);
    sendSuccess(res, result, translate('orders.retrieved', req.language));
  }

  static async create(req: Request, res: Response) {
    const result = await OrderService.create(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('orders.created', req.language), null, 201);
  }

  static async take(req: Request, res: Response) {
    const result = await OrderService.take(req.params.id as string, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('orders.taken', req.language));
  }

  static async complete(req: Request, res: Response) {
    const result = await OrderService.complete(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('orders.completed', req.language));
  }

  static async fail(req: Request, res: Response) {
    const result = await OrderService.fail(req.params.id as string, req.body.issueReason, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('orders.failed', req.language));
  }

  static async switchApi(req: Request, res: Response) {
    const result = await OrderService.switchApi(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('orders.api_switched', req.language));
  }

  static async cancel(req: Request, res: Response) {
    const result = await OrderService.cancel(req.params.id as string, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('orders.cancelled', req.language));
  }
}
