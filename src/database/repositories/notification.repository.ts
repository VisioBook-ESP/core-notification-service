import { DataSource, Repository, LessThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../entities';
import { NotificationType } from '../../common/enums';

@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
  constructor(private dataSource: DataSource) {
    super(NotificationEntity, dataSource.createEntityManager());
  }

  async findByUserId(
    userId: string,
    skip: number = 0,
    take: number = 20,
    filters?: {
      read?: boolean;
      type?: NotificationType;
    },
  ) {
    let query = this.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (filters?.read !== undefined) {
      query = query.andWhere('notification.read = :read', { read: filters.read });
    }

    if (filters?.type) {
      query = query.andWhere('notification.type = :type', { type: filters.type });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ where: { userId } });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.count({ where: { userId, read: false } });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.update({ id: notificationId, userId }, { read: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.update({ userId, read: false }, { read: true, readAt: new Date() });
  }

  async findExpiredNotifications(daysOld: number = 30): Promise<NotificationEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.find({
      where: {
        createdAt: LessThan(cutoffDate),
      },
    });
  }
}
