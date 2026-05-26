import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { OrderService } from '../orders/order.service';
import { ShopService } from './shop.service';

export class ShopController {
  static async listOrders(req: Request, res: Response) {
    const result = await OrderService.list({ ...req.query, clientId: req.user!.id });
    sendSuccess(res, result.data, translate('shop.orders_retrieved', req.language), { ...result.meta });
  }

  static async getOrder(req: Request, res: Response) {
    const result = await OrderService.getByIdForClient(req.params.id as string, req.user!.id);
    sendSuccess(res, result, translate('shop.order_retrieved', req.language));
  }

  static async listServices(req: Request, res: Response) {
    const result = await ShopService.listServices(req.query);
    sendSuccess(res, result.data, translate('shop.services_retrieved', req.language), { ...result.meta });
  }

  static async listProducts(req: Request, res: Response) {
    const result = await ShopService.listProducts(req.query);
    sendSuccess(res, result.data, translate('shop.products_retrieved', req.language), { ...result.meta });
  }

  static async listCategories(req: Request, res: Response) {
    const result = await ShopService.listCategories(req.query);
    sendSuccess(res, result.data, translate('shop.categories_retrieved', req.language), { ...result.meta });
  }

  static async listProductGroups(req: Request, res: Response) {
    const result = await ShopService.listProductGroups(req.query);
    sendSuccess(res, result.data, translate('shop.product_groups_retrieved', req.language), { ...result.meta });
  }

  static async listCategoryItems(req: Request, res: Response) {
    const result = await ShopService.listCategoryItems(req.query);
    sendSuccess(res, result.data, translate('shop.category_items_retrieved', req.language), { ...result.meta });
  }

  static async getProduct(req: Request, res: Response) {
    const product = await ShopService.getProduct(req.params.id as string);
    sendSuccess(res, product, translate('shop.product_retrieved', req.language));
  }

  static async createOrder(req: Request, res: Response) {
    const result = await OrderService.create(
      { ...req.body, clientId: req.user!.id },
      req.user!.id,
      req.ip,
      req.headers['user-agent'],
    );
    sendSuccess(res, result, translate('shop.order_created', req.language), null, 201);
  }
}
