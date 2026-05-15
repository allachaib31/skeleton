import { cloudinary } from '../../config/cloudinary.config';
import streamifier from 'streamifier';
import { HttpError } from '../../common/errors/HttpError';
import { uploadPolicies } from '../../middlewares/upload.middleware';

export class UploadService {
  static validateFile(file: Express.Multer.File) {
    const avatarPolicy = uploadPolicies.avatar;
    if (!avatarPolicy.allowedMimeTypes.includes(file.mimetype)) {
      throw HttpError.badRequest('uploads.invalid_format');
    }
    if (file.size > avatarPolicy.maxSizeBytes) {
      throw HttpError.badRequest('uploads.size_exceeded');
    }
  }

  static async uploadToCloudinary(buffer: Buffer, options: any = {}) {
    return new Promise<any>((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder: options.folder || 'general', ...options },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(buffer).pipe(cldStream);
    });
  }

  static async deleteFromCloudinary(publicId: string) {
    return await cloudinary.uploader.destroy(publicId);
  }
}
