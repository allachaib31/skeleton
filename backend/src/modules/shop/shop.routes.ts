import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { listOrdersSchema } from '../orders/order.validator';
import { ShopController } from './shop.controller';
import { createShopOrderSchema, listShopCategoriesSchema, listShopCategoryItemsSchema, listShopProductGroupsSchema, listShopProductsSchema, listShopServicesSchema, shopProductParamsSchema } from './shop.validator';

const router = Router();

router.get('/services', validate(listShopServicesSchema, 'query'), asyncHandler(ShopController.listServices));
router.get('/categories', validate(listShopCategoriesSchema, 'query'), asyncHandler(ShopController.listCategories));
router.get('/product-groups', validate(listShopProductGroupsSchema, 'query'), asyncHandler(ShopController.listProductGroups));
router.get('/category-items', validate(listShopCategoryItemsSchema, 'query'), asyncHandler(ShopController.listCategoryItems));
router.get('/products', validate(listShopProductsSchema, 'query'), asyncHandler(ShopController.listProducts));
router.get('/products/:id', validate(shopProductParamsSchema, 'params'), asyncHandler(ShopController.getProduct));
router.get('/orders', authenticate, validate(listOrdersSchema, 'query'), asyncHandler(ShopController.listOrders));
router.post('/orders', authenticate, validate(createShopOrderSchema), asyncHandler(ShopController.createOrder));
router.get('/orders/:id', authenticate, validate(shopProductParamsSchema, 'params'), asyncHandler(ShopController.getOrder));

export default router;
