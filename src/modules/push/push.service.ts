import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeviceTokenRepository } from '../../database';
import { QueueService } from '../queue/queue.service';
import { FirebaseAdapter } from '../adapters/firebase.adapter';
import { SendPushDto, SubscribeDeviceDto, SendTopicPushDto, SubscribeTopicDto } from './push.dto';
import { DeviceTokenMapper } from '../../database/mappers/index';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private deviceTokenRepository: DeviceTokenRepository,
    private queueService: QueueService,
    private firebaseAdapter: FirebaseAdapter,
  ) {}

  /**
   * Subscribe device for push notifications
   */
  async subscribeDevice(userId: string, dto: SubscribeDeviceDto): Promise<any> {
    try {
      this.logger.log(`📱 Subscribing device ${dto.deviceId} (${dto.platform}) for user ${userId}`);

      // Check if device already exists
      let deviceToken = await this.deviceTokenRepository.findByUserIdAndDeviceId(
        userId,
        dto.deviceId,
      );

      if (deviceToken) {
        // Update existing device
        await this.deviceTokenRepository.update(
          { id: deviceToken.id },
          { token: dto.token, active: true, updatedAt: new Date() },
        );
        deviceToken.token = dto.token;
        deviceToken.active = true;
        this.logger.log(`✓ Device ${dto.deviceId} updated`);
      } else {
        // Create new device
        deviceToken = this.deviceTokenRepository.create(DeviceTokenMapper.toEntity(userId, dto));
        await this.deviceTokenRepository.save(deviceToken);
        this.logger.log(`✓ Device ${dto.deviceId} registered`);
      }

      return {
        id: deviceToken.id,
        deviceId: deviceToken.deviceId,
        platform: deviceToken.platform,
        active: deviceToken.active,
        createdAt: deviceToken.createdAt,
      };
    } catch (error) {
      this.logger.error(`✗ Failed to subscribe device: ${error.message}`);
      throw new BadRequestException(`Failed to subscribe device: ${error.message}`);
    }
  }

  /**
   * Unsubscribe device from push notifications
   */
  async unsubscribeDevice(userId: string, deviceId: string): Promise<void> {
    try {
      this.logger.log(`📱 Unsubscribing device ${deviceId} for user ${userId}`);

      const deviceToken = await this.deviceTokenRepository.findByUserIdAndDeviceId(
        userId,
        deviceId,
      );

      if (!deviceToken) {
        throw new NotFoundException(`Device ${deviceId} not found for user ${userId}`);
      }

      // Soft delete - mark as inactive
      await this.deviceTokenRepository.update(
        { id: deviceToken.id },
        { active: false, updatedAt: new Date() },
      );

      this.logger.log(`✓ Device ${deviceId} unsubscribed`);
    } catch (error) {
      this.logger.error(`✗ Failed to unsubscribe device: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(dto: SendPushDto): Promise<any> {
    try {
      this.logger.log(`🔔 Queuing push notification for user ${dto.userId}`);

      // Get user's active devices
      const tokens = await this.deviceTokenRepository.findActiveTokensByUserId(dto.userId);

      if (!tokens || tokens.length === 0) {
        this.logger.warn(`⚠️ No active devices for user ${dto.userId}`);
        return {
          jobId: null,
          status: 'skipped',
          message: 'No active devices for user',
          timestamp: new Date().toISOString(),
        };
      }

      // Queue push job
      const job = await this.queueService.addPushJob({
        userId: dto.userId,
        deviceTokens: tokens,
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });

      this.logger.log(`✓ Push notification job created: #${job.id}`);

      return {
        jobId: job.id,
        status: 'queued',
        devicesCount: tokens.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to queue push notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe devices to topic
   */
  async subscribeToTopic(dto: SubscribeTopicDto): Promise<any> {
    try {
      if (!this.firebaseAdapter.isInitialized()) {
        throw new BadRequestException('Firebase not initialized');
      }

      this.logger.log(`📍 Subscribing ${dto.deviceIds.length} devices to topic "${dto.topic}"`);

      // Get tokens for device IDs
      const tokens: string[] = [];
      for (const {} of dto.deviceIds) {
        // Note: We don't have direct access to userId here, so we'd need to implement this differently
        // For now, we'll just call the adapter with device IDs as tokens
        // In production, you'd need to query the database for tokens
      }

      if (tokens.length === 0) {
        this.logger.warn('⚠️ No valid tokens found for subscription');
        return {
          subscribed: 0,
          failed: dto.deviceIds.length,
          status: 'failed',
        };
      }

      const response = await this.firebaseAdapter.subscribeToTopic(tokens, dto.topic);

      this.logger.log(`✓ Subscribed ${response.successCount} devices to topic "${dto.topic}"`);

      return {
        topic: dto.topic,
        subscribed: response.successCount,
        failed: response.failureCount,
        status: response.failureCount === 0 ? 'success' : 'partial',
      };
    } catch (error) {
      this.logger.error(`✗ Failed to subscribe to topic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send push to topic
   */
  async sendPushToTopic(dto: SendTopicPushDto): Promise<any> {
    try {
      if (!this.firebaseAdapter.isInitialized()) {
        throw new BadRequestException('Firebase not initialized');
      }

      this.logger.log(`📍 Sending push to topic "${dto.topic}"`);

      const messageId = await this.firebaseAdapter.sendToTopic(
        dto.topic,
        dto.title,
        dto.body,
        dto.data,
      );

      this.logger.log(`✓ Message sent to topic "${dto.topic}": ${messageId}`);

      return {
        messageId,
        topic: dto.topic,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to send to topic: ${error.message}`);
      throw error;
    }
  }

  /**
   * List user devices
   */
  async listUserDevices(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const { items, total } = await this.deviceTokenRepository.findDevicesByUserId(
        userId,
        (page - 1) * limit,
        limit,
        { active: true },
      );

      return {
        items: items.map(d => DeviceTokenMapper.toResponse(d)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`✗ Failed to list devices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    try {
      const stats = await this.queueService.getQueueStats();
      return stats.push;
    } catch (error) {
      this.logger.error(`✗ Failed to get queue stats: ${error.message}`);
      throw error;
    }
  }
}
