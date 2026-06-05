import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { FirebaseAdapter } from '../adapters/firebase.adapter';
import { PUSH_QUEUE } from './queue.constants';

export interface PushJobData {
  userId: string;
  deviceTokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  retryCount?: number;
}

@Processor(PUSH_QUEUE)
@Injectable()
export class PushProcessor {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(private firebaseAdapter: FirebaseAdapter) {}

  @Process()
  async handlePushJob(job: Job<PushJobData>) {
    this.logger.log(`🔔 Processing push job #${job.id}`);

    try {
      const { userId, deviceTokens, title, body, data } = job.data;

      if (!deviceTokens || deviceTokens.length === 0) {
        throw new Error(`No device tokens available for user ${userId}`);
      }

      if (!this.firebaseAdapter.isInitialized()) {
        throw new Error('Firebase adapter not initialized');
      }

      // Send multicast notification
      const response = await this.firebaseAdapter.sendMulticast(deviceTokens, title, body, data);

      this.logger.log(
        `✓ Push job #${job.id} completed. Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        success: response.failureCount === 0,
      };
    } catch (error) {
      this.logger.error(`✗ Push job #${job.id} failed: ${error.message}`);

      // Retry logic
      const retryCount = (job.data.retryCount || 0) + 1;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        this.logger.log(`Retrying push job #${job.id} (attempt ${retryCount}/${maxRetries})`);
        // Exponential backoff
        const delay = 5000 * Math.pow(5, retryCount - 1);
        throw new Error(`Retry in ${delay}ms: ${error.message}`);
      }

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<PushJobData>) {
    this.logger.log(`✓ Push job #${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job<PushJobData>, err: Error) {
    this.logger.error(`✗ Push job #${job.id} failed permanently: ${err.message}`);
  }
}
