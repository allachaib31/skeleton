import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { StockWarehouseService } from './stock-warehouse.service';

export class StockWarehouseController {
  static async list(req: Request, res: Response) {
    const result = await StockWarehouseService.list(req.query);
    sendSuccess(res, result.data, translate('stockWarehouses.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const result = await StockWarehouseService.create(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('stockWarehouses.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const result = await StockWarehouseService.update(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('stockWarehouses.updated', req.language));
  }

  static async listItems(req: Request, res: Response) {
    const result = await StockWarehouseService.listItems(req.query);
    sendSuccess(res, result.data, translate('stockWarehouses.items_retrieved', req.language), { ...result.meta });
  }

  static async createItem(req: Request, res: Response) {
    const result = await StockWarehouseService.createItem(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('stockWarehouses.item_created', req.language), null, 201);
  }

  static async importItems(req: Request, res: Response) {
    const result = await StockWarehouseService.importItems(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('stockWarehouses.items_imported', req.language), null, 201);
  }

  static async updateItem(req: Request, res: Response) {
    const result = await StockWarehouseService.updateItem(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('stockWarehouses.item_updated', req.language));
  }

  static async bulkUpdateItems(req: Request, res: Response) {
    await StockWarehouseService.bulkUpdateItems(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('stockWarehouses.items_updated', req.language));
  }
}
