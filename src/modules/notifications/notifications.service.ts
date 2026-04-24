import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationRepository } from '../../database';
import { NotificationMapper } from '../../database/mappers/notification.mapper';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  ListNotificationsQueryDto,
} from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private notificationRepository: NotificationRepository) {}

  /**
   * Create and store in-app notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<any> {
    try {
      this.logger.log(`📬 Creating notification for user ${dto.userId}: ${dto.type}`);

      const notification = this.notificationRepository.create(NotificationMapper.toEntity(dto));

      await this.notificationRepository.save(notification);

      this.logger.log(`✓ Notification created: ${notification.id}`);

      return NotificationMapper.toResponse(notification);
    } catch (error) {
      this.logger.error(`✗ Failed to create notification: ${error.message}`);
      throw new BadRequestException(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, query: ListNotificationsQueryDto = {}): Promise<any> {
    try {
      const page =
        typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page as number) || 1;
      const limit =
        typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit as number) || 20;
      const skip = (page - 1) * limit;

      this.logger.log(
        `📬 Fetching notifications for user ${userId} (page ${page}, limit ${limit})`,
      );

      const { items, total } = await this.notificationRepository.findByUserId(userId, skip, limit, {
        read: query.read,
        type: query.type,
      });

      return NotificationMapper.toResponseList(items, total, page, limit);
    } catch (error) {
      this.logger.error(`✗ Failed to fetch notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single notification
   */
  async getNotification(notificationId: string, userId: string): Promise<any> {
    try {
      this.logger.log(`📬 Fetching notification ${notificationId}`);

      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      return NotificationMapper.toResponse(notification);
    } catch (error) {
      this.logger.error(`✗ Failed to fetch notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update notification (mark as read, etc.)
   */
  async updateNotification(
    notificationId: string,
    userId: string,
    dto: UpdateNotificationDto,
  ): Promise<any> {
    try {
      this.logger.log(`📬 Updating notification ${notificationId}`);

      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      if (dto.read !== undefined) {
        await this.notificationRepository.markAsRead(notificationId, userId);
        notification.read = true;
        notification.readAt = new Date();
      }

      this.logger.log(`✓ Notification ${notificationId} updated`);

      return NotificationMapper.toResponse(notification);
    } catch (error) {
      this.logger.error(`✗ Failed to update notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`📬 Marking notification ${notificationId} as read`);

      await this.notificationRepository.markAsRead(notificationId, userId);

      this.logger.log(`✓ Notification marked as read`);
    } catch (error) {
      this.logger.error(`✗ Failed to mark as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<any> {
    try {
      this.logger.log(`📬 Marking all notifications as read for user ${userId}`);

      await this.notificationRepository.markAllAsRead(userId);

      this.logger.log(`✓ All notifications marked as read`);

      return { message: 'All notifications marked as read' };
    } catch (error) {
      this.logger.error(`✗ Failed to mark all as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`📬 Deleting notification ${notificationId}`);

      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      await this.notificationRepository.remove(notification);

      this.logger.log(`✓ Notification deleted`);
    } catch (error) {
      this.logger.error(`✗ Failed to delete notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteNotifications(notificationIds: string[], userId: string): Promise<any> {
    try {
      this.logger.log(`📬 Deleting ${notificationIds.length} notifications`);

      const result = await this.notificationRepository.delete({
        id: notificationIds as any, // TypeORM In operator
        userId,
      });

      this.logger.log(`✓ Deleted ${result.affected} notifications`);

      return { deleted: result.affected };
    } catch (error) {
      this.logger.error(`✗ Failed to delete notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<any> {
    try {
      const count = await this.notificationRepository.countUnreadByUserId(userId);

      return {
        userId,
        unreadCount: count,
      };
    } catch (error) {
      this.logger.error(`✗ Failed to get unread count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup task)
   */
  async deleteExpiredNotifications(daysOld: number = 30): Promise<any> {
    try {
      this.logger.log(`🗑️  Cleaning up notifications older than ${daysOld} days`);

      const expiredNotifications =
        await this.notificationRepository.findExpiredNotifications(daysOld);

      if (expiredNotifications.length === 0) {
        this.logger.log('ℹ️  No expired notifications found');
        return { deleted: 0 };
      }

      const ids = expiredNotifications.map(n => n.id);
      const result = await this.notificationRepository.delete(ids as any);

      this.logger.log(`✓ Deleted ${result.affected} expired notifications`);

      return { deleted: result.affected };
    } catch (error) {
      this.logger.error(`✗ Failed to delete expired notifications: ${error.message}`);
      throw error;
    }
  }
}
