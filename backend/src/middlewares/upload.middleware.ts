import multer, { FileFilterCallback } from 'multer';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/errors/AppError';
import { translate } from '../config/i18n.config';

const storage = multer.memoryStorage();

interface UploadPolicy {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  description: string;
}

export const uploadPolicies = {
  avatar: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024,
    description: 'Avatar images: JPEG, PNG, or WEBP up to 5MB.',
  },
  serviceImage: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024,
    description: 'Service images: JPEG, PNG, or WEBP up to 5MB.',
  },
  languageJson: {
    allowedMimeTypes: ['application/json'],
    maxSizeBytes: 256 * 1024,
    description: 'Language JSON files up to 256KB.',
  },
} satisfies Record<string, UploadPolicy>;

const createFileFilter = (policy: UploadPolicy) =>
  (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (policy.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(translate('uploads.unsupported_format', req.language, { description: policy.description }), 400) as any, false);
    }
  };

const jsonFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (uploadPolicies.languageJson.allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.json')) {
    cb(null, true);
  } else {
    cb(new AppError(translate('uploads.unsupported_format', req.language, { description: uploadPolicies.languageJson.description }), 400) as any, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: uploadPolicies.avatar.maxSizeBytes,
  },
  fileFilter: createFileFilter(uploadPolicies.avatar),
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) => upload.fields(fields);

const imageSignatureValidators: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,
  'image/webp': (buffer) =>
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP',
};

const collectUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }
  return [];
};

export const validateImageFileSignature = (req: Request, _res: Response, next: NextFunction): void => {
  const files = collectUploadedFiles(req);

  for (const file of files) {
    const isValid = imageSignatureValidators[file.mimetype]?.(file.buffer);

    if (!isValid) {
      return next(new AppError(translate('uploads.invalid_content', req.language), 400));
    }
  }

  next();
};

export const validateUploadPolicy = (policyName: keyof typeof uploadPolicies) => {
  const policy = uploadPolicies[policyName];

  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const file of collectUploadedFiles(req)) {
      if (!policy.allowedMimeTypes.includes(file.mimetype)) {
        return next(new AppError(`Unsupported file format. ${policy.description}`, 400));
      }

      if (file.size > policy.maxSizeBytes) {
        return next(new AppError(`File size exceeds policy limit. ${policy.description}`, 400));
      }
    }

    next();
  };
};

const eicarTestSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!';

export const scanUploadedFiles = (req: Request, _res: Response, next: NextFunction): void => {
  for (const file of collectUploadedFiles(req)) {
    // Extension point for ClamAV or a cloud malware scanner. The EICAR check keeps the hook testable.
    if (file.buffer.includes(eicarTestSignature)) {
      return next(new AppError(translate('uploads.malware_detected', req.language), 400));
    }
  }

  next();
};

const jsonUpload = multer({
  storage,
  limits: {
    fileSize: uploadPolicies.languageJson.maxSizeBytes,
  },
  fileFilter: jsonFileFilter,
});

export const uploadJsonSingle = (fieldName: string) => jsonUpload.single(fieldName);
