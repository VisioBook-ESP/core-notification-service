import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { EMAIL_QUEUE, PUSH_QUEUE } from './queue.constants';
import { EmailJobData } from './email.processor';
import { PushJobData } from './push.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue<EmailJobData>,
    @InjectQueue(PUSH_QUEUE) private pushQueue: Queue<PushJobData>,
  ) {}

  /**
   * Add email job to queue
   */
  async addEmailJob(data: EmailJobData, options?: any): Promise<Job<EmailJobData>> {
    const jobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      priority: 100,
      ...options,
    };

    const job = await this.emailQueue.add(data, jobOptions);
    this.logger.log(`📧 Email job created: #${job.id}`);
    return job;
  }

  /**
   * Add push notification job to queue
   */
  async addPushJob(data: PushJobData, options?: any): Promise<Job<PushJobData>> {
    const jobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      priority: 100,
      ...options,
    };

    const job = await this.pushQueue.add(data, jobOptions);
    this.logger.log(`🔔 Push job created: #${job.id}`);
    return job;
  }

  /**
   * Get email queue stats
   */
  async getEmailQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      queue: 'email',
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Get push queue stats
   */
  async getPushQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.pushQueue.getWaitingCount(),
      this.pushQueue.getActiveCount(),
      this.pushQueue.getCompletedCount(),
      this.pushQueue.getFailedCount(),
      this.pushQueue.getDelayedCount(),
    ]);

    return {
      queue: 'push',
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Get all queue stats
   */
  async getQueueStats() {
    const [emailStats, pushStats] = await Promise.all([
      this.getEmailQueueStats(),
      this.getPushQueueStats(),
    ]);

    return {
      email: emailStats,
      push: pushStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pause queue
   */
  async pauseEmailQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.log('⏸️  Email queue paused');
  }

  /**
   * Resume queue
   */
  async resumeEmailQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log('▶️  Email queue resumed');
  }

  /**
   * Clear queue
   */
  async clearEmailQueue(): Promise<void> {
    await this.emailQueue.clean(0);
    this.logger.log('🗑️  Email queue cleared');
  }

  /**
   * Get failed jobs
   */
  async getFailedEmailJobs(start: number = 0, end: number = 100) {
    return this.emailQueue.getFailed(start, end);
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(jobId: string | number): Promise<void> {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      this.logger.log(`🔄 Retrying job #${jobId}`);
    }
  }
}
