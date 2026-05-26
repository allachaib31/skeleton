import crypto from 'crypto';
import mongoose, { ClientSession } from 'mongoose';
import { env } from '../../config/env.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { redisDel } from '../../config/redis.config';
import { translate } from '../../config/i18n.config';
import { AuditLog } from '../audit/audit-log.model';
import { ClientFinancialMovement } from '../admin-clients/client-financial-movement.model';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { User } from '../users/user.model';
import { PaymentCode } from './payment-code.model';
import { PaymentCodeJournal, PaymentCodeJournalReason, PaymentCodeJournalStatus } from './payment-code-journal.model';

type PaymentCodeInput = {
  code?: string;
  value: number;
  currencyId: string;
  expiresAt?: string;
  notes?: string;
};

type GenerateInput = Omit<PaymentCodeInput, 'code'> & {
  prefix?: string;
  count: number;
};

type ImportInput = Omit<PaymentCodeInput, 'code'> & {
  codes: string;
};

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

const codeHash = (code: string) =>
  crypto.createHmac('sha256', env.COOKIE_SECRET).update(normalizeCode(code)).digest('hex');

const randomSegment = (length: number) => {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

const generateCode = (prefix?: string) => {
  const body = `${randomSegment(6)}-${randomSegment(6)}-${randomSegment(6)}-${randomSegment(6)}`;
  return prefix ? `${prefix.toUpperCase()}-${body}` : body;
};

const codeMeta = (code: string) => {
  const normalized = normalizeCode(code);
  const firstDash = normalized.indexOf('-');
  return {
    normalized,
    hash: codeHash(normalized),
    codePrefix: firstDash > 0 ? normalized.slice(0, firstDash) : undefined,
    codeLast4: normalized.slice(-4),
  };
};

const convertToBalanceAmount = (value: number, currency: { isDollar: boolean; price: number }) =>
  currency.isDollar ? value : value / currency.price;

const writeJournal = async (
  data: {
    clientId?: string;
    paymentCodeId?: mongoose.Types.ObjectId;
    hash: string;
    codePrefix?: string;
    codeLast4?: string;
    status: PaymentCodeJournalStatus;
    reason: PaymentCodeJournalReason;
    ip?: string;
    userAgent?: string;
  },
  session?: ClientSession
) => {
  await PaymentCodeJournal.create([{
    clientId: data.clientId,
    paymentCodeId: data.paymentCodeId,
    codeHash: data.hash,
    codePrefix: data.codePrefix,
    codeLast4: data.codeLast4,
    status: data.status,
    reason: data.reason,
    ip: data.ip,
    userAgent: data.userAgent,
  }], session ? { session } : undefined);
};

export class PaymentCodeService {
  static async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {
      isDeleted: typeof query.isDeleted === 'boolean' ? query.isDeleted : query.isDeleted === 'true',
    };
    if (query.search) {
      const search = (query.search as string).toUpperCase();
      filter.$or = [{ codePrefix: { $regex: search, $options: 'i' } }, { codeLast4: { $regex: search, $options: 'i' } }];
    }
    if (query.currencyId) filter.currencyId = query.currencyId;
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      PaymentCode.find(filter)
        .populate('currencyId', 'name shortName isDollar price')
        .populate('usedByClientId', 'name email username')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentCode.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listJournal(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    if (query.clientId) filter.clientId = query.clientId;
    if (query.status) filter.status = query.status;
    if (query.reason) filter.reason = query.reason;
    const [data, total] = await Promise.all([
      PaymentCodeJournal.find(filter)
        .populate('clientId', 'name email username')
        .populate('paymentCodeId', 'codePrefix codeLast4 value status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentCodeJournal.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: PaymentCodeInput, actorId: string, ip?: string, userAgent?: string) {
    const plainCode = data.code ? normalizeCode(data.code) : generateCode();
    const created = await this.createMany([{ ...data, code: plainCode }], actorId, ip, userAgent);
    return { paymentCode: created.paymentCodes[0], plainCode };
  }

  static async generate(data: GenerateInput, actorId: string, ip?: string, userAgent?: string) {
    const prefix = data.prefix ? normalizeCode(data.prefix).replace(/-/g, '') : undefined;
    const inputs = Array.from({ length: data.count }, () => ({ ...data, code: generateCode(prefix) }));
    const created = await this.createMany(inputs, actorId, ip, userAgent);
    return { count: created.paymentCodes.length, plainCodes: inputs.map((input) => input.code) };
  }

  static async import(data: ImportInput, actorId: string, ip?: string, userAgent?: string) {
    const inputs = data.codes
      .split(/\r?\n/)
      .map((code) => normalizeCode(code))
      .filter(Boolean)
      .map((code) => ({ ...data, code }));
    if (!inputs.length) throw HttpError.badRequest('paymentCodes.no_codes');
    const created = await this.createMany(inputs, actorId, ip, userAgent);
    return { importedCount: created.paymentCodes.length };
  }

  private static async createMany(inputs: Array<PaymentCodeInput & { code: string }>, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const currency = await SettingsCurrency.findOne({ _id: inputs[0].currencyId, isDeleted: false }).session(session);
      if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

      const docs = inputs.map((input) => {
        const meta = codeMeta(input.code);
        return {
          codeHash: meta.hash,
          codePrefix: meta.codePrefix,
          codeLast4: meta.codeLast4,
          value: input.value,
          currencyId: input.currencyId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          notes: input.notes || undefined,
          status: 'AVAILABLE',
          createdBy: actorId,
        };
      });
      const hashes = docs.map((doc) => doc.codeHash);
      const exists = await PaymentCode.exists({ codeHash: { $in: hashes }, isDeleted: false }).session(session);
      if (exists) throw HttpError.conflict('paymentCodes.code_exists');

      const paymentCodes = await PaymentCode.insertMany(docs, { session });
      await AuditLog.create([{
        actorId,
        action: 'PAYMENT_CODES_CREATED',
        entity: 'PaymentCode',
        after: { count: paymentCodes.length, value: inputs[0].value, currencyId: inputs[0].currencyId },
        ip,
        userAgent,
      }], { session });
      return { paymentCodes };
    });
  }

  static async update(id: string, data: { status?: string; expiresAt?: string; notes?: string; isDeleted?: boolean }, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session) => {
      const paymentCode = await PaymentCode.findById(id).select('+codeHash').session(session);
      if (!paymentCode) throw HttpError.notFound('paymentCodes.not_found');
      if (paymentCode.status === 'USED' && data.status && data.status !== 'USED') throw HttpError.badRequest('paymentCodes.used_code_locked');
      const before = paymentCode.toObject();
      if (data.status) paymentCode.status = data.status as any;
      if (data.expiresAt !== undefined) paymentCode.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
      if (data.notes !== undefined) paymentCode.notes = data.notes || undefined;
      if (typeof data.isDeleted === 'boolean') {
        paymentCode.isDeleted = data.isDeleted;
        paymentCode.deletedAt = data.isDeleted ? paymentCode.deletedAt ?? new Date() : undefined;
      }
      paymentCode.updatedBy = new mongoose.Types.ObjectId(actorId);
      await paymentCode.save({ session });
      await AuditLog.create([{ actorId, targetId: paymentCode._id, action: 'PAYMENT_CODE_UPDATED', entity: 'PaymentCode', before, after: paymentCode.toObject(), ip, userAgent }], { session });
      return paymentCode.toObject();
    });
  }

  static async redeem(clientId: string, code: string, ip?: string, userAgent?: string) {
    const meta = codeMeta(code);
    return await withTransaction(async (session) => {
      const client = await User.findOne({ _id: clientId, isDeleted: { $ne: true } }).session(session);
      if (!client) {
        await writeJournal({ clientId, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'CLIENT_NOT_FOUND', ip, userAgent });
        throw HttpError.notFound('users.user_not_found');
      }

      const now = new Date();
      const paymentCode = await PaymentCode.findOneAndUpdate(
        {
          codeHash: meta.hash,
          isDeleted: { $ne: true },
          status: 'AVAILABLE',
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        {
          $set: {
            status: 'USED',
            usedByClientId: client._id,
            usedAt: now,
          },
        },
        { returnDocument: 'after', session }
      ).select('+codeHash');

      if (!paymentCode) {
        const existingCode = await PaymentCode.findOne({ codeHash: meta.hash }).select('+codeHash').lean();
        if (!existingCode) {
          await writeJournal({ clientId, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'NOT_FOUND', ip, userAgent });
          throw HttpError.badRequest('paymentCodes.invalid_redeem');
        }
        if (existingCode.isDeleted) {
          await writeJournal({ clientId, paymentCodeId: existingCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'DELETED', ip, userAgent });
          throw HttpError.badRequest('paymentCodes.invalid_redeem');
        }
        if (existingCode.status === 'USED') {
          await writeJournal({ clientId, paymentCodeId: existingCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'USED', ip, userAgent });
          throw HttpError.badRequest('paymentCodes.invalid_redeem');
        }
        if (existingCode.status === 'DISABLED') {
          await writeJournal({ clientId, paymentCodeId: existingCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'DISABLED', ip, userAgent });
          throw HttpError.badRequest('paymentCodes.invalid_redeem');
        }
        if (existingCode.status === 'EXPIRED' || (existingCode.expiresAt && existingCode.expiresAt.getTime() < now.getTime())) {
          await PaymentCode.updateOne({ _id: existingCode._id, status: 'AVAILABLE' }, { $set: { status: 'EXPIRED' } });
          await writeJournal({ clientId, paymentCodeId: existingCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'EXPIRED', ip, userAgent });
          throw HttpError.badRequest('paymentCodes.invalid_redeem');
        }
        await writeJournal({ clientId, paymentCodeId: existingCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'FAILED', reason: 'USED', ip, userAgent });
        throw HttpError.badRequest('paymentCodes.invalid_redeem');
      }

      const currency = await SettingsCurrency.findById(paymentCode.currencyId).session(session);
      if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');
      const amount = convertToBalanceAmount(paymentCode.value, currency);
      const balanceBefore = client.balance ?? 0;
      client.balance = balanceBefore + amount;
      await client.save({ session });

      const movement = new ClientFinancialMovement({
        clientId: client._id,
        type: 'DEPOSIT',
        amount,
        source: 'PAYMENT_CODE',
        referenceId: paymentCode._id,
        referenceModel: 'PaymentCode',
        originalAmount: paymentCode.value,
        currencyId: paymentCode.currencyId,
        comment: `payment-code:${paymentCode.codeLast4}`,
        balanceBefore,
        balanceAfter: client.balance,
        createdBy: client._id,
      });
      await movement.save({ session });

      paymentCode.usedMovementId = movement._id as mongoose.Types.ObjectId;
      await paymentCode.save({ session });

      await writeJournal({ clientId, paymentCodeId: paymentCode._id, hash: meta.hash, codePrefix: meta.codePrefix, codeLast4: meta.codeLast4, status: 'SUCCESS', reason: 'REDEEMED', ip, userAgent }, session);
      await AuditLog.create([{ actorId: client._id, targetId: paymentCode._id, action: 'PAYMENT_CODE_REDEEMED', entity: 'PaymentCode', after: { amount, movementId: movement._id }, ip, userAgent }], { session });
      await redisDel(`user:${clientId}`);

      await NotificationsService.createNotification({
        userId: clientId,
        type: 'payment_code_redeemed',
        title: translate('notifications.payment_code_redeemed_title', 'en'),
        message: translate('notifications.payment_code_redeemed_message', 'en'),
        data: {
          titleKey: 'notifications.paymentCodeRedeemedTitle',
          messageKey: 'notifications.paymentCodeRedeemedMessage',
          amount,
        },
      }).catch(() => undefined);

      return { amount, balance: client.balance };
    });
  }
}
