export enum NotificationType {
  GENERATION_COMPLETE = 'generation_complete',
  GENERATION_FAILED = 'generation_failed',
  SHARE_RECEIVED = 'share_received',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

export enum EmailTemplate {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  GENERATION_COMPLETE = 'generation_complete',
  GENERATION_FAILED = 'generation_failed',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  QUEUED = 'queued',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}
