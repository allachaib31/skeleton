import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { buildLocalizedSearchFilter, getQueryString } from '../../common/helpers/query-filter.helper';
import { HttpError } from '../../common/errors/HttpError';
import { StockCategory } from '../stock-categories/stock-category.model';
import { StockProductGroup } from '../stock-product-groups/stock-product-group.model';
import { StockProduct } from '../stock-products/stock-product.model';
import { StockService } from '../stock-services/stock-service.model';

const productPublicSelect = [
  '_id',
  'serviceId',
  'categoryId',
  'groupId',
  'name',
  'description',
  'quantityMode',
  'minQuantity',
  'maxQuantity',
  'customQuantities',
  'quantityAvailable',
  'dripfeed',
  'refill',
  'cancel',
  'stock',
  'fulfillmentType',
  'apiGroup',
  'apiPayload',
  'visibleCountryCodes',
  'requirements',
  'image',
  'sortOrder',
  'createdAt',
  'updatedAt',
].join(' ');

const servicePublicSelect = '_id name description type image sortOrder createdAt updatedAt';

const toPublicProduct = (product: Record<string, any>) => {
  const { apiPayload, ...publicProduct } = product;
  const countries = Array.isArray(apiPayload?.countries)
    ? apiPayload.countries.map((country: Record<string, unknown>) => ({
        countryCode: String(country.countryCode || ''),
        countryName: String(country.countryName || ''),
        flag: String(country.flag || ''),
        price: Number.isFinite(Number(country.price)) ? Number(country.price) : undefined,
        count: Number.isFinite(Number(country.count)) ? Number(country.count) : undefined,
      })).filter((country: { countryCode: string }) => Boolean(country.countryCode))
    : undefined;

  return {
    ...publicProduct,
    numberCountries: countries,
  };
};

