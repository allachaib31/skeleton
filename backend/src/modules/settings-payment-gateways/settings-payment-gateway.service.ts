import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { SettingsPaymentGateway } from './settings-payment-gateway.model';

type PaymentGatewayInput = any;
const uploadPlaceholder = '__UPLOAD__';

const uploadPaymentGatewayImage = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder: 'settings-payment-gateways' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveImageUpload = async (actorId: string, file: Express.Multer.File, session: ClientSession, tag?: string) => {
  const uploadResult = await uploadPaymentGatewayImage(file);
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
    tags: ['settings-payment-gateway', tag].filter(Boolean),
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

const normalizeInput = (data: PaymentGatewayInput) => ({
  ...data,
  link: data.kind === 'PAYMENT_GATEWAY' ? data.link : undefined,
  token: data.kind === 'PAYMENT_GATEWAY' ? data.token : undefined,
  currencyId: data.kind === 'BANK' && data.currencyId ? new mongoose.Types.ObjectId(data.currencyId) : undefined,
  description: data.kind === 'BANK' ? data.description : undefined,
  infoFields: data.kind === 'BANK' ? data.infoFields || [] : [],
});

const resolveInfoFields = async (
  actorId: string,
  infoFields: any[],
  infoFiles: Express.Multer.File[],
  session: ClientSession
) => {
  let fileIndex = 0;
  const resolvedFields = [];

  for (const field of infoFields || []) {
    if ((field.type === 'IMAGE' || field.type === 'QR_CODE') && field.value === uploadPlaceholder) {
      const file = infoFiles[fileIndex];
      if (!file) throw HttpError.badRequest('settingsPaymentGateways.info_file_required');
      const upload = await saveImageUpload(actorId, file, session, 'info-field');
      resolvedFields.push({ ...field, value: upload.secureUrl });
      fileIndex += 1;
    } else {
      resolvedFields.push(field);
    }
  }

  return resolvedFields;
};

export class SettingsPaymentGatewayService {
  static async list(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    if (query.kind) filter.kind = query.kind;

    const [items, total] = await Promise.all([
      SettingsPaymentGateway.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('currencyId', 'name shortName icon')
        .populate('createdBy', 'name email')
        .lean(),
      SettingsPaymentGateway.countDocuments(filter),
    ]);

    return { data: items, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: PaymentGatewayInput, actorId: string, file: Express.Multer.File, infoFiles: Express.Multer.File[] = [], ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      if (data.kind === 'BANK') {
        const currency = await SettingsCurrency.findById(data.currencyId).session(session);
        if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');
      }

      const image = await saveImageUpload(actorId, file, session);
      const normalizedInput = normalizeInput(data);
      normalizedInput.infoFields = await resolveInfoFields(actorId, normalizedInput.infoFields, infoFiles, session);
      const item = new SettingsPaymentGateway({
        ...normalizedInput,
        image,
        createdBy: actorId,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await item.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: item._id,
        action: 'SETTINGS_PAYMENT_GATEWAY_CREATED',
        entity: 'SettingsPaymentGateway',
        after: item.toObject(),
        ip,
        userAgent,
      }], { session });

      return item;
    });
  }

  static async update(id: string, data: PaymentGatewayInput, actorId: string, file?: Express.Multer.File, infoFiles: Express.Multer.File[] = [], ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const item = await SettingsPaymentGateway.findById(id).session(session);
      if (!item) throw HttpError.notFound('settingsPaymentGateways.not_found');

      const before = item.toObject();
      const oldImageUrl = item.image?.secureUrl;
      const nextData = normalizeInput({ ...item.toObject(), ...data });
      if (nextData.kind === 'PAYMENT_GATEWAY' && data.token === undefined) {
        delete nextData.token;
      }
      nextData.infoFields = await resolveInfoFields(actorId, nextData.infoFields, infoFiles, session);

      if (nextData.kind === 'BANK' && nextData.currencyId) {
        const currency = await SettingsCurrency.findById(nextData.currencyId).session(session);
        if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');
      }

      item.set({
        ...nextData,
        updatedBy: new mongoose.Types.ObjectId(actorId),
        deletedAt: typeof data.isDeleted === 'boolean' && data.isDeleted ? item.deletedAt ?? new Date() : data.isDeleted === false ? undefined : item.deletedAt,
      });
      if (file) item.image = await saveImageUpload(actorId, file, session);

      await item.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: item._id,
        action: 'SETTINGS_PAYMENT_GATEWAY_UPDATED',
        entity: 'SettingsPaymentGateway',
        before,
        after: item.toObject(),
        ip,
        userAgent,
      }], { session });

      if (file && oldImageUrl) await cleanupQueue.add('delete-cloudinary-file', { url: oldImageUrl });

      return item;
    });
  }
}
