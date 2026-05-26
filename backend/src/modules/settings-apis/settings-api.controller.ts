import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { SettingsApiService } from './settings-api.service';

export class SettingsApiController {
  static async list(req: Request, res: Response) {
    const result = await SettingsApiService.list(req.query);
    sendSuccess(res, result.data, translate('settingsApis.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const api = await SettingsApiService.create(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, api, translate('settingsApis.created', req.language), null, 201);
  }

  static async update(req: Request, res: Response) {
    const api = await SettingsApiService.update(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, api, translate('settingsApis.updated', req.language));
  }

  static async sync(req: Request, res: Response) {
    const result = await SettingsApiService.sync(req.params.id as string, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.synced', req.language));
  }

  static async syncAll(req: Request, res: Response) {
    const result = await SettingsApiService.syncAll(req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.synced', req.language));
  }

  static async simulateGiftCardProviders(req: Request, res: Response) {
    const result = await SettingsApiService.simulateGiftCardProviders(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.gift_card_provider_simulated', req.language));
  }

  static async simulateGiftCardProviders2(req: Request, res: Response) {
    const result = await SettingsApiService.simulateGiftCardProviders2(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.gift_card_provider_2_simulated', req.language));
  }

  static async simulateSocialMediaServiceProviders(req: Request, res: Response) {
    const result = await SettingsApiService.simulateSocialMediaServiceProviders(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.social_media_provider_simulated', req.language));
  }

  static async simulateTemporaryNumberCodingSites(req: Request, res: Response) {
    const result = await SettingsApiService.simulateTemporaryNumberCodingSites(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('settingsApis.temporary_number_provider_simulated', req.language));
  }
}
