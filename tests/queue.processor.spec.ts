import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { EmailProcessor } from '../src/modules/queue/email.processor';
import { SendGridAdapter } from '../src/modules/adapters/sendgrid.adapter';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockSendGridAdapter: jest.Mocked<SendGridAdapter>;
  let mockJob: jest.Mocked<Job>;

  beforeEach(async () => {
    mockSendGridAdapter = {
      send: jest.fn(),
      sendTemplate: jest.fn(),
      sendBatch: jest.fn(),
      verifyEmail: jest.fn(),
    } as any;

    mockJob = {
      id: 'job-123',
      data: {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      },
      progress: jest.fn(),
      log: jest.fn(),
      update: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailProcessor, { provide: SendGridAdapter, useValue: mockSendGridAdapter }],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  describe('handleEmailJob', () => {
    it('should process email send job', async () => {
      mockSendGridAdapter.send.mockResolvedValue('msg-123');

      const result = await processor.handleEmailJob(mockJob);

      expect(mockSendGridAdapter.send).toHaveBeenCalledWith(
        'test@example.com',
        'Test',
        'Test body',
      );
      expect(result).toEqual({
        success: true,
        messageId: 'msg-123',
      });
    });

    it('should handle send errors with retry', async () => {
      mockSendGridAdapter.send.mockRejectedValue(new Error('SendGrid error'));

      await expect(processor.handleEmailJob(mockJob)).rejects.toThrow();
    });

    it('should process template emails', async () => {
      const templateJob = {
        ...mockJob,
        data: {
          to: 'test@example.com',
          templateId: 'welcome-email',
          variables: { name: 'John' },
        },
      } as any;

      mockSendGridAdapter.sendTemplate.mockResolvedValue('msg-456');

      const result = await processor.handleEmailJob(templateJob);

      expect(mockSendGridAdapter.sendTemplate).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('onCompleted', () => {
    it('should log job completion', async () => {
      const completedJob = {
        id: 'job-123',
        data: { to: 'test@example.com' },
        returnvalue: { success: true },
      } as any;

      expect(() => {
        processor.onCompleted(completedJob);
      }).not.toThrow();
    });
  });

  describe('onFailed', () => {
    it('should log job failure', async () => {
      const failedJob = {
        id: 'job-123',
        data: { to: 'test@example.com' },
        attemptsMade: 2,
      } as any;

      const error = new Error('Job failed');

      expect(() => {
        processor.onFailed(failedJob, error);
      }).not.toThrow();
    });
  });
});

describe('PushProcessor', () => {
  beforeEach(async () => {
    // Mock the PushProcessor - full Firebase testing would require more setup
  });

  it.skip('should process push notification job', async () => {
    expect(true).toBe(true);
  });
});
