import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PushService } from '../src/modules/push/push.service';
import { FirebaseAdapter } from '../src/modules/adapters/firebase.adapter';
import { DeviceTokenRepository } from '../src/database/repositories/device-token.repository';
import { QueueService } from '../src/modules/queue/queue.service';
import { SubscribeDeviceDto, SendPushDto } from '../src/modules/push/push.dto';
import { DevicePlatform } from '../src/common/enums';

describe('PushService', () => {
  let service: PushService;
  let mockFirebaseAdapter: jest.Mocked<FirebaseAdapter>;
  let mockDeviceRepository: jest.Mocked<DeviceTokenRepository>;
  let mockQueueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    mockFirebaseAdapter = {
      send: jest.fn(),
      sendMulticast: jest.fn(),
      subscribeToTopic: jest.fn(),
      unsubscribeFromTopic: jest.fn(),
      sendToTopic: jest.fn(),
      isInitialized: jest.fn(),
    } as any;

    mockDeviceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findActiveTokensByUserId: jest.fn(),
      findByUserIdAndDeviceId: jest.fn(),
      findDevicesByUserId: jest.fn(),
      updateLastUsed: jest.fn(),
      deleteInactiveTokens: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockQueueService = {
      addPushJob: jest.fn(),
      addEmailJob: jest.fn(),
      getPushQueueStats: jest.fn(),
      getEmailQueueStats: jest.fn(),
      getQueueStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: FirebaseAdapter, useValue: mockFirebaseAdapter },
        { provide: DeviceTokenRepository, useValue: mockDeviceRepository },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  describe('subscribeDevice', () => {
    it('should register a new device', async () => {
      const userId = 'user-123';
      const dto: SubscribeDeviceDto = {
        token: 'firebase-token-123',
        deviceId: 'device-456',
        platform: DevicePlatform.IOS,
      };

      const savedDevice = {
        id: 'device-token-1',
        userId,
        ...dto,
        active: true,
        createdAt: new Date(),
      };

      mockDeviceRepository.create.mockReturnValue(savedDevice as any);
      mockDeviceRepository.save.mockResolvedValue(savedDevice as any);

      const result = await service.subscribeDevice(userId, dto);

      expect(mockDeviceRepository.create).toHaveBeenCalled();
      expect(mockDeviceRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('deviceId', 'device-456');
    });

    it('should update existing device', async () => {
      const userId = 'user-123';
      const dto: SubscribeDeviceDto = {
        token: 'new-token-123',
        deviceId: 'device-456',
        platform: DevicePlatform.ANDROID,
      };

      const existingDevice = {
        id: 'device-token-1',
        userId,
        token: 'old-token',
        deviceId: 'device-456',
        platform: 'ios',
      };

      mockDeviceRepository.findByUserIdAndDeviceId.mockResolvedValue(existingDevice as any);
      mockDeviceRepository.update = jest.fn().mockResolvedValue({} as any);

      await service.subscribeDevice(userId, dto);

      expect(mockDeviceRepository.findByUserIdAndDeviceId).toHaveBeenCalledWith(
        userId,
        dto.deviceId,
      );
    });
  });

  describe('unsubscribeDevice', () => {
    it('should deactivate a device', async () => {
      const userId = 'user-123';
      const deviceId = 'device-456';

      const device = {
        id: 'device-token-1',
        userId,
        deviceId,
        active: true,
      };

      mockDeviceRepository.findByUserIdAndDeviceId.mockResolvedValue(device as any);
      mockDeviceRepository.update = jest.fn().mockResolvedValue({} as any);

      await service.unsubscribeDevice(userId, deviceId);

      expect(mockDeviceRepository.findByUserIdAndDeviceId).toHaveBeenCalledWith(userId, deviceId);
    });

    it('should throw error if device not found', async () => {
      mockDeviceRepository.findByUserIdAndDeviceId.mockResolvedValue(null);

      await expect(service.unsubscribeDevice('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendPushNotification', () => {
    it('should queue push notification', async () => {
      const dto: SendPushDto = {
        userId: 'user-123',
        title: 'Test Notification',
        body: 'This is a test',
      };

      mockDeviceRepository.findActiveTokensByUserId.mockResolvedValue(['token-1', 'token-2']);
      mockQueueService.addPushJob.mockResolvedValue({
        id: 'job-123',
      } as any);

      const result = await service.sendPushNotification(dto);

      expect(mockQueueService.addPushJob).toHaveBeenCalled();
      expect(result).toHaveProperty('jobId');
    });
  });

  describe('subscribeToTopic', () => {
    it.skip('should subscribe devices to topic', async () => {
      const dto = {
        topic: 'announcements',
        deviceIds: ['device-1', 'device-2'],
      };

      mockFirebaseAdapter.isInitialized = jest.fn().mockReturnValue(true);
      mockDeviceRepository.find.mockResolvedValue([
        { id: 'device-token-1', token: 'token-1' },
        { id: 'device-token-2', token: 'token-2' },
      ] as any);

      mockFirebaseAdapter.subscribeToTopic.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
      } as any);

      const result = await service.subscribeToTopic(dto);

      expect(mockFirebaseAdapter.subscribeToTopic).toHaveBeenCalled();
      expect(result).toHaveProperty('topic');
    });
  });

  describe('listUserDevices', () => {
    it('should return paginated list of user devices', async () => {
      const userId = 'user-123';
      const devices = [
        {
          id: 'device-1',
          userId,
          deviceId: 'device-456',
          platform: 'ios',
          active: true,
        },
      ];

      mockDeviceRepository.findDevicesByUserId.mockResolvedValue({
        items: devices,
        total: 1,
      } as any);

      const result = await service.listUserDevices(userId, 1, 20);

      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(1);
    });
  });
});
