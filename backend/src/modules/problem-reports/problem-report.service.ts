import mongoose, { ClientSession } from 'mongoose';
import { randomUUID } from 'crypto';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { withTransaction } from '../../database/transaction';
import { AuditLog } from '../audit/audit-log.model';
import { NotificationsService } from '../notifications/notifications.service';
import { Order } from '../orders/order.model';
import { PaymentRequest } from '../payment-requests/payment-request.model';
import { Role } from '../roles/role.model';
import { User } from '../users/user.model';
import {
  IProblemReport,
  ProblemReport,
  ProblemReportMessage,
  ProblemReportPriority,
  ProblemReportStatus,
} from './problem-report.model';

const reportPopulate = [
  { path: 'clientId', select: 'name email username phoneNumber countryFlag balance openCredit' },
  { path: 'assignedAdminId', select: 'name email username' },
  { path: 'relatedOrderId', select: 'orderNumber productName status totalPrice createdAt' },
  { path: 'relatedPaymentRequestId', select: 'amount payableAmount creditedAmount status createdAt' },
  { path: 'relatedProductId', select: 'name image fulfillmentType apiGroup' },
  { path: 'relatedServiceId', select: 'name type image' },
  { path: 'relatedCategoryId', select: 'name serviceId image' },
];

const messagePopulate = [
  { path: 'senderId', select: 'name email username avatar role' },
];

