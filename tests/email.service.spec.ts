import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/modules/email/email.service';
import { SendGridAdapter } from '../src/modules/adapters/sendgrid.adapter';
import { EmailTemplateRepository } from '../src/database/repositories/email-template.repository';
import { QueueService } from '../src/modules/queue/queue.service';
import {
  SendEmailDto,
  SendTemplateEmailDto,
  BatchSendEmailDto,
} from '../src/modules/email/email.dto';

describe('EmailService', () => {
  let service: EmailService;
  let mockSendGridAdapter: jest.Mocked<SendGridAdapter>;
  let mockTemplateRepository: jest.Mocked<EmailTemplateRepository>;
  let mockQueueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    // Create mocks
    mockSendGridAdapter = {
      send: jest.fn(),
      sendTemplate: jest.fn(),
      sendBatch: jest.fn(),
      verifyEmail: jest.fn(),
    } as any;

    mockTemplateRepository = {
      findByTemplateId: jest.fn(),
      getAllTemplates: jest.fn(),
      searchTemplates: jest.fn(),
      findAllActive: jest.fn(),
    } as any;

    mockQueueService = {
      addEmailJob: jest.fn(),
      addPushJob: jest.fn(),
      getEmailQueueStats: jest.fn(),
      getPushQueueStats: jest.fn(),
      getQueueStats: jest.fn(),
      pauseEmailQueue: jest.fn(),
      resumeEmailQueue: jest.fn(),
      clearEmailQueue: jest.fn(),
      getFailedEmailJobs: jest.fn(),
      retryFailedJob: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: SendGridAdapter, useValue: mockSendGridAdapter },
        { provide: EmailTemplateRepository, useValue: mockTemplateRepository },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('sendEmailQueued', () => {
    it('should queue email for sending', async () => {
      const dto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test',
        body: '<p>Test</p>',
      };

      mockQueueService.addEmailJob.mockResolvedValue({
        id: 'job-123',
        data: dto,
        progress: 0,
      } as any);

      const result = await service.sendEmailQueued(dto);

      expect(mockQueueService.addEmailJob).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('jobId');
    });

    it('should support multiple recipients as array', async () => {
      const dto: SendEmailDto = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test',
        body: '<p>Test</p>',
      };

      mockQueueService.addEmailJob.mockResolvedValue({ id: 'job-123' } as any);

      await service.sendEmailQueued(dto);

      expect(mockQueueService.addEmailJob).toHaveBeenCalled();
    });
  });

  describe('sendEmailDirect', () => {
    it('should send email immediately via adapter', async () => {
      const dto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test',
        body: '<p>Test</p>',
      };

      mockSendGridAdapter.send.mockResolvedValue('msg-123');

      const result = await service.sendEmailDirect(dto);

      expect(mockSendGridAdapter.send).toHaveBeenCalledWith(
        'test@example.com',
        'Test',
        '<p>Test</p>',
      );
      expect(result).toHaveProperty('messageId', 'msg-123');
    });

    it('should throw error if adapter fails', async () => {
      const dto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test',
        body: '<p>Test</p>',
      };

      mockSendGridAdapter.send.mockRejectedValue(new Error('SendGrid error'));

      await expect(service.sendEmailDirect(dto)).rejects.toThrow();
    });
  });

  describe('sendTemplateEmail', () => {
    it('should send template email with variables', async () => {
      const dto: SendTemplateEmailDto = {
        to: 'test@example.com',
        templateId: 'welcome-email',
        data: { name: 'John', email: 'john@example.com' },
      };

      const template = {
        id: 'template-1',
        templateId: 'welcome-email',
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        body: '<p>Hello {{name}}</p>',
        variables: { name: 'string', email: 'string' },
        active: true,
      };

      mockTemplateRepository.findByTemplateId.mockResolvedValue(template as any);
      mockQueueService.addEmailJob.mockResolvedValue({ id: 'job-123' } as any);

      const result = await service.sendTemplateEmail(dto);

      expect(mockTemplateRepository.findByTemplateId).toHaveBeenCalledWith('welcome-email');
      expect(mockQueueService.addEmailJob).toHaveBeenCalled();
      expect(result).toHaveProperty('jobId');
    });

    it('should throw error if template not found', async () => {
      const dto: SendTemplateEmailDto = {
        to: 'test@example.com',
        templateId: 'non-existent',
        data: { name: 'John' },
      };

      mockTemplateRepository.findByTemplateId.mockResolvedValue(null);

      await expect(service.sendTemplateEmail(dto)).rejects.toThrow();
    });

    it('should throw error if required variables missing', async () => {
      const dto: SendTemplateEmailDto = {
        to: 'test@example.com',
        templateId: 'welcome-email',
        data: { name: 'John' }, // missing 'email'
      };

      const template = {
        id: 'template-1',
        templateId: 'welcome-email',
        variables: { name: 'string', email: 'string' },
        active: true,
      };

      mockTemplateRepository.findByTemplateId.mockResolvedValue(template as any);

      await expect(service.sendTemplateEmail(dto)).rejects.toThrow();
    });
  });

  describe('sendBatchEmails', () => {
    it('should queue multiple emails', async () => {
      const dto: BatchSendEmailDto = {
        emails: [
          { to: 'user1@example.com', subject: 'Test 1', body: 'Body 1' },
          { to: 'user2@example.com', subject: 'Test 2', body: 'Body 2' },
        ],
      };

      mockQueueService.addEmailJob.mockResolvedValue({ id: 'job-123' } as any);

      const result = await service.sendBatchEmails(dto);

      expect(mockQueueService.addEmailJob).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('jobsCreated', 2);
    });
  });

  describe('verifyEmail', () => {
    it('should verify valid email', async () => {
      mockSendGridAdapter.verifyEmail.mockResolvedValue(true);

      const result = await service.verifyEmail('test@example.com');

      expect(mockSendGridAdapter.verifyEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false for invalid email', async () => {
      mockSendGridAdapter.verifyEmail.mockResolvedValue(false);

      const result = await service.verifyEmail('invalid-email');

      expect(result).toBe(false);
    });
  });

  describe('getTemplates', () => {
    it('should return list of templates', async () => {
      const templates = [
        {
          id: '1',
          templateId: 'welcome-email',
          name: 'Welcome',
          active: true,
        },
        {
          id: '2',
          templateId: 'verify-email',
          name: 'Verify',
          active: true,
        },
      ];

      mockTemplateRepository.getAllTemplates.mockResolvedValue({
        items: templates,
        total: 2,
      } as any);

      const result = await service.getTemplates(true);

      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = {
        email: {
          queue: 'email-queue',
          waiting: 0,
          active: 5,
          completed: 100,
          failed: 2,
          delayed: 1,
        },
        push: {
          queue: 'push-queue',
          waiting: 1,
          active: 2,
          completed: 50,
          failed: 0,
          delayed: 0,
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockQueueService.getQueueStats.mockResolvedValue(stats);

      const result = await service.getQueueStats();

      expect(mockQueueService.getQueueStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });
});
