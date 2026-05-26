import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { translate } from '../../config/i18n.config';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { withTransaction } from '../../database/transaction';
import { AuditLog } from '../audit/audit-log.model';
import { ClientFinancialMovement } from '../admin-clients/client-financial-movement.model';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { SettingsPaymentGateway } from '../settings-payment-gateways/settings-payment-gateway.model';
import { Upload } from '../uploads/upload.model';
import { User } from '../users/user.model';
import { PaymentRequest } from './payment-request.model';

type SubmittedInput = { key: string; value?: string };

const uploadPaymentProof = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder: 'payment-requests' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveProofUpload = async (ownerId: string, file: Express.Multer.File, session: ClientSession) => {
  const uploadResult = await uploadPaymentProof(file);
  const uploadDoc = new Upload({
    ownerId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    size: uploadResult.bytes,
    provider: 'cloudinary',
    resourceType: uploadResult.resource_type,
    tags: ['payment-request-proof'],
  });
  await uploadDoc.save({ session });
  return {
    uploadId: uploadDoc._id as mongoose.Types.ObjectId,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  };
};

const calculateAmounts = (amount: number, gateway: any, currency: any) => {
  const taxAmount = gateway.taxType === 'PERCENT' ? amount * (gateway.taxValue / 100) : gateway.taxValue;
  const payableAmount = amount + taxAmount;
  const creditedAmount = currency && !currency.isDollar ? amount / currency.price : amount;
  return {
    taxAmount: Number(taxAmount.toFixed(6)),
    payableAmount: Number(payableAmount.toFixed(6)),
    creditedAmount: Number(creditedAmount.toFixed(6)),
  };
};

const populatePaymentRequest = [
  { path: 'clientId', select: 'name email username phoneNumber countryFlag balance' },
  { path: 'paymentGatewayId', select: 'name kind image currencyId' },
  { path: 'currencyId', select: 'name shortName icon price isDollar' },
  { path: 'reviewedBy', select: 'name email' },
];

