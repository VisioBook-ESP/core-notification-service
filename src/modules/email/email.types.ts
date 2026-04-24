// Email module will contain:
// - EmailController
// - EmailService
// - SendGridAdapter integration

export const EMAIL_QUEUE = 'email-queue';

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  attachments?: any[];
}

export interface SendTemplateEmailRequest {
  to: string | string[];
  templateId: string;
  data: Record<string, any>;
  attachments?: any[];
}

export interface SendEmailResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}
