import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EmailTemplateRepository } from '../../database';
import { QueueService } from '../queue/queue.service';
import { SendEmailDto, SendTemplateEmailDto, BatchSendEmailDto } from './email.dto';
import { SendGridAdapter } from '../adapters/sendgrid.adapter';
import { InvalidPayloadException, TemplateNotFoundException } from '../../common/exceptions';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private emailTemplateRepository: EmailTemplateRepository,
    private queueService: QueueService,
    private sendGridAdapter: SendGridAdapter,
  ) {}

  /**
   * Send email directly (immediate)
   */
  async sendEmailDirect(dto: SendEmailDto): Promise<any> {
    try {
      this.logger.log(
        `📧 Sending email directly to ${Array.isArray(dto.to) ? dto.to.join(', ') : dto.to}`,
      );

      const messageId = await this.sendGridAdapter.send(dto.to, dto.subject, dto.body);

      this.logger.log(`✓ Email sent with message ID: ${messageId}`);

      return {
        messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to send email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send email via queue (async)
   */
  async sendEmailQueued(dto: SendEmailDto): Promise<any> {
    try {
      this.logger.log(`📧 Queuing email to ${Array.isArray(dto.to) ? dto.to.join(', ') : dto.to}`);

      const job = await this.queueService.addEmailJob({
        to: dto.to,
        subject: dto.subject,
        body: dto.body,
      });

      this.logger.log(`✓ Email job created: #${job.id}`);

      return {
        jobId: job.id,
        status: 'queued',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to queue email: ${error.message}`);
      throw new BadRequestException(`Failed to queue email: ${error.message}`);
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(dto: SendTemplateEmailDto): Promise<any> {
    try {
      this.logger.log(
        `📧 Sending template email: ${dto.templateId} to ${Array.isArray(dto.to) ? dto.to.join(', ') : dto.to}`,
      );

      // Verify template exists
      const template = await this.emailTemplateRepository.findByTemplateId(dto.templateId);

      if (!template) {
        throw new TemplateNotFoundException(dto.templateId);
      }

      if (!template.active) {
        throw new InvalidPayloadException(`Template "${dto.templateId}" is not active`);
      }

      // Validate data matches template variables
      this.validateTemplateVariables(template.variables, dto.data);

      // Queue the email
      const job = await this.queueService.addEmailJob({
        to: dto.to,
        templateId: dto.templateId,
        variables: dto.data,
      });

      this.logger.log(`✓ Template email job created: #${job.id}`);

      return {
        jobId: job.id,
        status: 'queued',
        templateId: dto.templateId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to send template email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(dto: BatchSendEmailDto): Promise<any> {
    try {
      this.logger.log(`📧 Queuing batch of ${dto.emails.length} emails`);

      const jobIds: (string | number)[] = [];

      for (const email of dto.emails) {
        const job = await this.queueService.addEmailJob(
          {
            to: email.to,
            subject: email.subject,
            body: email.body,
          },
          { priority: dto.priority || 100 },
        );
        jobIds.push(job.id);
      }

      this.logger.log(`✓ Batch email jobs created: ${jobIds.join(', ')}`);

      return {
        jobsCreated: jobIds.length,
        jobIds,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to queue batch emails: ${error.message}`);
      throw new BadRequestException(`Failed to queue batch emails: ${error.message}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    try {
      this.logger.log('📊 Fetching queue statistics');
      const stats = await this.queueService.getQueueStats();
      return stats;
    } catch (error) {
      this.logger.error(`✗ Failed to get queue stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(email: string): Promise<boolean> {
    const isValid = await this.sendGridAdapter.verifyEmail(email);
    return isValid;
  }

  /**
   * List available templates
   */
  async getTemplates(activeOnly: boolean = true) {
    try {
      this.logger.log('📋 Fetching email templates');

      const { items, total } = await this.emailTemplateRepository.getAllTemplates(
        0,
        100,
        activeOnly,
      );

      return {
        items: items.map(t => ({
          id: t.id,
          templateId: t.templateId,
          name: t.name,
          subject: t.subject,
          variables: t.variables,
          active: t.active,
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`✗ Failed to fetch templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single template
   */
  async getTemplate(templateId: string) {
    try {
      const template = await this.emailTemplateRepository.findByTemplateId(templateId);

      if (!template) {
        throw new TemplateNotFoundException(templateId);
      }

      return {
        id: template.id,
        templateId: template.templateId,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        active: template.active,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    } catch (error) {
      this.logger.error(`✗ Failed to fetch template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate template variables
   */
  private validateTemplateVariables(
    templateVariables: Record<string, any>,
    providedData: Record<string, any>,
  ): void {
    const requiredVariables = Object.keys(templateVariables);

    for (const variable of requiredVariables) {
      if (!(variable in providedData)) {
        throw new InvalidPayloadException(`Missing required template variable: ${variable}`);
      }
    }
  }
}