export class PaymentRequestService {
  static async listBanks() {
    return SettingsPaymentGateway.find({
      kind: 'BANK',
      isVisible: true,
      isDeleted: { $ne: true },
    })
      .select('-token -createdBy -updatedBy')
      .populate('currencyId', 'name shortName icon price isDollar')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async create(clientId: string, data: any, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return withTransaction(async (session: ClientSession) => {
      const gateway = await SettingsPaymentGateway.findOne({
        _id: data.paymentGatewayId,
        kind: 'BANK',
        isVisible: true,
        isDeleted: { $ne: true },
      }).session(session);
      if (!gateway) throw HttpError.notFound('paymentRequests.gateway_not_found');

      if (data.amount < gateway.minMoney || data.amount > gateway.maxMoney) {
        throw HttpError.badRequest('paymentRequests.amount_out_of_range');
      }
      if (gateway.requiresImage && !file) throw HttpError.badRequest('paymentRequests.proof_required');
      if (gateway.requiresSerialNumber && !data.serialNumber) throw HttpError.badRequest('paymentRequests.serial_required');

      const currency = gateway.currencyId
        ? await SettingsCurrency.findById(gateway.currencyId).session(session).lean()
        : null;
      const proofImage = file ? await saveProofUpload(clientId, file, session) : undefined;
      const submittedByKey = new Map((data.inputs || []).map((input: SubmittedInput) => [input.key, input.value]));
      const inputs: any[] = gateway.infoFields.map((field, index) => ({
        key: `info_${index}`,
        label: field.label,
        type: field.type,
        value: String(submittedByKey.get(`info_${index}`) || ''),
      }));
      if (gateway.requiresSerialNumber) {
        inputs.push({
          key: 'serialNumber',
          label: { en: 'Serial number', fr: 'Numéro de série', ar: 'الرقم التسلسلي' },
          type: 'SERIAL',
          value: data.serialNumber,
        });
      }

      const amounts = calculateAmounts(data.amount, gateway, currency);
      const request = new PaymentRequest({
        clientId: new mongoose.Types.ObjectId(clientId),
        paymentGatewayId: gateway._id,
        gatewayKind: gateway.kind,
        currencyId: gateway.currencyId,
        amount: data.amount,
        creditedAmount: amounts.creditedAmount,
        taxType: gateway.taxType,
        taxValue: gateway.taxValue,
        taxAmount: amounts.taxAmount,
        payableAmount: amounts.payableAmount,
        status: 'PENDING',
        serialNumber: data.serialNumber,
        clientComment: data.clientComment,
        inputs,
        proofImage,
      });
      await request.save({ session });

      await AuditLog.create([{
        actorId: new mongoose.Types.ObjectId(clientId),
        targetId: request._id,
        action: 'PAYMENT_REQUEST_CREATED',
        entity: 'PaymentRequest',
        ip,
        userAgent,
      }], { session });

      return request.populate(populatePaymentRequest);
    });
  }

  static async listForClient(clientId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = { clientId };
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      PaymentRequest.find(filter)
        .populate(populatePaymentRequest)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentRequest.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listForAdmin(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.gatewayKind) filter.gatewayKind = query.gatewayKind;
    if (query.paymentGatewayId) filter.paymentGatewayId = query.paymentGatewayId;
    if (query.clientId) filter.clientId = query.clientId;

    const search = typeof query.search === 'string' ? query.search.trim() : '';
    let clientIds: mongoose.Types.ObjectId[] | undefined;
    if (search) {
      const clients = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();
      clientIds = clients.map((client) => client._id as mongoose.Types.ObjectId);
      filter.clientId = { $in: clientIds };
    }

    const [data, total] = await Promise.all([
      PaymentRequest.find(filter)
        .populate(populatePaymentRequest)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentRequest.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async getForAdmin(id: string) {
    const request = await PaymentRequest.findById(id).populate(populatePaymentRequest).lean();
    if (!request) throw HttpError.notFound('paymentRequests.not_found');
    return request;
  }

  static async approve(id: string, actorId: string, adminComment?: string, ip?: string, userAgent?: string) {
    return withTransaction(async (session: ClientSession) => {
      const request = await PaymentRequest.findById(id).session(session);
      if (!request) throw HttpError.notFound('paymentRequests.not_found');
      if (request.status !== 'PENDING') throw HttpError.badRequest('paymentRequests.already_reviewed');

      const client = await User.findById(request.clientId).session(session);
      if (!client) throw HttpError.notFound('paymentRequests.client_not_found');

      const balanceBefore = client.balance || 0;
      const balanceAfter = balanceBefore + request.creditedAmount;
      client.balance = balanceAfter;
      await client.save({ session });

      request.status = 'APPROVED';
      request.adminComment = adminComment;
      request.reviewedBy = new mongoose.Types.ObjectId(actorId);
      request.reviewedAt = new Date();
      await request.save({ session });

      await ClientFinancialMovement.create([{
        clientId: client._id,
        type: 'DEPOSIT',
        amount: request.creditedAmount,
        paymentMethodId: request.paymentGatewayId,
        source: 'BANK',
        referenceId: request._id,
        referenceModel: 'PaymentRequest',
        originalAmount: request.amount,
        currencyId: request.currencyId,
        comment: adminComment || translate('paymentRequests.approved_movement_comment', 'en'),
        balanceBefore,
        balanceAfter,
        createdBy: new mongoose.Types.ObjectId(actorId),
      }], { session });

      await AuditLog.create([{
        actorId: new mongoose.Types.ObjectId(actorId),
        targetId: request._id,
        action: 'PAYMENT_REQUEST_APPROVED',
        entity: 'PaymentRequest',
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: client._id.toString(),
        type: 'payment_request_approved',
        title: translate('notifications.payment_request_approved_title', 'en'),
        message: translate('notifications.payment_request_approved_message', 'en'),
        data: {
          titleKey: 'notifications.paymentRequestApprovedTitle',
          messageKey: 'notifications.paymentRequestApprovedMessage',
        },
      }).catch(() => undefined);

      return request.populate(populatePaymentRequest);
    });
  }

  static async reject(id: string, actorId: string, adminComment?: string, ip?: string, userAgent?: string) {
    return withTransaction(async (session: ClientSession) => {
      const request = await PaymentRequest.findById(id).session(session);
      if (!request) throw HttpError.notFound('paymentRequests.not_found');
      if (request.status !== 'PENDING') throw HttpError.badRequest('paymentRequests.already_reviewed');

      request.status = 'REJECTED';
      request.adminComment = adminComment;
      request.reviewedBy = new mongoose.Types.ObjectId(actorId);
      request.reviewedAt = new Date();
      await request.save({ session });

      await AuditLog.create([{
        actorId: new mongoose.Types.ObjectId(actorId),
        targetId: request._id,
        action: 'PAYMENT_REQUEST_REJECTED',
        entity: 'PaymentRequest',
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: request.clientId.toString(),
        type: 'payment_request_rejected',
        title: translate('notifications.payment_request_rejected_title', 'en'),
        message: translate('notifications.payment_request_rejected_message', 'en'),
        data: {
          titleKey: 'notifications.paymentRequestRejectedTitle',
          messageKey: 'notifications.paymentRequestRejectedMessage',
        },
      }).catch(() => undefined);

      return request.populate(populatePaymentRequest);
    });
  }
}
