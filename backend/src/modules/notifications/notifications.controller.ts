import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';

export class NotificationsController {
  static async getNotifications(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await NotificationsService.getUserNotifications(req.user!.id, page, limit);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async getUnreadCount(req: Request, res: Response) {
    const count = await NotificationsService.getUnreadCount(req.user!.id);
    sendSuccess(res, { count }, translate('common.operation_successful', req.language));
  }

  static async markAsRead(req: Request, res: Response) {
    const notification = await NotificationsService.markAsRead(req.params.id as string, req.user!.id);
    sendSuccess(res, notification, translate('notifications.marked_read', req.language));
  }

  static async markAllAsRead(req: Request, res: Response) {
    await NotificationsService.markAllAsRead(req.user!.id);
    sendSuccess(res, null, translate('notifications.all_marked_read', req.language));
  }

  static async deleteNotification(req: Request, res: Response) {
    await NotificationsService.deleteNotification(req.params.id as string, req.user!.id);
    sendSuccess(res, null, translate('notifications.deleted', req.language));
  }
}
