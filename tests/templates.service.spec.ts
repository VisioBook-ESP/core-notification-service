import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplatesService } from '../src/modules/templates/templates.service';
import { EmailTemplateRepository } from '../src/database/repositories/email-template.repository';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from '../src/database/dto';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let mockRepository: jest.Mocked<EmailTemplateRepository>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findByTemplateId: jest.fn(),
      getAllTemplates: jest.fn(),
      searchTemplates: jest.fn(),
      deactivateTemplate: jest.fn(),
      findAllActive: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplatesService, { provide: EmailTemplateRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  describe('createTemplate', () => {
    it('should create new template', async () => {
      const dto: CreateEmailTemplateDto = {
        templateId: 'welcome-email',
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        body: '<p>Hello {{name}}</p>',
        variables: { name: 'string' },
      };

      const saved = {
        id: 'template-1',
        ...dto,
        active: true,
        createdAt: new Date(),
      };

      mockRepository.findByTemplateId.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(saved as any);
      mockRepository.save.mockResolvedValue(saved as any);

      const result = await service.createTemplate(dto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('templateId');
    });

    it('should throw error if templateId already exists', async () => {
      const dto: CreateEmailTemplateDto = {
        templateId: 'welcome-email',
        name: 'Welcome',
        subject: 'Subject',
        body: 'Body',
        variables: {},
      };

      mockRepository.findByTemplateId.mockResolvedValue({
        templateId: 'welcome-email',
      } as any);

      await expect(service.createTemplate(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', async () => {
      const template = {
        id: 'template-1',
        templateId: 'welcome-email',
        name: 'Welcome',
        subject: 'Subject',
        body: 'Body',
      };

      mockRepository.findByTemplateId.mockResolvedValue(template as any);

      const result = await service.getTemplate('welcome-email');

      expect(mockRepository.findByTemplateId).toHaveBeenCalledWith('welcome-email');
      expect(result).toHaveProperty('templateId');
    });

    it('should throw error if template not found', async () => {
      mockRepository.findByTemplateId.mockResolvedValue(null);

      await expect(service.getTemplate('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listTemplates', () => {
    it('should return paginated list of templates', async () => {
      const templates = [
        {
          id: '1',
          templateId: 'welcome',
          name: 'Welcome',
          active: true,
        },
      ];

      mockRepository.getAllTemplates.mockResolvedValue({
        items: templates,
        total: 1,
      } as any);

      const result = await service.listTemplates({ page: 1, limit: 20 });

      expect(result).toHaveProperty('items');
    });

    it('should search templates', async () => {
      mockRepository.searchTemplates.mockResolvedValue({
        items: [],
        total: 0,
      } as any);

      await service.listTemplates({
        page: 1,
        limit: 20,
        search: 'welcome',
      });

      expect(mockRepository.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const dto: UpdateEmailTemplateDto = {
        name: 'Updated Welcome',
        subject: 'Updated Subject',
      };

      const template = {
        id: 'template-1',
        templateId: 'welcome-email',
        name: 'Welcome',
        subject: 'Subject',
      };

      const updated = { ...template, ...dto };

      mockRepository.findByTemplateId.mockResolvedValue(template as any);
      mockRepository.save.mockResolvedValue(updated as any);

      const result = await service.updateTemplate('welcome-email', dto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('name', 'Updated Welcome');
    });

    it('should throw if template not found', async () => {
      mockRepository.findByTemplateId.mockResolvedValue(null);

      await expect(service.updateTemplate('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTemplate', () => {
    it('should deactivate template', async () => {
      const template = {
        id: 'template-1',
        templateId: 'welcome-email',
        active: true,
      };

      mockRepository.findByTemplateId.mockResolvedValue(template as any);
      mockRepository.deactivateTemplate.mockResolvedValue(undefined);

      await service.deleteTemplate('welcome-email');

      expect(mockRepository.deactivateTemplate).toHaveBeenCalledWith('welcome-email');
    });
  });

  describe('testTemplate', () => {
    it('should validate template variables', async () => {
      const template = {
        id: 'template-1',
        variables: { name: 'string', email: 'string' },
      };

      mockRepository.findByTemplateId.mockResolvedValue(template as any);

      const result = await service.testTemplate('welcome-email', {
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toHaveProperty('valid', true);
    });

    it('should throw if required variables missing', async () => {
      const template = {
        id: 'template-1',
        variables: { name: 'string', email: 'string' },
      };

      mockRepository.findByTemplateId.mockResolvedValue(template as any);

      await expect(service.testTemplate('welcome-email', { name: 'John' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
