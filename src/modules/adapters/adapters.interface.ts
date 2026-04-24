// Adapter implementations for external services

export interface IEmailAdapter {
  send(email: string, subject: string, body: string): Promise<string>;
  sendTemplate(email: string, templateId: string, data: any): Promise<string>;
}

export interface IPushAdapter {
  send(deviceToken: string, title: string, body: string, data?: any): Promise<string>;
  sendMulticast(deviceTokens: string[], title: string, body: string, data?: any): Promise<any>;
}

export const EMAIL_ADAPTER = 'EmailAdapter';
export const PUSH_ADAPTER = 'PushAdapter';
