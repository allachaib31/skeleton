import mongoose, { ClientSession } from 'mongoose';
import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.config';
import { translate } from '../../config/i18n.config';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { AuditLog } from '../audit/audit-log.model';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../roles/role.model';
import { SettingsPaymentGateway } from '../settings-payment-gateways/settings-payment-gateway.model';
import { StockCategory } from '../stock-categories/stock-category.model';
import { StockProduct } from '../stock-products/stock-product.model';
import { ProductSpecialPricingType } from '../stock-products/stock-product.model';
import { StockServiceGroup } from '../stock-service-groups/stock-service-group.model';
import { StockService } from '../stock-services/stock-service.model';
import { Upload } from '../uploads/upload.model';
import { User } from '../users/user.model';
import { ClientFinancialMovement, ClientFinancialMovementType } from './client-financial-movement.model';
import { ClientProductSpecialPrice } from './client-product-special-price.model';
import { UserLevelGroupe } from './user-level-groupe.model';

type CreateClientInput = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  countryIso: string;
  countryFlag: string;
  status: 'active' | 'inactive' | 'banned' | 'pending_verification';
  password: string;
  referralClientId?: string;
};

type UpdateClientInput = Partial<CreateClientInput>;

type MovementInput = {
  type: ClientFinancialMovementType;
  amount: number;
  paymentMethodId?: string;
  comment?: string;
};

type OpenCreditInput = {
  openCredit: number;
  comment?: string;
};

type LevelInput = {
  groupId: string;
};

type ClientSpecialPriceInput = {
  serviceId: string;
  categoryId: string;
  productId: string;
  pricingType: ProductSpecialPricingType;
  value: number;
  negativeValue: number;
};

type UpdateClientSpecialPriceInput = Partial<ClientSpecialPriceInput>;

const uploadClientAvatar = async (file: Express.Multer.File) => {
  return await new Promise<any>((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream({ folder: 'clients' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(cldStream);
  });
};

const saveAvatar = async (actorId: string, file: Express.Multer.File, session: ClientSession) => {
  const uploadResult = await uploadClientAvatar(file);
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
    tags: ['admin-client-avatar'],
  });
  await uploadDoc.save({ session });
  return uploadResult.secure_url as string;
};

const buildInvitationCode = () => `CL${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const createInvitationCode = async (session: ClientSession) => {
  for (let index = 0; index < 10; index += 1) {
    const code = buildInvitationCode();
    const exists = await User.exists({ invitationCode: code }).session(session);
    if (!exists) return code;
  }
  return `CL${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
};

const clientPopulate = [
  { path: 'role', select: 'name' },
  { path: 'referralClientId', select: 'name email username invitationCode' },
];

const initializeClientLevels = async (clientId: mongoose.Types.ObjectId, session: ClientSession) => {
  const services = await StockService.find({ isDeleted: { $ne: true } }).select('_id').session(session).lean();
  if (!services.length) return;

  const serviceIds = services.map((service) => service._id);
  const groups = await StockServiceGroup.find({ serviceId: { $in: serviceIds }, isDeleted: { $ne: true } })
    .sort({ isDefault: -1, entitlementValue: 1, createdAt: 1 })
    .session(session)
    .lean();

  const groupsByService = new Map<string, typeof groups[number]>();
  for (const group of groups) {
    const serviceId = group.serviceId.toString();
    if (!groupsByService.has(serviceId)) groupsByService.set(serviceId, group);
  }

  const rows = services
    .map((service) => {
      const group = groupsByService.get(service._id.toString());
      if (!group) return null;
      return {
        clientId,
        serviceId: service._id,
        groupId: group._id,
        points: 0,
      };
    })
    .filter(Boolean);

  if (rows.length) await UserLevelGroupe.insertMany(rows, { session });
};

const getDefaultGroupsByService = async (serviceIds: mongoose.Types.ObjectId[], session?: ClientSession) => {
  const query = StockServiceGroup.find({ serviceId: { $in: serviceIds }, isDeleted: { $ne: true } })
    .sort({ isDefault: -1, entitlementValue: 1, createdAt: 1 })
    .lean();
  const groups = session ? await query.session(session) : await query;
  const groupsByService = new Map<string, typeof groups[number]>();
  for (const group of groups) {
    const serviceId = group.serviceId.toString();
    if (!groupsByService.has(serviceId)) groupsByService.set(serviceId, group);
  }
  return groupsByService;
};

