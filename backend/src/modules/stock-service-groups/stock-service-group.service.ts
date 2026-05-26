import mongoose, { ClientSession } from 'mongoose';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { AuditLog } from '../audit/audit-log.model';
import { Role } from '../roles/role.model';
import { StockService } from '../stock-services/stock-service.model';
import { User } from '../users/user.model';
import { UserLevelGroupe } from '../admin-clients/user-level-groupe.model';
import { ServiceGroupPricingType, StockServiceGroup } from './stock-service-group.model';

interface StockServiceGroupInput {
  name: string;
  serviceId: string;
  pricingType: ServiceGroupPricingType;
  value: number;
  negativeValue: number;
  percentAgent: number;
  entitlementValue: number;
  isDefault: boolean;
  isDeleted: boolean;
}

type UpdateStockServiceGroupInput = Partial<StockServiceGroupInput>;

const syncClientLevelsForCreatedGroup = async (
  group: InstanceType<typeof StockServiceGroup>,
  actorId: string,
  session: ClientSession,
  ip?: string,
  userAgent?: string
) => {
  if (group.isDeleted) return { created: 0, upgraded: 0 };

  const clientRole = await Role.findOne({ name: 'USER' }).select('_id').session(session).lean();
  const clientFilter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (clientRole) clientFilter.role = clientRole._id;

  const clients = await User.find(clientFilter).select('_id').session(session).lean();
  if (!clients.length) return { created: 0, upgraded: 0 };

  const clientIds = clients.map((client) => client._id as mongoose.Types.ObjectId);
  const [levels, baselineGroup] = await Promise.all([
    UserLevelGroupe.find({ clientId: { $in: clientIds }, serviceId: group.serviceId }).session(session),
    StockServiceGroup.findOne({ serviceId: group.serviceId, isDeleted: { $ne: true } })
      .sort({ isDefault: -1, entitlementValue: 1, createdAt: 1 })
      .session(session),
  ]);

  const levelsByClient = new Map(levels.map((level) => [level.clientId.toString(), level]));
  const currentGroupIds = Array.from(new Set(levels.map((level) => level.groupId.toString())));
  const currentGroups = currentGroupIds.length
    ? await StockServiceGroup.find({ _id: { $in: currentGroupIds } }).select('_id entitlementValue isDeleted').session(session).lean()
    : [];
  const currentGroupsById = new Map(currentGroups.map((item) => [item._id.toString(), item]));
  const rowsToCreate: Array<{ clientId: mongoose.Types.ObjectId; serviceId: mongoose.Types.ObjectId; groupId: mongoose.Types.ObjectId; points: number }> = [];
  const auditLogs: Record<string, unknown>[] = [];
  let upgraded = 0;

  for (const client of clients) {
    const clientId = client._id.toString();
    const level = levelsByClient.get(clientId);

    if (!level) {
      rowsToCreate.push({
        clientId: client._id as mongoose.Types.ObjectId,
        serviceId: group.serviceId,
        groupId: (baselineGroup?._id || group._id) as mongoose.Types.ObjectId,
        points: 0,
      });
      continue;
    }

    const currentGroup = currentGroupsById.get(level.groupId.toString());
    const shouldUpgrade = level.points >= group.entitlementValue && (
      !currentGroup ||
      currentGroup.isDeleted === true ||
      currentGroup.entitlementValue < group.entitlementValue
    );

    if (shouldUpgrade) {
      const before = level.toObject();
      level.groupId = group._id as mongoose.Types.ObjectId;
      await level.save({ session });
      upgraded += 1;
      auditLogs.push({
        actorId,
        targetId: level._id,
        action: 'ADMIN_CLIENT_LEVEL_AUTO_UPGRADED',
        entity: 'UserLevelGroupe',
        before,
        after: level.toObject(),
        ip,
        userAgent,
      });
    }
  }

  if (rowsToCreate.length) {
    const createdRows = await UserLevelGroupe.insertMany(rowsToCreate, { session });
    auditLogs.push(...createdRows.map((row) => ({
      actorId,
      targetId: row._id,
      action: 'ADMIN_CLIENT_LEVEL_CREATED_FOR_SERVICE_GROUP',
      entity: 'UserLevelGroupe',
      after: row.toObject(),
      ip,
      userAgent,
    })));
  }

  if (auditLogs.length) await AuditLog.create(auditLogs, { session });
  return { created: rowsToCreate.length, upgraded };
};

