import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { SendGridAdapter } from '../adapters/sendgrid.adapter';
import { EMAIL_QUEUE } from './queue.constants';

export interface EmailJobData {
  to: string | string[];
  subject?: string;
  body?: string;
  templateId?: string;
  variables?: Record<string, any>;
  retryCount?: number;
}

@Processor(EMAIL_QUEUE)
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private sendGridAdapter: SendGridAdapter) {}

  @Process()
  async handleEmailJob(job: Job<EmailJobData>) {
    this.logger.log(`📧 Processing email job #${job.id}`);

    try {
      const { to, subject, body, templateId, variables } = job.data;

      let messageId: string;

      if (templateId && variables) {
        // Send using template
        messageId = await this.sendGridAdapter.sendTemplate(to, templateId, variables);
      } else if (subject && body) {
        // Send raw email
        messageId = await this.sendGridAdapter.send(to, subject, body);
      } else {
        throw new Error('Missing required email data (either template or subject+body)');
      }

      this.logger.log(`✓ Email job #${job.id} completed. Message ID: ${messageId}`);

      return { messageId, success: true };
    } catch (error) {
      this.logger.error(`✗ Email job #${job.id} failed: ${error.message}`);

      // Retry logic
      const retryCount = (job.data.retryCount || 0) + 1;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        this.logger.log(`Retrying email job #${job.id} (attempt ${retryCount}/${maxRetries})`);
        // Exponential backoff: 5s, 25s, 125s
        const delay = 5000 * Math.pow(5, retryCount - 1);
        throw new Error(`Retry in ${delay}ms: ${error.message}`);
      }

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`✓ Email job #${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, err: Error) {
    this.logger.error(`✗ Email job #${job.id} failed permanently: ${err.message}`);
  }
}
