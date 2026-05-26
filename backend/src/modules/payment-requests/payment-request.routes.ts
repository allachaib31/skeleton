import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { uploadFields, validateImageFileSignature, validateUploadPolicy, scanUploadedFiles } from '../../middlewares/upload.middleware';
import { uploadRateLimit } from '../../middlewares/rateLimit.middleware';
import { PaymentRequestController } from './payment-request.controller';
import { createPaymentRequestSchema, paymentRequestQuerySchema, reviewPaymentRequestSchema } from './payment-request.validator';

export const paymentRequestRoutes = Router();
paymentRequestRoutes.use(authenticate);

paymentRequestRoutes.get('/banks', asyncHandler(PaymentRequestController.listBanks));
paymentRequestRoutes.get('/', validate(paymentRequestQuerySchema, 'query'), asyncHandler(PaymentRequestController.listMine));
paymentRequestRoutes.post(
  '/',
  uploadRateLimit,
  uploadFields([{ name: 'proofImage', maxCount: 1 }]),
  validateUploadPolicy('serviceImage'),
  validateImageFileSignature,
  scanUploadedFiles,
  validate(createPaymentRequestSchema),
  asyncHandler(PaymentRequestController.create)
);

export const adminPaymentRequestRoutes = Router();
adminPaymentRequestRoutes.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

adminPaymentRequestRoutes.get('/', validate(paymentRequestQuerySchema, 'query'), asyncHandler(PaymentRequestController.listAdmin));
adminPaymentRequestRoutes.get('/:id', asyncHandler(PaymentRequestController.getAdmin));
adminPaymentRequestRoutes.patch('/:id/approve', validate(reviewPaymentRequestSchema), asyncHandler(PaymentRequestController.approve));
adminPaymentRequestRoutes.patch('/:id/reject', validate(reviewPaymentRequestSchema), asyncHandler(PaymentRequestController.reject));