export class StockServiceGroupService {
  static async list(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.serviceId) filter.serviceId = query.serviceId;
    if (typeof query.isDeleted === 'boolean') filter.isDeleted = query.isDeleted;

    const [groups, total] = await Promise.all([
      StockServiceGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('serviceId', 'name type')
        .populate('createdBy', 'name email')
        .lean(),
      StockServiceGroup.countDocuments(filter),
    ]);

    return { data: groups, meta: buildPaginationMeta(total, page, limit) };
  }

  static async create(data: StockServiceGroupInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const service = await StockService.findById(data.serviceId).session(session);
      if (!service) throw HttpError.notFound('stockServices.not_found');

      if (data.isDefault) {
        await StockServiceGroup.updateMany(
          { serviceId: data.serviceId, isDefault: true },
          { $set: { isDefault: false, updatedBy: new mongoose.Types.ObjectId(actorId) } },
          { session }
        );
      }

      const group = new StockServiceGroup({
        ...data,
        serviceId: new mongoose.Types.ObjectId(data.serviceId),
        createdBy: actorId,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await group.save({ session });
      const levelSync = await syncClientLevelsForCreatedGroup(group, actorId, session, ip, userAgent);

      await AuditLog.create([{
        actorId,
        targetId: group._id,
        action: 'STOCK_SERVICE_GROUP_CREATED',
        entity: 'StockServiceGroup',
        after: { ...group.toObject(), levelSync },
        ip,
        userAgent,
      }], { session });

      return group;
    });
  }

  static async update(groupId: string, data: UpdateStockServiceGroupInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const group = await StockServiceGroup.findById(groupId).session(session);
      if (!group) throw HttpError.notFound('stockServiceGroups.not_found');

      const before = group.toObject();
      const nextServiceId = data.serviceId ?? group.serviceId.toString();

      if (data.serviceId) {
        const service = await StockService.findById(data.serviceId).session(session);
        if (!service) throw HttpError.notFound('stockServices.not_found');
        group.serviceId = new mongoose.Types.ObjectId(data.serviceId);
      }

      if (data.isDefault) {
        await StockServiceGroup.updateMany(
          { _id: { $ne: group._id }, serviceId: nextServiceId, isDefault: true },
          { $set: { isDefault: false, updatedBy: new mongoose.Types.ObjectId(actorId) } },
          { session }
        );
      }

      if (data.name !== undefined) group.name = data.name;
      if (data.pricingType !== undefined) group.pricingType = data.pricingType;
      if (data.value !== undefined) group.value = data.value;
      if (data.negativeValue !== undefined) group.negativeValue = data.negativeValue;
      if (data.percentAgent !== undefined) group.percentAgent = data.percentAgent;
      if (data.entitlementValue !== undefined) group.entitlementValue = data.entitlementValue;
      if (typeof data.isDefault === 'boolean') group.isDefault = data.isDefault;
      if (typeof data.isDeleted === 'boolean') {
        group.isDeleted = data.isDeleted;
        group.deletedAt = data.isDeleted ? group.deletedAt ?? new Date() : undefined;
        if (data.isDeleted) group.isDefault = false;
      }
      group.updatedBy = new mongoose.Types.ObjectId(actorId);

      await group.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: group._id,
        action: 'STOCK_SERVICE_GROUP_UPDATED',
        entity: 'StockServiceGroup',
        before,
        after: group.toObject(),
        ip,
        userAgent,
      }], { session });

      return group;
    });
  }
}
