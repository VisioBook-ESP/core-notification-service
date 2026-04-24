import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { NotificationRepository } from '../src/database/repositories/notification.repository';
import { CreateNotificationDto } from '../src/database/dto';
import { NotificationType } from '../src/common/enums';
describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockRepository: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findByUserId: jest.fn(),
      countUnreadByUserId: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const dto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        body: 'This is a test',
      };

      const saved = {
        id: 'notif-1',
        ...dto,
        read: false,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(saved as any);
      mockRepository.save.mockResolvedValue(saved as any);

      const result = await service.createNotification(dto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for user', async () => {
      const userId = 'user-123';
      const notifications = [
        {
          id: 'notif-1',
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Test',
          body: 'Body',
          read: false,
        },
      ];

      mockRepository.findByUserId.mockResolvedValue({
        items: notifications,
        total: 1,
      } as any);

      const result = await service.getUserNotifications(userId, {
        page: 1,
        limit: 20,
      });

      expect(mockRepository.findByUserId).toHaveBeenCalled();
      expect(result).toHaveProperty('items');
    });

    it('should filter by read status', async () => {
      const userId = 'user-123';

      mockRepository.findByUserId.mockResolvedValue({
        items: [],
        total: 0,
      } as any);

      await service.getUserNotifications(userId, { page: 1, limit: 20, read: false });

      expect(mockRepository.findByUserId).toHaveBeenCalled();
    });
  });

  describe('getNotification', () => {
    it('should return single notification', async () => {
      const notification = {
        id: 'notif-1',
        userId: 'user-123',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(notification as any);

      const result = await service.getNotification('notif-1', 'user-123');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw if notification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getNotification('non-existent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if notification belongs to different user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getNotification('notif-1', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.markAsRead.mockResolvedValue(undefined);

      await service.markAsRead('notif-1', 'user-123');

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-1', 'user-123');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      mockRepository.markAllAsRead.mockResolvedValue(undefined);

      await service.markAllAsRead('user-123');

      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-123');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-123',
      } as any);
      mockRepository.remove.mockResolvedValue({ id: 'notif-1' } as any);

      await service.deleteNotification('notif-1', 'user-123');

      expect(mockRepository.remove).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockRepository.countUnreadByUserId.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(mockRepository.countUnreadByUserId).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ userId: 'user-123', unreadCount: 5 });
    });
  });
});
