export class NotificationException extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'NotificationException';
  }
}

export class SendGridException extends NotificationException {
  constructor(message: string) {
    super(message, 'SENDGRID_ERROR');
    this.name = 'SendGridException';
  }
}

export class FirebaseException extends NotificationException {
  constructor(message: string) {
    super(message, 'FIREBASE_ERROR');
    this.name = 'FirebaseException';
  }
}

export class TemplateNotFoundException extends NotificationException {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundException';
  }
}

export class DeviceNotFoundException extends NotificationException {
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND');
    this.name = 'DeviceNotFoundException';
  }
}

export class InvalidPayloadException extends NotificationException {
  constructor(message: string) {
    super(message, 'INVALID_PAYLOAD');
    this.name = 'InvalidPayloadException';
  }
}
