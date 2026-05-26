import mongoose, { ClientSession } from 'mongoose';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { AuditLog } from '../audit/audit-log.model';
import { ApiGroup } from '../settings-apis/settings-api.model';
import { LocalizedText } from '../stock-services/stock-service.model';
import { RequirementInputType, StockProductRequirement } from './stock-product-requirement.model';

interface RequirementInput {
  paramsName: string;
  message: LocalizedText;
  description: LocalizedText;
  apiGroup: ApiGroup;
  inputType: RequirementInputType;
  defaultValue?: string;
  isRequired: boolean;
  isDeleted: boolean;
}

type UpdateRequirementInput = Partial<RequirementInput>;

export class StockProductRequirementService {
  static async list(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, any> = {};

    if (query.search) {
      const search = new RegExp(query.search, 'i');
      filter.$or = [
        { paramsName: search },
        { 'message.en': search },
        { 'message.fr': search },
        { 'message.ar': search },
      ];
    }
    if (query.apiGroup) filter.apiGroup = query.apiGroup;
    if (typeof query.isDeleted === 'boolean') filter.isDeleted = query.isDeleted;

    const [requirements, total] = await Promise.all([
      StockProductRequirement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      StockProductRequirement.countDocuments(filter),
    ]);

    return { data: requirements, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: RequirementInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const requirement = new StockProductRequirement({
        ...data,
        defaultValue: data.defaultValue || undefined,
        createdBy: actorId,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await requirement.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: requirement._id,
        action: 'STOCK_PRODUCT_REQUIREMENT_CREATED',
        entity: 'StockProductRequirement',
        after: requirement.toObject(),
        ip,
        userAgent,
      }], { session });

      return requirement;
    });
  }

  static async update(requirementId: string, data: UpdateRequirementInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const requirement = await StockProductRequirement.findById(requirementId).session(session);
      if (!requirement) throw HttpError.notFound('stockProductRequirements.not_found');

      const before = requirement.toObject();

      if (data.paramsName !== undefined) requirement.paramsName = data.paramsName;
      if (data.message) requirement.message = data.message;
      if (data.description) requirement.description = data.description;
      if (data.apiGroup) requirement.apiGroup = data.apiGroup;
      if (data.inputType) requirement.inputType = data.inputType;
      if (data.defaultValue !== undefined) requirement.defaultValue = data.defaultValue || undefined;
      if (typeof data.isRequired === 'boolean') requirement.isRequired = data.isRequired;
      if (typeof data.isDeleted === 'boolean') {
        requirement.isDeleted = data.isDeleted;
        requirement.deletedAt = data.isDeleted ? requirement.deletedAt ?? new Date() : undefined;
      }
      requirement.updatedBy = new mongoose.Types.ObjectId(actorId);

      await requirement.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: requirement._id,
        action: 'STOCK_PRODUCT_REQUIREMENT_UPDATED',
        entity: 'StockProductRequirement',
        before,
        after: requirement.toObject(),
        ip,
        userAgent,
      }], { session });

      return requirement;
    });
  }
}
