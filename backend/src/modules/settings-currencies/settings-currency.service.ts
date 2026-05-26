import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { SettingsCurrency } from './settings-currency.model';

interface CurrencyInput {
  name: string;
  shortName: string;
  price: number;
  priceBuy: number;
  isDollar: boolean;
  isVisible: boolean;
  isDeleted: boolean;
}

type UpdateCurrencyInput = Partial<CurrencyInput>;

const uploadCurrencyIcon = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      { folder: 'settings-currencies' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveIconUpload = async (actorId: string, file: Express.Multer.File, session: ClientSession) => {
  const uploadResult = await uploadCurrencyIcon(file);
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
    tags: ['settings-currency'],
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

export class SettingsCurrencyService {
  static async list(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const [currencies, total] = await Promise.all([
      SettingsCurrency.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      SettingsCurrency.countDocuments({}),
    ]);

    return { data: currencies, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: CurrencyInput, actorId: string, file: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const icon = await saveIconUpload(actorId, file, session);
      const currency = new SettingsCurrency({
        ...data,
        icon,
        createdBy: actorId,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await currency.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: currency._id,
        action: 'SETTINGS_CURRENCY_CREATED',
        entity: 'SettingsCurrency',
        after: currency.toObject(),
        ip,
        userAgent,
      }], { session });

      return currency;
    });
  }

  static async update(currencyId: string, data: UpdateCurrencyInput, actorId: string, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const currency = await SettingsCurrency.findById(currencyId).session(session);
      if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

      const before = currency.toObject();
      const oldIconUrl = currency.icon?.secureUrl;

      if (data.name) currency.name = data.name;
      if (data.shortName) currency.shortName = data.shortName;
      if (typeof data.price === 'number') currency.price = data.price;
      if (typeof data.priceBuy === 'number') currency.priceBuy = data.priceBuy;
      if (typeof data.isDollar === 'boolean') currency.isDollar = data.isDollar;
      if (typeof data.isVisible === 'boolean') currency.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        currency.isDeleted = data.isDeleted;
        currency.deletedAt = data.isDeleted ? currency.deletedAt ?? new Date() : undefined;
      }
      currency.updatedBy = new mongoose.Types.ObjectId(actorId);

      if (file) currency.icon = await saveIconUpload(actorId, file, session);

      await currency.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: currency._id,
        action: 'SETTINGS_CURRENCY_UPDATED',
        entity: 'SettingsCurrency',
        before,
        after: currency.toObject(),
        ip,
        userAgent,
      }], { session });

      if (file && oldIconUrl) await cleanupQueue.add('delete-cloudinary-file', { url: oldIconUrl });

      return currency;
    });
  }
}
