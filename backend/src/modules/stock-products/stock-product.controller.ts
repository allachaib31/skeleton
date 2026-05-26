import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { HttpError } from '../../common/errors/HttpError';
import { StockProductService } from './stock-product.service';
import { StockProductApiConnectionService } from './stock-product-api-connection.service';

export class StockProductController {
  static async list(req: Request, res: Response) {
    const result = await StockProductService.list(req.query);
    sendSuccess(res, result.data, translate('stockProducts.retrieved', req.language), { ...result.meta });
  }

  static async getById(req: Request, res: Response) {
    const product = await StockProductService.getById(req.params.id as string);
    sendSuccess(res, product, translate('stockProducts.retrieved', req.language));
  }

  static async create(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('uploads.no_file');

    const product = await StockProductService.create(
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, product, translate('stockProducts.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const product = await StockProductService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.file,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(res, product, translate('stockProducts.updated', req.language));
  }

  static async reorder(req: Request, res: Response) {
    await StockProductService.reorder(req.body.orderedIds, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('stockProducts.reordered', req.language));
  }

  static async bulkUpdate(req: Request, res: Response) {
    await StockProductService.bulkUpdate(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('stockProducts.bulkUpdated', req.language));
  }

  static async previewApiProductsImport(req: Request, res: Response) {
    const result = await StockProductService.previewApiProductsImport(req.body);
    sendSuccess(res, result, translate('stockProducts.importPreviewed', req.language));
  }

  static async importApiProducts(req: Request, res: Response) {
    const result = await StockProductService.importApiProducts(
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('stockProducts.imported', req.language), null, 201);
  }

  static async listApiConnections(req: Request, res: Response) {
    const result = await StockProductApiConnectionService.list(req.params.productId as string);
    sendSuccess(res, result, translate('stockProductApiConnections.retrieved', req.language));
  }

  static async createApiConnection(req: Request, res: Response) {
    const result = await StockProductApiConnectionService.create(
      req.params.productId as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('stockProductApiConnections.created', req.language), null, 201);
  }

  static async updateApiConnection(req: Request, res: Response) {
    const result = await StockProductApiConnectionService.update(
      req.params.productId as string,
      req.params.connectionId as string,
      req.body,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('stockProductApiConnections.updated', req.language));
  }

  static async activateApiConnection(req: Request, res: Response) {
    const result = await StockProductApiConnectionService.activate(
      req.params.productId as string,
      req.params.connectionId as string,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, result, translate('stockProductApiConnections.activated', req.language));
  }

  static async deleteApiConnection(req: Request, res: Response) {
    await StockProductApiConnectionService.softDelete(
      req.params.productId as string,
      req.params.connectionId as string,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    sendSuccess(res, null, translate('stockProductApiConnections.deleted', req.language));
  }
}
