import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { buildLocalizedSearchFilter, getQueryBoolean, getQueryString } from '../../common/helpers/query-filter.helper';
import { HttpError } from '../../common/errors/HttpError';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { StockService } from '../stock-services/stock-service.model';
import { StockCategory } from './stock-category.model';

interface StockCategoryInput {
  name: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  serviceId: string;
  isVisible: boolean;
  isDeleted: boolean;
}

type UpdateStockCategoryInput = Partial<StockCategoryInput>;

const uploadCategoryImage = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      { folder: 'stock-categories' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveImageUpload = async (actorId: string, file: Express.Multer.File, session: ClientSession) => {
  const uploadResult = await uploadCategoryImage(file);
  const uploadDoc = new Upload({
    ownerId: actorId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    size: uploadResult.bytes,
    provider: 'cloudinary',
    resourceType: uploadResult.resource_type,
    tags: ['stock-category'],
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

export class StockCategoryService {
  static async list(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const serviceId = getQueryString(query, 'serviceId');
    const shouldReturnAll = getQueryString(query, 'all') === 'true' && Boolean(serviceId);
    const isVisible = getQueryBoolean(query, 'isVisible');
    const isDeleted = getQueryBoolean(query, 'isDeleted');
    const filter: Record<string, unknown> = {
      ...buildLocalizedSearchFilter(search, [
        'name.en',
        'name.fr',
        'name.ar',
        'description.en',
        'description.fr',
        'description.ar',
      ]),
    };
    if (serviceId) filter.serviceId = serviceId;
    if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
    if (typeof isDeleted === 'boolean') filter.isDeleted = isDeleted;

    const queryBuilder = StockCategory.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('serviceId', 'name type')
      .populate('createdBy', 'name email')
      .lean();

    if (!shouldReturnAll) {
      queryBuilder.skip(skip).limit(limit);
    }

    const [categories, total] = await Promise.all([
      queryBuilder,
      StockCategory.countDocuments(filter),
    ]);

    return { data: categories, meta: buildPaginationMeta(total, page, shouldReturnAll ? total || 1 : limit) };
  }

  static async create(data: StockCategoryInput, actorId: string, file: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const service = await StockService.findById(data.serviceId).session(session);
      if (!service) throw HttpError.notFound('stockServices.not_found');

      const image = await saveImageUpload(actorId, file, session);
      const category = new StockCategory({
        ...data,
        image,
        createdBy: actorId,
        sortOrder: await StockCategory.countDocuments({}).session(session),
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await category.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: category._id,
        action: 'STOCK_CATEGORY_CREATED',
        entity: 'StockCategory',
        after: category.toObject(),
        ip,
        userAgent,
      }], { session });

      return category;
    });
  }

  static async update(categoryId: string, data: UpdateStockCategoryInput, actorId: string, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const category = await StockCategory.findById(categoryId).session(session);
      if (!category) throw HttpError.notFound('stockCategories.not_found');

      const before = category.toObject();
      const oldImageUrl = category.image?.secureUrl;

      if (data.serviceId) {
        const service = await StockService.findById(data.serviceId).session(session);
        if (!service) throw HttpError.notFound('stockServices.not_found');
        category.serviceId = new mongoose.Types.ObjectId(data.serviceId);
      }

      if (data.name) category.name = data.name;
      if (data.description) category.description = data.description;
      if (typeof data.isVisible === 'boolean') category.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        category.isDeleted = data.isDeleted;
        category.deletedAt = data.isDeleted ? category.deletedAt ?? new Date() : undefined;
      }
      category.updatedBy = new mongoose.Types.ObjectId(actorId);

      if (file) category.image = await saveImageUpload(actorId, file, session);

      await category.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: category._id,
        action: 'STOCK_CATEGORY_UPDATED',
        entity: 'StockCategory',
        before,
        after: category.toObject(),
        ip,
        userAgent,
      }], { session });

      if (file && oldImageUrl) {
        await cleanupQueue.add('delete-cloudinary-file', { url: oldImageUrl });
      }

      return category;
    });
  }

  static async reorder(orderedIds: string[], actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const actorObjectId = new mongoose.Types.ObjectId(actorId);
      await StockCategory.bulkWrite(
        orderedIds.map((id, index) => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: index, updatedBy: actorObjectId } },
          },
        })),
        { session }
      );

      await AuditLog.create([{
        actorId,
        action: 'STOCK_CATEGORY_REORDERED',
        entity: 'StockCategory',
        after: { orderedIds },
        ip,
        userAgent,
      }], { session });
    });
  }
}
