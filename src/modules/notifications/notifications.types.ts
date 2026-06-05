// In-app notifications module will contain:
// - InAppController
// - InAppService
// - Notification repository integration

export interface CreateNotificationRequest {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}
