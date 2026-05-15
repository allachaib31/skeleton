import { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { Upload } from './upload.model';
import { sendSuccess } from '../../common/responses/api.response';
import { HttpError } from '../../common/errors/HttpError';
import { translate } from '../../config/i18n.config';

export class UploadController {
  static async uploadAvatar(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('uploads.no_file');
    
    UploadService.validateFile(req.file);
    
    const result = await UploadService.uploadToCloudinary(req.file.buffer, { folder: 'avatars' });
    
    const upload = await Upload.create({
      ownerId: req.user!.id,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      provider: 'cloudinary',
      resourceType: result.resource_type,
    });

    sendSuccess(res, upload, translate('uploads.avatar_uploaded', req.language), null, 201);
  }

  static async getMyUploads(req: Request, res: Response) {
    const uploads = await Upload.find({ ownerId: req.user!.id }).sort({ createdAt: -1 });
    sendSuccess(res, uploads, translate('common.operation_successful', req.language));
  }

  static async deleteUpload(req: Request, res: Response) {
    const upload = await Upload.findOne({ _id: req.params.id, ownerId: req.user!.id });
    if (!upload) throw HttpError.notFound('uploads.not_found');

    await UploadService.deleteFromCloudinary(upload.publicId);
    await upload.deleteOne();

    sendSuccess(res, null, translate('uploads.deleted', req.language));
  }
}
