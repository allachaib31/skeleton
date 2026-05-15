import { Notification } from './notification.model';
import { emitToUser, NOTIFICATION_NEW } from '../../sockets/socket.events';
import { redisGet, redisSet, redisDel } from '../../config/redis.config';
import { CreateNotificationDto } from './notifications.types';

export class NotificationsService {
  static async createNotification(payload: CreateNotificationDto) {
    const notification = await Notification.create(payload);
    
    emitToUser(payload.userId, NOTIFICATION_NEW, notification);
    await redisDel(`notif-unread:${payload.userId}`);
    
    return notification;
  }

  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId })
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getUnreadCount(userId: string) {
    const cacheKey = `notif-unread:${userId}`;
    const cached = await redisGet(cacheKey);
    if (cached !== null) return cached;

    const count = await Notification.countDocuments({ userId, isRead: false });
    await redisSet(cacheKey, count, 30); // 30s TTL
    
    return count;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    await redisDel(`notif-unread:${userId}`);
    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    await redisDel(`notif-unread:${userId}`);
  }

  static async deleteNotification(notificationId: string, userId: string) {
    await Notification.findOneAndDelete({ _id: notificationId, userId });
    await redisDel(`notif-unread:${userId}`);
  }
}
