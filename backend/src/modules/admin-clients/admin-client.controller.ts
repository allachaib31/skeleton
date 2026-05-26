import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { AdminClientService } from './admin-client.service';

const firstHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export class AdminClientController {
  static async list(req: Request, res: Response) {
    const result = await AdminClientService.list(req.query);
    sendSuccess(res, result.data, translate('adminClients.retrieved', req.language), { ...result.meta });
  }

  static async get(req: Request, res: Response) {
    const result = await AdminClientService.get(req.params.id as string, req.query);
    sendSuccess(res, result, translate('adminClients.retrieved', req.language));
  }

  static async listAllMovements(req: Request, res: Response) {
    const result = await AdminClientService.listAllMovements(req.query);
    sendSuccess(res, result.data, translate('adminClients.movements_retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const result = await AdminClientService.create(
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const result = await AdminClientService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.updated', req.language));
  }

  static async softDelete(req: Request, res: Response) {
    const result = await AdminClientService.softDelete(
      req.params.id as string,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.deleted', req.language));
  }

  static async createMovement(req: Request, res: Response) {
    const result = await AdminClientService.createMovement(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.movement_created', req.language), null, 201);
  }

  static async updateOpenCredit(req: Request, res: Response) {
    const result = await AdminClientService.updateOpenCredit(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.open_credit_updated', req.language));
  }

  static async listLevels(req: Request, res: Response) {
    const result = await AdminClientService.listLevels(req.params.id as string);
    sendSuccess(res, result, translate('adminClients.levels_retrieved', req.language));
  }

  static async updateLevel(req: Request, res: Response) {
    const result = await AdminClientService.updateLevel(
      req.params.id as string,
      req.params.levelId as string,
      req.body,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.level_updated', req.language));
  }

  static async generateLevels(req: Request, res: Response) {
    const result = await AdminClientService.generateLevels(
      req.params.id as string,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.levels_generated', req.language));
  }

  static async listSpecialPrices(req: Request, res: Response) {
    const result = await AdminClientService.listSpecialPrices(req.params.id as string, req.query);
    sendSuccess(res, result.data, translate('adminClients.special_prices_retrieved', req.language), { ...result.meta });
  }

  static async listAllSpecialPrices(req: Request, res: Response) {
    const result = await AdminClientService.listAllSpecialPrices(req.query);
    sendSuccess(res, result.data, translate('adminClients.special_prices_retrieved', req.language), { ...result.meta });
  }

  static async createSpecialPrice(req: Request, res: Response) {
    const result = await AdminClientService.createSpecialPrice(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.special_price_created', req.language), null, 201);
  }

  static async bulkDeleteSpecialPrices(req: Request, res: Response) {
    const result = await AdminClientService.bulkDeleteSpecialPrices(
      req.params.id as string,
      req.body.ids,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.special_prices_deleted', req.language));
  }

  static async updateSpecialPrice(req: Request, res: Response) {
    const result = await AdminClientService.updateSpecialPrice(
      req.params.specialPriceId as string,
      req.body,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.special_price_updated', req.language));
  }

  static async bulkDeleteAllSpecialPrices(req: Request, res: Response) {
    const result = await AdminClientService.bulkDeleteAllSpecialPrices(
      req.body.ids,
      req.user!.id,
      req.ip,
      firstHeader(req.headers['user-agent'])
    );
    sendSuccess(res, result, translate('adminClients.special_prices_deleted', req.language));
  }
}
