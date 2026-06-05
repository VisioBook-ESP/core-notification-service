import { Injectable, Logger } from '@nestjs/common';
import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { SendGridException } from '../../common/exceptions';
import { IEmailAdapter } from './adapters.interface';

@Injectable()
export class SendGridAdapter implements IEmailAdapter {
  private readonly logger = new Logger(SendGridAdapter.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@visiobook.com';

    if (!this.apiKey) {
      this.logger.warn('⚠️ SendGrid API key not configured');
    } else {
      sgMail.setApiKey(this.apiKey);
    }
  }

  async send(to: string | string[], subject: string, body: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new SendGridException('SendGrid API key not configured');
      }

      const msg: MailDataRequired = {
        to: Array.isArray(to) ? to : [to],
        from: this.fromEmail,
        subject,
        html: body,
      };

      const [response] = await sgMail.send(msg);

      const messageId = response.headers['x-message-id'] || 'unknown';
      this.logger.log(`✓ Email sent successfully. Message ID: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`✗ Failed to send email: ${error}`);
      throw new SendGridException(`Failed to send email: ${error.message}`);
    }
  }

  async sendTemplate(
    to: string | string[],
    templateId: string,
    data: Record<string, any>,
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new SendGridException('SendGrid API key not configured');
      }

      // SendGrid uses template IDs directly
      const msg: any = {
        to: Array.isArray(to) ? to : [to],
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: data,
      };

      const [response] = await sgMail.send(msg);

      const messageId = response.headers['x-message-id'] || 'unknown';
      this.logger.log(
        `✓ Template email sent successfully. Template: ${templateId}, Message ID: ${messageId}`,
      );

      return messageId;
    } catch (error) {
      this.logger.error(`✗ Failed to send template email: ${error}`);
      throw new SendGridException(`Failed to send template email: ${error.message}`);
    }
  }

  /**
   * Send batch emails
   * Useful for newsletters or bulk notifications
   */
  async sendBatch(
    recipients: Array<{ to: string; subject: string; body: string }>,
  ): Promise<string[]> {
    try {
      if (!this.apiKey) {
        throw new SendGridException('SendGrid API key not configured');
      }

      const messages: MailDataRequired[] = recipients.map(r => ({
        to: r.to,
        from: this.fromEmail,
        subject: r.subject,
        html: r.body,
      }));

      const response = await sgMail.sendMultiple({
        personalizations: messages.map(m => ({
          to: Array.isArray(m.to)
            ? (m.to as string[]).map(email => ({ email }))
            : [{ email: m.to as string }],
          subject: m.subject,
        })),
        from: this.fromEmail,
        content: [
          {
            type: 'text/html',
            value: recipients[0].body,
          },
        ],
      });

      const messageId = (response[0].headers as any)['x-message-id'] || 'unknown';
      this.logger.log(`✓ Batch emails sent successfully. Message IDs: ${messageId}`);

      return [messageId];
    } catch (error) {
      this.logger.error(`✗ Failed to send batch emails: ${error}`);
      throw new SendGridException(`Failed to send batch emails: ${error.message}`);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(email: string): Promise<boolean> {
    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
