import { logger } from '../common/utils/logger';
import { SettingsApiSyncService } from '../modules/settings-apis/settings-api-sync.service';
import { ApiSyncSchedule, SettingsApi } from '../modules/settings-apis/settings-api.model';

const scheduleMinutes: Record<ApiSyncSchedule, number> = {
  '*/1 * * * *': 1,
  '*/5 * * * *': 5,
  '*/10 * * * *': 10,
  '*/20 * * * *': 20,
  '*/30 * * * *': 30,
  '*/40 * * * *': 40,
  '*/50 * * * *': 50,
  '0 * * * *': 60,
  '0 */3 * * *': 180,
  '0 */6 * * *': 360,
  '0 */12 * * *': 720,
  '0 0 * * *': 1440,
};

const runningApiIds = new Set<string>();
const syncTimers = new Map<string, NodeJS.Timeout>();

const getIntervalMs = (schedule: ApiSyncSchedule) => scheduleMinutes[schedule] * 60 * 1000;

const clearApiTimer = (apiId: string) => {
  const timer = syncTimers.get(apiId);
  if (!timer) return;
  clearTimeout(timer);
  syncTimers.delete(apiId);
};

const getNextDelayMs = (lastSyncAt: Date | undefined, schedule: ApiSyncSchedule) => {
  if (!lastSyncAt) return 0;
  const elapsedMs = Date.now() - new Date(lastSyncAt).getTime();
  return Math.max(getIntervalMs(schedule) - elapsedMs, 0);
};

const scheduleApiTimer = (apiId: string, delayMs: number) => {
  clearApiTimer(apiId);
  const timer = setTimeout(async () => {
    if (runningApiIds.has(apiId)) return scheduleSettingsApiSyncJob(apiId);
    runningApiIds.add(apiId);
    try {
      await SettingsApiSyncService.syncApi(apiId);
    } catch (error) {
      logger.error(`Settings API cron sync failed for ${apiId}`, error);
    } finally {
      runningApiIds.delete(apiId);
      scheduleSettingsApiSyncJob(apiId).catch((error) => logger.error(`Settings API reschedule failed for ${apiId}`, error));
    }
  }, delayMs);

  syncTimers.set(apiId, timer);
};

export const scheduleSettingsApiSyncJob = async (apiId: string) => {
  const api = await SettingsApi.findOne({
    _id: apiId,
    isDeleted: { $ne: true },
    isVisible: true,
    group: { $in: ['GIFT_CARD_PROVIDERS', 'SOCIAL_MEDIA_SERVICE_PROVIDERS', 'GIFT_CARD_PROVIDERS_2'] },
  }).select('_id syncSchedule lastSyncAt').lean();

  if (!api) {
    clearApiTimer(apiId);
    return;
  }

  scheduleApiTimer(apiId, getNextDelayMs(api.lastSyncAt, api.syncSchedule));
};

export const startSettingsApiSyncJob = () => {
  SettingsApi.find({
    isDeleted: { $ne: true },
    isVisible: true,
    group: { $in: ['GIFT_CARD_PROVIDERS', 'SOCIAL_MEDIA_SERVICE_PROVIDERS', 'GIFT_CARD_PROVIDERS_2'] },
  }).select('_id syncSchedule lastSyncAt').lean()
    .then((apis) => {
      apis.forEach((api) => {
        scheduleApiTimer(String(api._id), getNextDelayMs(api.lastSyncAt, api.syncSchedule));
      });
      logger.info(`⏱️ Settings API sync job started with ${apis.length} API timers`);
    })
    .catch((error) => logger.error('Settings API sync scheduler failed', error));
};

export const refreshSettingsApiSyncJob = (apiId: string) => {
  scheduleSettingsApiSyncJob(apiId).catch((error) => logger.error(`Settings API schedule refresh failed for ${apiId}`, error));
};

export const stopSettingsApiSyncJob = () => {
  syncTimers.forEach((timer) => clearTimeout(timer));
  syncTimers.clear();
  runningApiIds.clear();
  logger.info('⏱️ Settings API sync job stopped');
};
