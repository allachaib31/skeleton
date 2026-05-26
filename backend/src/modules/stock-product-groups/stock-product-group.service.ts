import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { buildLocalizedSearchFilter, getQueryString } from '../../common/helpers/query-filter.helper';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { LocalizedText } from '../stock-services/stock-service.model';
import { StockProductGroup } from './stock-product-group.model';

interface ProductGroupInput {
  name: LocalizedText;
  description: LocalizedText;
}

const uploadGroupImage = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder: 'stock-product-groups' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveImageUpload = async (actorId: string, file: Express.Multer.File, tag: string, session: ClientSession) => {
  const uploadResult = await uploadGroupImage(file);
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
    tags: ['stock-product-group', tag],
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

export class StockProductGroupService {
  static async list(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const search = getQueryString(query, 'search');
    const filter = buildLocalizedSearchFilter(search, [
      'name.en',
      'name.fr',
      'name.ar',
      'description.en',
      'description.fr',
      'description.ar',
    ]);

    const [groups, total] = await Promise.all([
      StockProductGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      StockProductGroup.countDocuments(filter),
    ]);

    return { data: groups, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: ProductGroupInput, actorId: string, imageFile: Express.Multer.File, coverImageFile: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const image = await saveImageUpload(actorId, imageFile, 'image', session);
      const coverImage = await saveImageUpload(actorId, coverImageFile, 'cover-image', session);
      const group = new StockProductGroup({
        ...data,
        image,
        coverImage,
        createdBy: actorId,
      });
      await group.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: group._id,
        action: 'STOCK_PRODUCT_GROUP_CREATED',
        entity: 'StockProductGroup',
        after: group.toObject(),
        ip,
        userAgent,
      }], { session });

      return group;
    });
  }
}
