// Push notification module will contain:
// - PushController
// - PushService
// - FirebaseAdapter integration

export const PUSH_QUEUE = 'push-queue';

export interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SubscribeDeviceRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

export interface SendPushResponse {
  messageId: string;
  successCount: number;
  failureCount: number;
}
