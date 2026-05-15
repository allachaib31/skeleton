export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}
