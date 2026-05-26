import { ClientSession } from 'mongoose';
import mongoose from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { buildLocalizedSearchFilter, getQueryBoolean, getQueryString } from '../../common/helpers/query-filter.helper';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { ServiceType, StockService } from './stock-service.model';
import { HttpError } from '../../common/errors/HttpError';
import { cleanupQueue } from '../../queues/cleanup.queue';

interface CreateStockServiceInput {
  name: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  type: ServiceType;
  isVisible: boolean;
  isDeleted: boolean;
}

type UpdateStockServiceInput = Partial<CreateStockServiceInput>;

const uploadServiceImage = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      { folder: 'stock-services' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

export class StockServiceService {
  static async list(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const type = getQueryString(query, 'type');
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
    if (type) filter.type = type;
    if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
    if (typeof isDeleted === 'boolean') filter.isDeleted = isDeleted;

    const [services, total] = await Promise.all([
      StockService.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      StockService.countDocuments(filter),
    ]);

    return {
      data: services,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  static async create(
    data: CreateStockServiceInput,
    actorId: string,
    file?: Express.Multer.File,
    ip?: string,
    userAgent?: string
  ) {
    return await withTransaction(async (session: ClientSession) => {
      let image:
        | {
            uploadId: mongoose.Types.ObjectId;
            publicId: string;
            secureUrl: string;
          }
        | undefined;

      if (file) {
        const uploadResult = await uploadServiceImage(file);
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
          tags: ['stock-service'],
        });
        await uploadDoc.save({ session });

        image = {
          uploadId: uploadDoc._id as mongoose.Types.ObjectId,
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
        };
      }

      const service = new StockService({
        ...data,
        image,
        createdBy: actorId,
        sortOrder: await StockService.countDocuments({}).session(session),
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await service.save({ session });

      await AuditLog.create(
        [{
          actorId,
          targetId: service._id,
          action: 'STOCK_SERVICE_CREATED',
          entity: 'StockService',
          after: service.toObject(),
          ip,
          userAgent,
        }],
        { session }
      );

      return service;
    });
  }

  static async update(
    serviceId: string,
    data: UpdateStockServiceInput,
    actorId: string,
    file?: Express.Multer.File,
    ip?: string,
    userAgent?: string
  ) {
    return await withTransaction(async (session: ClientSession) => {
      const service = await StockService.findById(serviceId).session(session);
      if (!service) throw HttpError.notFound('stockServices.not_found');

      const before = service.toObject();
      const oldImageUrl = service.image?.secureUrl;

      if (data.name) service.name = data.name;
      if (data.description) service.description = data.description;
      if (data.type) service.type = data.type;
      if (typeof data.isVisible === 'boolean') service.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        service.isDeleted = data.isDeleted;
        service.deletedAt = data.isDeleted ? service.deletedAt ?? new Date() : undefined;
      }
      service.updatedBy = new mongoose.Types.ObjectId(actorId);

      if (file) {
        const uploadResult = await uploadServiceImage(file);
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
          tags: ['stock-service'],
        });
        await uploadDoc.save({ session });

        service.image = {
          uploadId: uploadDoc._id as mongoose.Types.ObjectId,
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
        };
      }

      await service.save({ session });

      await AuditLog.create(
        [{
          actorId,
          targetId: service._id,
          action: 'STOCK_SERVICE_UPDATED',
          entity: 'StockService',
          before,
          after: service.toObject(),
          ip,
          userAgent,
        }],
        { session }
      );

      if (file && oldImageUrl) {
        await cleanupQueue.add('delete-cloudinary-file', { url: oldImageUrl });
      }

      return service;
    });
  }

  static async reorder(orderedIds: string[], actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const actorObjectId = new mongoose.Types.ObjectId(actorId);
      await StockService.bulkWrite(
        orderedIds.map((id, index) => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: index, updatedBy: actorObjectId } },
          },
        })),
        { session }
      );

      await AuditLog.create(
        [{
          actorId,
          action: 'STOCK_SERVICE_REORDERED',
          entity: 'StockService',
          after: { orderedIds },
          ip,
          userAgent,
        }],
        { session }
      );
    });
  }
}
