import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { withTransaction } from '../../database/transaction';
import { cleanupQueue } from '../../queues/cleanup.queue';
import { AuditLog } from '../audit/audit-log.model';
import { Upload } from '../uploads/upload.model';
import { SettingsApp, SettingsAsset } from './settings-app.model';

interface SettingsAppInput {
  appName?: string;
}

const defaultSettings = {
  key: 'default' as const,
  appName: 'tafa3olcard',
};

const uploadBrandAsset = async (file: Express.Multer.File, folder: string) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveAssetUpload = async (actorId: string, file: Express.Multer.File, tag: string, session: ClientSession): Promise<SettingsAsset> => {
  const uploadResult = await uploadBrandAsset(file, 'settings-app');
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
    tags: [tag],
  });
  await uploadDoc.save({ session });

  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

export class SettingsAppService {
  static async get() {
    const settings = await SettingsApp.findOne({ key: 'default' }).lean();
    return settings || defaultSettings;
  }

  static async update(
    data: SettingsAppInput,
    actorId: string,
    files: { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
    ip?: string,
    userAgent?: string
  ) {
    return await withTransaction(async (session: ClientSession) => {
      const settings = await SettingsApp.findOne({ key: 'default' }).session(session) || new SettingsApp({
        ...defaultSettings,
        createdBy: new mongoose.Types.ObjectId(actorId),
      });
      const before = settings.isNew ? null : settings.toObject();
      const oldLogoUrl = settings.logo?.secureUrl;
      const oldFaviconUrl = settings.favicon?.secureUrl;

      if (data.appName !== undefined) settings.appName = data.appName;
      if (files.logo?.[0]) settings.logo = await saveAssetUpload(actorId, files.logo[0], 'settings-app-logo', session);
      if (files.favicon?.[0]) settings.favicon = await saveAssetUpload(actorId, files.favicon[0], 'settings-app-favicon', session);
      settings.updatedBy = new mongoose.Types.ObjectId(actorId);

      await settings.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: settings._id,
        action: 'SETTINGS_APP_UPDATED',
        entity: 'SettingsApp',
        before,
        after: settings.toObject(),
        ip,
        userAgent,
      }], { session });

      if (files.logo?.[0] && oldLogoUrl) await cleanupQueue.add('delete-cloudinary-file', { url: oldLogoUrl });
      if (files.favicon?.[0] && oldFaviconUrl) await cleanupQueue.add('delete-cloudinary-file', { url: oldFaviconUrl });

      return settings;
    });
  }
}
