import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from '../src/modules/email/email.controller';
import { EmailService } from '../src/modules/email/email.service';
import { SendEmailDto, SendTemplateEmailDto } from '../src/modules/email/email.dto';

describe('EmailController', () => {
  let controller: EmailController;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    mockEmailService = {
      sendEmailQueued: jest.fn(),
      sendEmailDirect: jest.fn(),
      sendTemplateEmail: jest.fn(),
      sendBatchEmails: jest.fn(),
      verifyEmail: jest.fn(),
      getTemplates: jest.fn(),
      getTemplate: jest.fn(),
      getQueueStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: mockEmailService }],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  describe('sendEmail', () => {
    it('should call sendEmailQueued', async () => {
      const dto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test',
        body: '<p>Test</p>',
      };

      mockEmailService.sendEmailQueued.mockResolvedValue({
        jobId: 'job-123',
        status: 'queued',
        timestamp: new Date(),
      });

      const result = await controller.sendEmail(dto);

      expect(mockEmailService.sendEmailQueued).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('jobId');
    });
  });

  describe('sendTemplateEmail', () => {
    it('should call sendTemplateEmail service method', async () => {
      const dto: SendTemplateEmailDto = {
        to: 'test@example.com',
        templateId: 'welcome-email',
        data: { name: 'John' },
      };

      mockEmailService.sendTemplateEmail.mockResolvedValue({
        jobId: 'job-123',
        status: 'queued',
        timestamp: new Date(),
      });

      const result = await controller.sendTemplateEmail(dto);

      expect(mockEmailService.sendTemplateEmail).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('jobId');
    });
  });

  describe('verifyEmail', () => {
    it('should return email verification result', async () => {
      mockEmailService.verifyEmail.mockResolvedValue(true);

      const result = await controller.verifyEmail('test@example.com');

      expect(result).toEqual({ email: 'test@example.com', isValid: true });
    });
  });

  describe('getTemplates', () => {
    it('should return list of templates', async () => {
      mockEmailService.getTemplates.mockResolvedValue({
        items: [
          {
            id: '1',
            templateId: 'welcome-email',
            name: 'Welcome',
            subject: 'Welcome',
            variables: {},
            active: true,
          },
        ],
        total: 1,
      });

      const result = await controller.getTemplates(true);

      expect(mockEmailService.getTemplates).toHaveBeenCalledWith(true);
      expect(result).toHaveProperty('items');
    });
  });
});