const toObjectId = (value?: string) => value ? new mongoose.Types.ObjectId(value) : undefined;
const createReportNumber = () => `PR-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

const notifyAdmins = async (payload: { titleKey: string; messageKey: string; reportId: string; reportNumber: string }) => {
  const roles = await Role.find({ name: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
  const admins = roles.length
    ? await User.find({ role: { $in: roles.map((role) => role._id) }, isDeleted: { $ne: true } }).select('_id').lean()
    : [];

  await Promise.all(admins.map((admin) => NotificationsService.createNotification({
    userId: String(admin._id),
    type: 'problem_report',
    title: payload.titleKey,
    message: payload.messageKey,
    data: {
      titleKey: payload.titleKey,
      messageKey: payload.messageKey,
      reportId: payload.reportId,
      reportNumber: payload.reportNumber,
    },
  }).catch(() => undefined)));
};

export class ProblemReportService {
  static async listForClient(clientId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter = this.buildListFilter({ ...query, clientId });

    const [data, total] = await Promise.all([
      ProblemReport.find(filter).populate(reportPopulate).sort({ lastMessageAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProblemReport.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listForAdmin(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter = this.buildListFilter(query);

    const [data, total] = await Promise.all([
      ProblemReport.find(filter).populate(reportPopulate).sort({ lastMessageAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProblemReport.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async createForClient(clientId: string, data: any, ip?: string, userAgent?: string) {
    await this.verifyClientRelations(clientId, data);

    const report = await withTransaction(async (session: ClientSession) => {
      const created = new ProblemReport({
        reportNumber: createReportNumber(),
        clientId: toObjectId(clientId),
        type: data.type,
        status: 'WAITING_ADMIN',
        priority: data.priority || 'NORMAL',
        subject: data.subject,
        description: data.description,
        relatedOrderId: toObjectId(data.relatedOrderId),
        relatedPaymentRequestId: toObjectId(data.relatedPaymentRequestId),
        relatedFinancialMovementId: toObjectId(data.relatedFinancialMovementId),
        relatedProductId: toObjectId(data.relatedProductId),
        relatedServiceId: toObjectId(data.relatedServiceId),
        relatedCategoryId: toObjectId(data.relatedCategoryId),
        lastMessageAt: new Date(),
        lastMessageBy: toObjectId(clientId),
        createdBy: toObjectId(clientId),
      });
      await created.save({ session });

      const message = new ProblemReportMessage({
        reportId: created._id,
        senderId: toObjectId(clientId),
        senderRole: 'CLIENT',
        message: data.description,
        isInternal: false,
        readByClientAt: new Date(),
      });
      await message.save({ session });

      await AuditLog.create([{ actorId: toObjectId(clientId), targetId: created._id, action: 'PROBLEM_REPORT_CREATED', entity: 'ProblemReport', after: created.toObject(), ip, userAgent }], { session });
      return created.toObject();
    });

    await notifyAdmins({
      titleKey: 'notifications.problemReportCreatedTitle',
      messageKey: 'notifications.problemReportCreatedMessage',
      reportId: String(report._id),
      reportNumber: report.reportNumber,
    });

    return this.getForClient(String(report._id), clientId);
  }

  static async getForClient(id: string, clientId: string) {
    const report = await ProblemReport.findOne({ _id: id, clientId, isDeleted: { $ne: true } }).populate(reportPopulate).lean();
    if (!report) throw HttpError.notFound('problemReports.not_found');
    const messages = await ProblemReportMessage.find({ reportId: id, isInternal: false }).populate(messagePopulate).sort({ createdAt: 1 }).lean();
    return { report, messages };
  }

  static async getForAdmin(id: string) {
    const report = await ProblemReport.findOne({ _id: id, isDeleted: { $ne: true } }).populate(reportPopulate).lean();
    if (!report) throw HttpError.notFound('problemReports.not_found');
    const messages = await ProblemReportMessage.find({ reportId: id }).populate(messagePopulate).sort({ createdAt: 1 }).lean();
    return { report, messages };
  }

  static async addClientMessage(id: string, clientId: string, message: string, ip?: string, userAgent?: string) {
    const report = await ProblemReport.findOne({ _id: id, clientId, isDeleted: { $ne: true } });
    if (!report) throw HttpError.notFound('problemReports.not_found');
    if (['CLOSED', 'REJECTED'].includes(report.status)) throw HttpError.badRequest('problemReports.closed_for_messages');

    await this.addMessage(report, clientId, 'CLIENT', message, false, 'WAITING_ADMIN', ip, userAgent);
    await notifyAdmins({
      titleKey: 'notifications.problemReportClientReplyTitle',
      messageKey: 'notifications.problemReportClientReplyMessage',
      reportId: String(report._id),
      reportNumber: report.reportNumber,
    });
    return this.getForClient(id, clientId);
  }

  static async addAdminMessage(id: string, actorId: string, data: { message: string; isInternal?: boolean }, ip?: string, userAgent?: string) {
    const report = await ProblemReport.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!report) throw HttpError.notFound('problemReports.not_found');
    if (['CLOSED', 'REJECTED'].includes(report.status)) throw HttpError.badRequest('problemReports.closed_for_messages');

    await this.addMessage(report, actorId, 'ADMIN', data.message, Boolean(data.isInternal), data.isInternal ? report.status : 'WAITING_CLIENT', ip, userAgent);
    if (!data.isInternal) {
      await NotificationsService.createNotification({
        userId: String(report.clientId),
        type: 'problem_report',
        title: 'notifications.problemReportAdminReplyTitle',
        message: 'notifications.problemReportAdminReplyMessage',
        data: {
          titleKey: 'notifications.problemReportAdminReplyTitle',
          messageKey: 'notifications.problemReportAdminReplyMessage',
          reportId: String(report._id),
          reportNumber: report.reportNumber,
        },
      }).catch(() => undefined);
    }
    return this.getForAdmin(id);
  }

  static async assign(id: string, actorId: string, assignedAdminId?: string, ip?: string, userAgent?: string) {
    return this.updateReport(id, actorId, { assignedAdminId: assignedAdminId ? toObjectId(assignedAdminId) : undefined }, 'PROBLEM_REPORT_ASSIGNED', ip, userAgent);
  }

  static async updateStatus(id: string, actorId: string, status: ProblemReportStatus, resolutionNote?: string, ip?: string, userAgent?: string) {
    const patch: Partial<IProblemReport> = { status, resolutionNote, updatedBy: toObjectId(actorId) } as Partial<IProblemReport>;
    if (status === 'RESOLVED') patch.resolvedAt = new Date();
    if (status === 'CLOSED') patch.closedAt = new Date();
    const result = await this.updateReport(id, actorId, patch, 'PROBLEM_REPORT_STATUS_UPDATED', ip, userAgent);
    await NotificationsService.createNotification({
      userId: String(result.report.clientId && typeof result.report.clientId === 'object' ? (result.report.clientId as any)._id : result.report.clientId),
      type: 'problem_report',
      title: 'notifications.problemReportStatusUpdatedTitle',
      message: 'notifications.problemReportStatusUpdatedMessage',
      data: { titleKey: 'notifications.problemReportStatusUpdatedTitle', messageKey: 'notifications.problemReportStatusUpdatedMessage', reportId: id },
    }).catch(() => undefined);
    return result;
  }

  static async updatePriority(id: string, actorId: string, priority: ProblemReportPriority, ip?: string, userAgent?: string) {
    return this.updateReport(id, actorId, { priority, updatedBy: toObjectId(actorId) } as Partial<IProblemReport>, 'PROBLEM_REPORT_PRIORITY_UPDATED', ip, userAgent);
  }

  static async closeForClient(id: string, clientId: string, ip?: string, userAgent?: string) {
    const report = await ProblemReport.findOne({ _id: id, clientId, isDeleted: { $ne: true } });
    if (!report) throw HttpError.notFound('problemReports.not_found');
    const before = report.toObject();
    report.status = 'CLOSED';
    report.closedAt = new Date();
    report.updatedBy = toObjectId(clientId);
    await report.save();
    await AuditLog.create({ actorId: toObjectId(clientId), targetId: report._id, action: 'PROBLEM_REPORT_CLOSED', entity: 'ProblemReport', before, after: report.toObject(), ip, userAgent });
    return this.getForClient(id, clientId);
  }

  private static buildListFilter(query: Record<string, unknown>) {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (query.clientId) filter.clientId = query.clientId;
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedAdminId) filter.assignedAdminId = query.assignedAdminId;
    if (query.relatedOrderId) filter.relatedOrderId = query.relatedOrderId;
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    if (search) {
      filter.$or = [
        { reportNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    return filter;
  }

  private static async verifyClientRelations(clientId: string, data: any) {
    if (data.relatedOrderId) {
      const order = await Order.findOne({ _id: data.relatedOrderId, clientId }).select('_id').lean();
      if (!order) throw HttpError.forbidden('problemReports.related_order_forbidden');
    }
    if (data.relatedPaymentRequestId) {
      const payment = await PaymentRequest.findOne({ _id: data.relatedPaymentRequestId, clientId }).select('_id').lean();
      if (!payment) throw HttpError.forbidden('problemReports.related_payment_forbidden');
    }
  }

  private static async addMessage(report: IProblemReport, senderId: string, senderRole: 'CLIENT' | 'ADMIN', message: string, isInternal: boolean, nextStatus: ProblemReportStatus, ip?: string, userAgent?: string) {
    await withTransaction(async (session) => {
      const before = report.toObject();
      const created = new ProblemReportMessage({
        reportId: report._id,
        senderId: toObjectId(senderId),
        senderRole,
        message,
        isInternal,
        readByClientAt: senderRole === 'CLIENT' ? new Date() : undefined,
        readByAdminAt: senderRole === 'ADMIN' ? new Date() : undefined,
      });
      await created.save({ session });
      report.lastMessageAt = new Date();
      report.lastMessageBy = toObjectId(senderId);
      report.status = nextStatus;
      report.updatedBy = toObjectId(senderId);
      await report.save({ session });
      await AuditLog.create([{ actorId: toObjectId(senderId), targetId: report._id, action: isInternal ? 'PROBLEM_REPORT_INTERNAL_NOTE_CREATED' : 'PROBLEM_REPORT_MESSAGE_CREATED', entity: 'ProblemReport', before, after: report.toObject(), ip, userAgent }], { session });
    });
  }

  private static async updateReport(id: string, actorId: string, patch: Partial<IProblemReport>, action: string, ip?: string, userAgent?: string) {
    const report = await ProblemReport.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!report) throw HttpError.notFound('problemReports.not_found');
    const before = report.toObject();
    Object.assign(report, patch, { updatedBy: toObjectId(actorId) });
    await report.save();
    await AuditLog.create({ actorId: toObjectId(actorId), targetId: report._id, action, entity: 'ProblemReport', before, after: report.toObject(), ip, userAgent });
    return this.getForAdmin(id);
  }
}
