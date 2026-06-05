// NATS subject constants used by the notification service listener.
// Other services publish to these subjects; this service subscribes.
export const NATS_SUBJECTS = {
  // ─── Generic subjects (any service can use these directly) ───────────────────
  SEND_EMAIL: 'notifications.send.email',
  SEND_TEMPLATE_EMAIL: 'notifications.send.template_email',
  SEND_PUSH: 'notifications.send.push',
  CREATE_IN_APP: 'notifications.create.in_app',

  // ─── Domain events (published by other VisioBook services) ───────────────────
  GENERATION_COMPLETED: 'generation.completed',
  GENERATION_FAILED: 'generation.failed',
  CONTENT_SHARED: 'content.shared',
  PAYMENT_CONFIRMED: 'payment.confirmed',
  USER_REGISTERED: 'user.registered',
  USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
} as const;

// ─── Payload interfaces ────────────────────────────────────────────────────────

export interface GenerationCompletedPayload {
  userId: string;
  userEmail: string;
  generationId: string;
  title: string;
}

export interface GenerationFailedPayload {
  userId: string;
  generationId: string;
  reason?: string;
}

export interface ContentSharedPayload {
  userId: string;
  sharedByName: string;
  contentId: string;
}

export interface PaymentConfirmedPayload {
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentId: string;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name: string;
  verificationToken?: string;
}

export interface UserPasswordResetPayload {
  userId: string;
  email: string;
  resetToken: string;
}