export class AdminClientService {
  static async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const clientRole = await Role.findOne({ name: 'USER' }).select('_id').lean();
    const filter: Record<string, unknown> = { isDeleted: query.isDeleted === 'true' };
    if (clientRole) filter.role = clientRole._id;
    if (query.status) filter.status = query.status as string;
    if (query.search) {
      const search = query.search as string;
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate(clientPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async get(clientId: string, movementQuery: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(movementQuery);
    const movementFilter: Record<string, unknown> = { clientId };
    if (movementQuery.type) movementFilter.type = movementQuery.type as string;
    const [client, movements, movementTotal] = await Promise.all([
      User.findOne({ _id: clientId, isDeleted: false }).select('-password').populate(clientPopulate).lean(),
      ClientFinancialMovement.find(movementFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('paymentMethodId', 'name kind image')
        .populate('createdBy', 'name email')
        .lean(),
      ClientFinancialMovement.countDocuments(movementFilter),
    ]);
    if (!client) throw HttpError.notFound('adminClients.not_found');

    return {
      client,
      movements: {
        data: movements,
        meta: buildPaginationMeta(movementTotal, page, limit),
      },
    };
  }

  static async listAllMovements(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = {};
    if (query.clientId) filter.clientId = query.clientId as string;
    if (query.type) filter.type = query.type as string;
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) (filter.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom as string);
      if (query.dateTo) (filter.createdAt as Record<string, Date>).$lte = new Date(query.dateTo as string);
    }

    const [data, total] = await Promise.all([
      ClientFinancialMovement.find(filter)
        .populate('clientId', 'name email username phoneNumber countryFlag')
        .populate('paymentMethodId', 'name kind image')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientFinancialMovement.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listLevels(clientId: string) {
    const client = await User.findOne({ _id: clientId, isDeleted: false }).select('_id').lean();
    if (!client) throw HttpError.notFound('adminClients.not_found');

    const [services, levels] = await Promise.all([
      StockService.find({ isDeleted: { $ne: true } }).select('_id').lean(),
      UserLevelGroupe.find({ clientId })
        .populate('serviceId', 'name type image isVisible')
        .populate('groupId', 'name entitlementValue pricingType value negativeValue percentAgent isDefault isDeleted')
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const activeServiceIds = services.map((service) => service._id);
    const groups = await StockServiceGroup.find({ serviceId: { $in: activeServiceIds }, isDeleted: { $ne: true } })
      .select('name serviceId entitlementValue pricingType value negativeValue percentAgent isDefault')
      .sort({ serviceId: 1, entitlementValue: 1, createdAt: 1 })
      .lean();

    const groupsByService = new Map<string, typeof groups>();
    for (const group of groups) {
      const serviceId = group.serviceId.toString();
      groupsByService.set(serviceId, [...(groupsByService.get(serviceId) || []), group]);
    }

    const levelsWithGroups = levels.map((level) => {
      const service = level.serviceId as any;
      const serviceId = service?._id || service;
      return {
        ...level,
        availableGroups: serviceId ? groupsByService.get(serviceId.toString()) || [] : [],
      };
    }).filter((level) => Boolean(level.serviceId));

    const activeServiceIdSet = new Set(services.map((service) => service._id.toString()));
    const generatableServiceIds = new Set(groups.map((group) => group.serviceId.toString()));
    const levelServiceIds = new Set(levels.map((level) => {
      const service = level.serviceId as any;
      const serviceId = service?._id || service;
      return serviceId ? serviceId.toString() : '';
    }).filter(Boolean));
    const missingLevelCount = services.filter((service) => {
      const serviceId = service._id.toString();
      return generatableServiceIds.has(serviceId) && !levelServiceIds.has(serviceId);
    }).length;
    const invalidLevelCount = levels.filter((level) => {
      const service = level.serviceId as any;
      const serviceId = service?._id || service;
      const group = level.groupId as any;
      return serviceId && activeServiceIdSet.has(serviceId.toString()) && (!group || group.isDeleted === true);
    }).length;
    const skippedNoGroupCount = services.filter((service) => !generatableServiceIds.has(service._id.toString())).length;

    return {
      levels: levelsWithGroups,
      groups,
      missingLevelCount,
      invalidLevelCount,
      skippedNoGroupCount,
      canGenerateLevels: missingLevelCount > 0 || invalidLevelCount > 0,
    };
  }

  static async generateLevels(clientId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).select('_id').session(session).lean();
      if (!client) throw HttpError.notFound('adminClients.not_found');

      const services = await StockService.find({ isDeleted: { $ne: true } }).select('_id').session(session).lean();
      if (!services.length) return { created: 0, repaired: 0 };

      const serviceIds = services.map((service) => service._id as mongoose.Types.ObjectId);
      const [defaultGroupsByService, activeGroups] = await Promise.all([
        getDefaultGroupsByService(serviceIds, session),
        StockServiceGroup.find({ serviceId: { $in: serviceIds }, isDeleted: { $ne: true } }).select('_id').session(session).lean(),
      ]);
      const activeGroupIds = new Set(activeGroups.map((group) => group._id.toString()));
      const activeServiceIds = new Set(services.map((service) => service._id.toString()));
      const levels = await UserLevelGroupe.find({ clientId }).session(session);
      const levelsByService = new Map(
        levels
          .filter((level) => activeServiceIds.has(level.serviceId.toString()))
          .map((level) => [level.serviceId.toString(), level])
      );
      const rowsToCreate: Array<{ clientId: mongoose.Types.ObjectId; serviceId: mongoose.Types.ObjectId; groupId: mongoose.Types.ObjectId; points: number }> = [];
      let repaired = 0;

      for (const service of services) {
        const serviceId = service._id.toString();
        const defaultGroup = defaultGroupsByService.get(serviceId);
        if (!defaultGroup) continue;

        const level = levelsByService.get(serviceId);
        if (!level) {
          rowsToCreate.push({
            clientId: new mongoose.Types.ObjectId(clientId),
            serviceId: service._id as mongoose.Types.ObjectId,
            groupId: defaultGroup._id as mongoose.Types.ObjectId,
            points: 0,
          });
          continue;
        }

        if (!activeGroupIds.has(level.groupId.toString())) {
          const before = level.toObject();
          level.groupId = defaultGroup._id as mongoose.Types.ObjectId;
          level.points = defaultGroup.entitlementValue;
          await level.save({ session });
          repaired += 1;
          await AuditLog.create([{
            actorId,
            targetId: level._id,
            action: 'ADMIN_CLIENT_LEVEL_REPAIRED',
            entity: 'UserLevelGroupe',
            before,
            after: level.toObject(),
            ip,
            userAgent,
          }], { session });
        }
      }

      if (rowsToCreate.length) {
        const createdRows = await UserLevelGroupe.insertMany(rowsToCreate, { session });
        await AuditLog.create(createdRows.map((row) => ({
          actorId,
          targetId: row._id,
          action: 'ADMIN_CLIENT_LEVEL_GENERATED',
          entity: 'UserLevelGroupe',
          after: row.toObject(),
          ip,
          userAgent,
        })), { session });
      }

      return { created: rowsToCreate.length, repaired };
    });
  }

  static async updateLevel(clientId: string, levelId: string, data: LevelInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const level = await UserLevelGroupe.findOne({ _id: levelId, clientId }).session(session);
      if (!level) throw HttpError.notFound('adminClients.level_not_found');

      const group = await StockServiceGroup.findOne({
        _id: data.groupId,
        serviceId: level.serviceId,
        isDeleted: { $ne: true },
      }).session(session);
      if (!group) throw HttpError.notFound('stockServiceGroups.not_found');

      const before = level.toObject();
      level.groupId = group._id as mongoose.Types.ObjectId;
      level.points = group.entitlementValue;
      await level.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: level._id,
        action: 'ADMIN_CLIENT_LEVEL_UPDATED',
        entity: 'UserLevelGroupe',
        before,
        after: level.toObject(),
        ip,
        userAgent,
      }], { session });

      return level.toObject();
    });
  }

  static async create(data: CreateClientInput, actorId: string, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const role = await Role.findOne({ name: 'USER' }).session(session);
      if (!role) throw HttpError.notFound('adminClients.user_role_not_found');

      const emailExists = await User.exists({ email: data.email.toLowerCase() }).session(session);
      if (emailExists) throw HttpError.conflict('adminClients.email_exists');

      const usernameExists = await User.exists({ username: data.username }).session(session);
      if (usernameExists) throw HttpError.conflict('adminClients.username_exists');

      if (data.referralClientId) {
        const referral = await User.findById(data.referralClientId).session(session);
        if (!referral) throw HttpError.notFound('adminClients.referral_not_found');
      }

      const name = `${data.firstName} ${data.lastName}`.trim();
      const avatar = file ? await saveAvatar(actorId, file, session) : undefined;
      const client = new User({
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        name,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
        countryIso: data.countryIso,
        countryFlag: data.countryFlag,
        status: data.status,
        password: data.password,
        role: role._id,
        isEmailVerified: true,
        invitationCode: await createInvitationCode(session),
        referralClientId: data.referralClientId || undefined,
        avatar,
      });
      await client.save({ session });
      await initializeClientLevels(client._id as mongoose.Types.ObjectId, session);

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: 'ADMIN_CLIENT_CREATED',
        entity: 'User',
        after: client.toObject(),
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: client._id.toString(),
        type: 'account_created_by_admin',
        title: translate('notifications.client_account_created_title', 'en'),
        message: translate('notifications.client_account_created_message', 'en'),
        data: {
          titleKey: 'notifications.clientAccountCreatedTitle',
          messageKey: 'notifications.clientAccountCreatedMessage',
        },
      }).catch(() => undefined);

      return client.toObject();
    });
  }

  static async update(clientId: string, data: UpdateClientInput, actorId: string, file?: Express.Multer.File, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).select('+password').session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      if (data.email && data.email.toLowerCase() !== client.email) {
        const exists = await User.exists({ email: data.email.toLowerCase(), _id: { $ne: client._id } }).session(session);
        if (exists) throw HttpError.conflict('adminClients.email_exists');
      }
      if (data.username && data.username !== client.username) {
        const exists = await User.exists({ username: data.username, _id: { $ne: client._id } }).session(session);
        if (exists) throw HttpError.conflict('adminClients.username_exists');
      }
      if (data.referralClientId) {
        const referral = await User.findOne({ _id: data.referralClientId, isDeleted: false }).session(session);
        if (!referral) throw HttpError.notFound('adminClients.referral_not_found');
      }

      const before = client.toObject();
      const firstName = data.firstName ?? client.firstName;
      const lastName = data.lastName ?? client.lastName;
      client.set({
        email: data.email ?? client.email,
        username: data.username ?? client.username,
        firstName,
        lastName,
        name: `${firstName || ''} ${lastName || ''}`.trim() || client.name,
        phoneNumber: data.phoneNumber ?? client.phoneNumber,
        countryCode: data.countryCode ?? client.countryCode,
        countryIso: data.countryIso ?? client.countryIso,
        countryFlag: data.countryFlag ?? client.countryFlag,
        status: data.status ?? client.status,
        referralClientId: data.referralClientId === '' ? undefined : data.referralClientId ?? client.referralClientId,
      });
      if (data.password) client.password = data.password;
      if (file) client.avatar = await saveAvatar(actorId, file, session);
      await client.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: 'ADMIN_CLIENT_UPDATED',
        entity: 'User',
        before,
        after: client.toObject(),
        ip,
        userAgent,
      }], { session });

      return client.toObject();
    });
  }

  static async softDelete(clientId: string, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      const before = client.toObject();
      client.isDeleted = true;
      client.deletedAt = new Date();
      client.status = 'inactive';
      await client.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: 'ADMIN_CLIENT_SOFT_DELETED',
        entity: 'User',
        before,
        after: client.toObject(),
        ip,
        userAgent,
      }], { session });

      return client.toObject();
    });
  }

  static async createMovement(clientId: string, data: MovementInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      if (data.paymentMethodId) {
        const paymentMethod = await SettingsPaymentGateway.findById(data.paymentMethodId).session(session);
        if (!paymentMethod) throw HttpError.notFound('settingsPaymentGateways.not_found');
      }

      const before = client.balance ?? 0;
      const delta = data.type === 'DEPOSIT' ? data.amount : -data.amount;
      const after = before + delta;
      const openCredit = client.openCredit ?? 0;
      const minimumAllowedBalance = openCredit <= 0 ? openCredit : -openCredit;
      if (after < minimumAllowedBalance) throw HttpError.badRequest('adminClients.insufficient_balance');

      client.balance = after;
      await client.save({ session });

      const movement = new ClientFinancialMovement({
        clientId: client._id,
        type: data.type,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId || undefined,
        source: 'ADMIN',
        comment: data.comment || undefined,
        balanceBefore: before,
        balanceAfter: after,
        createdBy: actorId,
      });
      await movement.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: `ADMIN_CLIENT_${data.type}`,
        entity: 'ClientFinancialMovement',
        after: movement.toObject(),
        ip,
        userAgent,
      }], { session });

      await NotificationsService.createNotification({
        userId: client._id.toString(),
        type: 'client_financial_movement',
        title: translate('notifications.client_balance_updated_title', 'en'),
        message: translate('notifications.client_balance_updated_message', 'en'),
        data: {
          titleKey: 'notifications.clientBalanceUpdatedTitle',
          messageKey: 'notifications.clientBalanceUpdatedMessage',
        },
      }).catch(() => undefined);

      return movement.toObject();
    });
  }

  static async updateOpenCredit(clientId: string, data: OpenCreditInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      const before = client.toObject();
      client.openCredit = data.openCredit;
      await client.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: 'ADMIN_CLIENT_OPEN_CREDIT_UPDATED',
        entity: 'User',
        before: { openCredit: before.openCredit, comment: data.comment },
        after: { openCredit: client.openCredit },
        ip,
        userAgent,
      }], { session });

      return client.toObject();
    });
  }

  static async listSpecialPrices(clientId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const client = await User.findOne({ _id: clientId, isDeleted: false }).select('_id').lean();
    if (!client) throw HttpError.notFound('adminClients.not_found');

    const filter = { clientId, isDeleted: false };
    const [data, total] = await Promise.all([
      ClientProductSpecialPrice.find(filter)
        .populate('serviceId', 'name type image')
        .populate('categoryId', 'name serviceId image')
        .populate('productId', 'name image serviceId categoryId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientProductSpecialPrice.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async listAllSpecialPrices(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.clientId) filter.clientId = query.clientId as string;
    if (query.serviceId) filter.serviceId = query.serviceId as string;
    if (query.categoryId) filter.categoryId = query.categoryId as string;
    if (query.productId) filter.productId = query.productId as string;
    if (query.pricingType) filter.pricingType = query.pricingType as string;

    const [data, total] = await Promise.all([
      ClientProductSpecialPrice.find(filter)
        .populate('clientId', 'name email username phoneNumber countryFlag')
        .populate('serviceId', 'name type image')
        .populate('categoryId', 'name serviceId image')
        .populate('productId', 'name image serviceId categoryId')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientProductSpecialPrice.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  static async createSpecialPrice(clientId: string, data: ClientSpecialPriceInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).select('_id').session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      const [service, category, product] = await Promise.all([
        StockService.findOne({ _id: data.serviceId, isDeleted: { $ne: true } }).select('_id').session(session),
        StockCategory.findOne({ _id: data.categoryId, serviceId: data.serviceId, isDeleted: { $ne: true } }).select('_id').session(session),
        StockProduct.findOne({
          _id: data.productId,
          serviceId: data.serviceId,
          categoryId: data.categoryId,
          isDeleted: { $ne: true },
        }).select('_id').session(session),
      ]);
      if (!service || !category || !product) throw HttpError.badRequest('adminClients.special_price_invalid_product');

      const exists = await ClientProductSpecialPrice.exists({
        clientId,
        productId: data.productId,
        isDeleted: false,
      }).session(session);
      if (exists) throw HttpError.conflict('adminClients.special_price_exists');

      const specialPrice = new ClientProductSpecialPrice({
        clientId,
        serviceId: data.serviceId,
        categoryId: data.categoryId,
        productId: data.productId,
        pricingType: data.pricingType,
        value: data.value,
        negativeValue: data.negativeValue,
        createdBy: actorId,
      });
      await specialPrice.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: specialPrice._id,
        action: 'ADMIN_CLIENT_SPECIAL_PRICE_CREATED',
        entity: 'ClientProductSpecialPrice',
        after: specialPrice.toObject(),
        ip,
        userAgent,
      }], { session });

      return specialPrice.toObject();
    });
  }

  static async updateSpecialPrice(specialPriceId: string, data: UpdateClientSpecialPriceInput, actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const specialPrice = await ClientProductSpecialPrice.findOne({ _id: specialPriceId, isDeleted: false }).session(session);
      if (!specialPrice) throw HttpError.notFound('adminClients.special_price_not_found');

      const serviceId = data.serviceId || specialPrice.serviceId.toString();
      const categoryId = data.categoryId || specialPrice.categoryId.toString();
      const productId = data.productId || specialPrice.productId.toString();

      const [service, category, product] = await Promise.all([
        StockService.findOne({ _id: serviceId, isDeleted: { $ne: true } }).select('_id').session(session),
        StockCategory.findOne({ _id: categoryId, serviceId, isDeleted: { $ne: true } }).select('_id').session(session),
        StockProduct.findOne({ _id: productId, serviceId, categoryId, isDeleted: { $ne: true } }).select('_id').session(session),
      ]);
      if (!service || !category || !product) throw HttpError.badRequest('adminClients.special_price_invalid_product');

      if (productId !== specialPrice.productId.toString()) {
        const exists = await ClientProductSpecialPrice.exists({
          _id: { $ne: specialPrice._id },
          clientId: specialPrice.clientId,
          productId,
          isDeleted: false,
        }).session(session);
        if (exists) throw HttpError.conflict('adminClients.special_price_exists');
      }

      const before = specialPrice.toObject();
      specialPrice.set({
        serviceId,
        categoryId,
        productId,
        pricingType: data.pricingType ?? specialPrice.pricingType,
        value: data.value ?? specialPrice.value,
        negativeValue: data.negativeValue ?? specialPrice.negativeValue,
        updatedBy: actorId,
      });
      await specialPrice.save({ session });

      await AuditLog.create([{
        actorId,
        targetId: specialPrice._id,
        action: 'ADMIN_CLIENT_SPECIAL_PRICE_UPDATED',
        entity: 'ClientProductSpecialPrice',
        before,
        after: specialPrice.toObject(),
        ip,
        userAgent,
      }], { session });

      return specialPrice.toObject();
    });
  }

  static async bulkDeleteSpecialPrices(clientId: string, ids: string[], actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const client = await User.findOne({ _id: clientId, isDeleted: false }).select('_id').session(session);
      if (!client) throw HttpError.notFound('adminClients.not_found');

      const before = await ClientProductSpecialPrice.find({ _id: { $in: ids }, clientId, isDeleted: false }).session(session).lean();
      const result = await ClientProductSpecialPrice.updateMany(
        { _id: { $in: ids }, clientId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: actorId } },
        { session }
      );

      await AuditLog.create([{
        actorId,
        targetId: client._id,
        action: 'ADMIN_CLIENT_SPECIAL_PRICES_SOFT_DELETED',
        entity: 'ClientProductSpecialPrice',
        before,
        after: { ids, deletedCount: result.modifiedCount },
        ip,
        userAgent,
      }], { session });

      return { deletedCount: result.modifiedCount };
    });
  }

  static async bulkDeleteAllSpecialPrices(ids: string[], actorId: string, ip?: string, userAgent?: string) {
    return await withTransaction(async (session: ClientSession) => {
      const before = await ClientProductSpecialPrice.find({ _id: { $in: ids }, isDeleted: false }).session(session).lean();
      const result = await ClientProductSpecialPrice.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: actorId } },
        { session }
      );

      await AuditLog.create([{
        actorId,
        action: 'ADMIN_CLIENT_SPECIAL_PRICES_SOFT_DELETED',
        entity: 'ClientProductSpecialPrice',
        before,
        after: { ids, deletedCount: result.modifiedCount },
        ip,
        userAgent,
      }], { session });

      return { deletedCount: result.modifiedCount };
    });
  }
}
