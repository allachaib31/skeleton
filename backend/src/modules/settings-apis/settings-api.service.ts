import mongoose, { ClientSession } from 'mongoose';
import { withTransaction } from '../../database/transaction';
import { buildPaginationMeta, parsePaginationQuery } from '../../common/helpers/pagination.helper';
import { HttpError } from '../../common/errors/HttpError';
import { AuditLog } from '../audit/audit-log.model';
import { SettingsCurrency } from '../settings-currencies/settings-currency.model';
import { ApiGroup, ApiSyncSchedule, SettingsApi } from './settings-api.model';
import { GiftCardProvidersProvider, GiftCardProvidersSimulationInput } from './providers/gift-card-providers.provider';
import { GiftCardProviders2Provider, GiftCardProviders2SimulationInput } from './providers/gift-card-providers-2.provider';
import { SocialMediaServiceProvidersProvider, SocialMediaServiceProvidersSimulationInput } from './providers/social-media-service-providers.provider';
import { TemporaryNumberCodingSitesProvider, TemporaryNumberCodingSitesSimulationInput } from './providers/temporary-number-coding-sites.provider';
import { SettingsApiSyncService } from './settings-api-sync.service';
import { refreshSettingsApiSyncJob } from '../../jobs/settings-api-sync.job';

interface ApiInput {
  name: string;
  link: string;
  token: string;
  group: ApiGroup;
  currencyId: string;
  syncSchedule: ApiSyncSchedule;
  isVisible: boolean;
  isDeleted: boolean;
}

type UpdateApiInput = Partial<ApiInput>;

const maskToken = (token?: string) => {
  if (!token) return '••••••••';
  if (token.length <= 8) return '••••••••';
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
};

export class SettingsApiService {
  static async list(query: unknown) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const [apis, total] = await Promise.all([
      SettingsApi.find({})
        .select('+token')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('currencyId', 'name shortName icon')
        .populate('createdBy', 'name email')
        .lean(),
      SettingsApi.countDocuments({}),
    ]);