export class ShopService {
  static async listServices(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const type = getQueryString(query, 'type');
    const filter: Record<string, unknown> = {
      isVisible: true,
      isDeleted: false,
      ...buildLocalizedSearchFilter(search, [
        'name.en',
        'name.fr',
        'name.ar',
        'description.en',
        'description.fr',
        'description.ar',
      ]),
    };
    if (type) filter.type = type;

    const [services, total] = await Promise.all([
      StockService.find(filter)
        .select(servicePublicSelect)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockService.countDocuments(filter),
    ]);

    const counts = services.length
      ? await StockProduct.aggregate([
          {
            $match: {
              serviceId: { $in: services.map((service) => service._id) },
              isVisible: true,
              isDeleted: false,
            },
          },
          { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        ])
      : [];
    const countByService = new Map(counts.map((item) => [String(item._id), item.count]));

    return {
      data: services.map((service) => ({
        ...service,
        productCount: countByService.get(String(service._id)) || 0,
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  static async listProducts(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const serviceId = getQueryString(query, 'serviceId');
    const categoryId = getQueryString(query, 'categoryId');
    const groupId = getQueryString(query, 'groupId');
    const filter: Record<string, unknown> = {
      isVisible: true,
      isDeleted: false,
      ...buildLocalizedSearchFilter(search, [
        'name.en',
        'name.fr',
        'name.ar',
        'description.en',
        'description.fr',
        'description.ar',
        'serviceNumber',
      ]),
    };
    if (serviceId) filter.serviceId = serviceId;
    if (categoryId) filter.categoryId = categoryId;
    if (groupId) filter.groupId = groupId;

    const queryBuilder = StockProduct.find(filter)
      .select(productPublicSelect)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('serviceId', 'name type')
      .populate('categoryId', 'name serviceId')
      .populate('groupId', 'name image coverImage')
      .lean();

    const [products, total] = await Promise.all([
      queryBuilder,
      StockProduct.countDocuments(filter),
    ]);

    return { data: products.map((product) => toPublicProduct(product as Record<string, any>)), meta: buildPaginationMeta(total, page, limit) };
  }

  static async listCategories(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const serviceId = getQueryString(query, 'serviceId');
    const search = getQueryString(query, 'search');
    const filter: Record<string, unknown> = {
      isVisible: true,
      isDeleted: false,
      ...buildLocalizedSearchFilter(search, ['name.en', 'name.fr', 'name.ar']),
    };
    if (serviceId) filter.serviceId = serviceId;

    const [categories, total] = await Promise.all([
      StockCategory.find(filter)
        .select('_id name serviceId image sortOrder')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockCategory.countDocuments(filter),
    ]);

    return { data: categories, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listProductGroups(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const serviceId = getQueryString(query, 'serviceId');
    const categoryId = getQueryString(query, 'categoryId');
    const productFilter: Record<string, unknown> = {
      isVisible: true,
      isDeleted: false,
      groupId: { $exists: true, $ne: null },
    };
    if (serviceId) productFilter.serviceId = serviceId;
    if (categoryId) productFilter.categoryId = categoryId;

    const groupIds = await StockProduct.distinct('groupId', productFilter);
    const filter: Record<string, unknown> = {
      _id: { $in: groupIds },
      ...buildLocalizedSearchFilter(search, ['name.en', 'name.fr', 'name.ar', 'description.en', 'description.fr', 'description.ar']),
    };

    const [groups, total] = await Promise.all([
      StockProductGroup.find(filter)
        .select('_id name description image coverImage createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockProductGroup.countDocuments(filter),
    ]);

    const counts = groups.length
      ? await StockProduct.aggregate([
          { $match: { ...productFilter, groupId: { $in: groups.map((group) => group._id) } } },
          { $group: { _id: '$groupId', count: { $sum: 1 } } },
        ])
      : [];
    const countByGroup = new Map(counts.map((item) => [String(item._id), item.count]));

    return {
      data: groups.map((group) => ({ ...group, productCount: countByGroup.get(String(group._id)) || 0 })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  static async listCategoryItems(query: unknown) {
    const { page, limit } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const serviceId = getQueryString(query, 'serviceId');
    const categoryId = getQueryString(query, 'categoryId');
    const productFilter: Record<string, unknown> = {
      isVisible: true,
      isDeleted: false,
    };
    if (serviceId) productFilter.serviceId = serviceId;
    if (categoryId) productFilter.categoryId = categoryId;

    const groupedFilter = {
      ...productFilter,
      groupId: { $exists: true, $ne: null },
    };
    const ungroupedFilter = {
      ...productFilter,
      $or: [{ groupId: { $exists: false } }, { groupId: null }],
      ...buildLocalizedSearchFilter(search, ['name.en', 'name.fr', 'name.ar', 'description.en', 'description.fr', 'description.ar', 'serviceNumber']),
    };

    const groupIds = await StockProduct.distinct('groupId', groupedFilter);
    const groupFilter: Record<string, unknown> = {
      _id: { $in: groupIds },
      ...buildLocalizedSearchFilter(search, ['name.en', 'name.fr', 'name.ar', 'description.en', 'description.fr', 'description.ar']),
    };

    const [groups, ungroupedProducts] = await Promise.all([
      StockProductGroup.find(groupFilter)
        .select('_id name description image coverImage createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean(),
      StockProduct.find(ungroupedFilter)
        .select(productPublicSelect)
        .populate('serviceId', 'name type')
        .populate('categoryId', 'name serviceId')
        .populate('groupId', 'name image coverImage')
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean(),
    ]);

    const counts = groups.length
      ? await StockProduct.aggregate([
          { $match: { ...groupedFilter, groupId: { $in: groups.map((group) => group._id) } } },
          { $group: { _id: '$groupId', count: { $sum: 1 } } },
        ])
      : [];
    const countByGroup = new Map(counts.map((item) => [String(item._id), item.count]));
    const items: Array<{
      type: 'GROUP' | 'PRODUCT';
      group?: Record<string, any>;
      product?: Record<string, any>;
      sortDate?: Date | string;
    }> = [
      ...groups.map((group) => ({
        type: 'GROUP' as const,
        group: { ...group, productCount: countByGroup.get(String(group._id)) || 0 },
        sortDate: group.createdAt,
      })),
      ...ungroupedProducts.map((product) => ({
        type: 'PRODUCT' as const,
        product: toPublicProduct(product as Record<string, any>),
        sortDate: product.createdAt,
      })),
    ].sort((left, right) => new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    return {
      data: items.slice(start, start + limit).map(({ sortDate, ...item }) => item),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  static async getProduct(productId: string) {
    const product = await StockProduct.findOne({
      _id: productId,
      isVisible: true,
      isDeleted: false,
    })
      .select(productPublicSelect)
      .populate('serviceId', 'name type')
      .populate('categoryId', 'name serviceId')
      .populate('groupId', 'name image coverImage')
      .populate('requirements', 'paramsName message description inputType defaultValue isRequired')
      .lean();

    if (!product) throw HttpError.notFound('shop.product_not_found');
    return toPublicProduct(product as Record<string, any>);
  }
}