    const balanceResults = await Promise.allSettled(
      apis.map((api) => SettingsApiSyncService.refreshBalance(String(api._id)))
    );
    const balanceByApiId = new Map<string, { balance?: number; balanceCurrency?: string; balanceSyncedAt?: Date }>();
    balanceResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        balanceByApiId.set(String(apis[index]._id), result.value);
      }
    });

    return {
      data: apis.map((api) => ({ ...api, ...balanceByApiId.get(String(api._id)), token: maskToken(api.token) })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  static async create(data: ApiInput, actorId: string, ip?: string, userAgent?: string) {
    const createdApi = await withTransaction(async (session: ClientSession) => {
      const currency = await SettingsCurrency.findById(data.currencyId).session(session);
      if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');

      const api = new SettingsApi({
        ...data,
        createdBy: actorId,
        deletedAt: data.isDeleted ? new Date() : undefined,
      });
      await api.save({ session });

      const after = api.toObject();
      delete (after as { token?: string }).token;

      await AuditLog.create([{
        actorId,
        targetId: api._id,
        action: 'SETTINGS_API_CREATED',
        entity: 'SettingsApi',
        after,
        ip,
        userAgent,
      }], { session });

      return { ...api.toObject(), token: maskToken(data.token) };
    });
    refreshSettingsApiSyncJob(String(createdApi._id));
    return createdApi;
  }

  static async update(apiId: string, data: UpdateApiInput, actorId: string, ip?: string, userAgent?: string) {
    const updatedApi = await withTransaction(async (session: ClientSession) => {
      const api = await SettingsApi.findById(apiId).select('+token').session(session);
      if (!api) throw HttpError.notFound('settingsApis.not_found');

      if (data.currencyId) {
        const currency = await SettingsCurrency.findById(data.currencyId).session(session);
        if (!currency) throw HttpError.notFound('settingsCurrencies.not_found');
        api.currencyId = new mongoose.Types.ObjectId(data.currencyId);
      }

      const before = api.toObject();
      delete (before as { token?: string }).token;

      if (data.name) api.name = data.name;
      if (data.link) api.link = data.link;
      if (data.token) api.token = data.token;
      if (data.group) api.group = data.group;
      if (data.syncSchedule) api.syncSchedule = data.syncSchedule;
      if (typeof data.isVisible === 'boolean') api.isVisible = data.isVisible;
      if (typeof data.isDeleted === 'boolean') {
        api.isDeleted = data.isDeleted;
        api.deletedAt = data.isDeleted ? api.deletedAt ?? new Date() : undefined;
      }
      api.updatedBy = new mongoose.Types.ObjectId(actorId);

      await api.save({ session });

      const after = api.toObject();
      delete (after as { token?: string }).token;

      await AuditLog.create([{
        actorId,
        targetId: api._id,
        action: 'SETTINGS_API_UPDATED',
        entity: 'SettingsApi',
        before,
        after,
        ip,
        userAgent,
      }], { session });

      return { ...api.toObject(), token: maskToken(api.token) };
    });
    refreshSettingsApiSyncJob(apiId);
    return updatedApi;
  }

  static async sync(apiId: string, actorId: string, ip?: string, userAgent?: string) {
    return SettingsApiSyncService.syncApi(apiId, actorId, ip, userAgent);
  }

  static async syncAll(actorId: string, ip?: string, userAgent?: string) {
    return SettingsApiSyncService.syncAll(actorId, ip, userAgent);
  }

  static async simulateGiftCardProviders(data: { apiId: string } & GiftCardProvidersSimulationInput, actorId: string, ip?: string, userAgent?: string) {
    const api = await SettingsApi.findOne({
      _id: data.apiId,
      group: 'GIFT_CARD_PROVIDERS',
      isDeleted: { $ne: true },
      isVisible: true,
    }).select('+token').lean();

    if (!api) throw HttpError.notFound('settingsApis.gift_card_provider_api_not_found');

    const startedAt = Date.now();
    const simulation = await GiftCardProvidersProvider.simulate(
      { baseUrl: api.link, token: api.token },
      data
    );

    await AuditLog.create({
      actorId,
      targetId: api._id,
      action: data.action === 'CREATE_ORDER' ? 'GIFT_CARD_PROVIDERS_ORDER_SIMULATED' : 'GIFT_CARD_PROVIDERS_API_SIMULATED',
      entity: 'SettingsApi',
      after: {
        apiId: api._id,
        provider: 'GIFT_CARD_PROVIDERS',
        action: data.action,
        durationMs: Date.now() - startedAt,
        errorInfo: simulation.errorInfo,
      },
      ip,
      userAgent,
    });

    return {
      provider: 'GIFT_CARD_PROVIDERS',
      action: data.action,
      response: simulation.response,
      errorInfo: simulation.errorInfo,
    };
  }

  static async simulateGiftCardProviders2(data: { apiId: string } & GiftCardProviders2SimulationInput, actorId: string, ip?: string, userAgent?: string) {
    const api = await SettingsApi.findOne({
      _id: data.apiId,
      group: 'GIFT_CARD_PROVIDERS_2',
      isDeleted: { $ne: true },
      isVisible: true,
    }).select('+token').lean();

    if (!api) throw HttpError.notFound('settingsApis.gift_card_provider_2_api_not_found');

    const startedAt = Date.now();
    const simulation = await GiftCardProviders2Provider.simulate(
      { baseUrl: api.link, token: api.token },
      data
    );

    await AuditLog.create({
      actorId,
      targetId: api._id,
      action: ['SUBMIT_BILL', 'AIRTIME_TOPUP', 'SUBMIT_PIN'].includes(data.action)
        ? 'GIFT_CARD_PROVIDERS_2_TRANSACTION_SIMULATED'
        : 'GIFT_CARD_PROVIDERS_2_API_SIMULATED',
      entity: 'SettingsApi',
      after: {
        apiId: api._id,
        provider: 'GIFT_CARD_PROVIDERS_2',
        action: data.action,
        durationMs: Date.now() - startedAt,
      },
      ip,
      userAgent,
    });

    return {
      provider: 'GIFT_CARD_PROVIDERS_2',
      action: data.action,
      response: simulation,
    };
  }

  static async simulateSocialMediaServiceProviders(data: SocialMediaServiceProvidersSimulationInput, actorId: string, ip?: string, userAgent?: string) {
    const api = await SettingsApi.findOne({
      _id: data.apiId,
      group: 'SOCIAL_MEDIA_SERVICE_PROVIDERS',
      isDeleted: { $ne: true },
      isVisible: true,
    }).select('+token').lean();

    if (!api) throw HttpError.notFound('settingsApis.social_media_provider_api_not_found');

    const startedAt = Date.now();
    const response = await SocialMediaServiceProvidersProvider.simulate(
      { baseUrl: api.link, token: api.token },
      data
    );

    await AuditLog.create({
      actorId,
      targetId: api._id,
      action: data.action === 'ADD_ORDER' ? 'SOCIAL_MEDIA_PROVIDER_ORDER_SIMULATED' : 'SOCIAL_MEDIA_PROVIDER_API_SIMULATED',
      entity: 'SettingsApi',
      after: {
        apiId: api._id,
        provider: 'SOCIAL_MEDIA_SERVICE_PROVIDERS',
        action: data.action,
        durationMs: Date.now() - startedAt,
      },
      ip,
      userAgent,
    });

    return {
      provider: 'SOCIAL_MEDIA_SERVICE_PROVIDERS',
      action: data.action,
      response,
    };
  }

  static async simulateTemporaryNumberCodingSites(data: TemporaryNumberCodingSitesSimulationInput, actorId: string, ip?: string, userAgent?: string) {
    const api = await SettingsApi.findOne({
      _id: data.apiId,
      group: 'TEMPORARY_NUMBER_CODING_SITES',
      isDeleted: { $ne: true },
      isVisible: true,
    }).select('+token').lean();

    if (!api) throw HttpError.notFound('settingsApis.temporary_number_provider_api_not_found');

    const startedAt = Date.now();
    const response = await TemporaryNumberCodingSitesProvider.simulate(
      { baseUrl: api.link, token: api.token },
      data
    );

    await AuditLog.create({
      actorId,
      targetId: api._id,
      action: ['GET_NUMBER', 'GET_NUMBER_V2'].includes(data.action)
        ? 'TEMPORARY_NUMBER_PROVIDER_NUMBER_SIMULATED'
        : 'TEMPORARY_NUMBER_PROVIDER_API_SIMULATED',
      entity: 'SettingsApi',
      after: {
        apiId: api._id,
        provider: 'TEMPORARY_NUMBER_CODING_SITES',
        action: data.action,
        durationMs: Date.now() - startedAt,
        errorInfo: response.errorInfo,
      },
      ip,
      userAgent,
    });

    return {
      provider: 'TEMPORARY_NUMBER_CODING_SITES',
      action: data.action,
      response,
    };
  }
}
