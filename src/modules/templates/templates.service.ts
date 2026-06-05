import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmailTemplateRepository } from '../../database';
import { EmailTemplateMapper } from '../../database/mappers/email-template.mapper';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  ListEmailTemplatesQueryDto,
} from '../../database/dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private templateRepository: EmailTemplateRepository) {}

  /**
   * Create email template
   */
  async createTemplate(dto: CreateEmailTemplateDto): Promise<any> {
    try {
      this.logger.log(`📝 Creating email template: ${dto.templateId}`);

      // Check if templateId already exists
      const existing = await this.templateRepository.findByTemplateId(dto.templateId);
      if (existing) {
        throw new BadRequestException(`Template with ID "${dto.templateId}" already exists`);
      }

      const template = this.templateRepository.create(EmailTemplateMapper.toEntity(dto));

      await this.templateRepository.save(template);

      this.logger.log(`✓ Template created: ${template.id}`);

      return EmailTemplateMapper.toResponse(template);
    } catch (error) {
      this.logger.error(`✗ Failed to create template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template by ID or templateId
   */
  async getTemplate(templateId: string): Promise<any> {
    try {
      this.logger.log(`📝 Fetching template: ${templateId}`);

      const template = await this.templateRepository.findByTemplateId(templateId);

      if (!template) {
        throw new NotFoundException(`Template "${templateId}" not found`);
      }

      return EmailTemplateMapper.toResponse(template);
    } catch (error) {
      this.logger.error(`✗ Failed to fetch template: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(query: ListEmailTemplatesQueryDto = {}): Promise<any> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      this.logger.log(`📝 Fetching templates (page ${page}, limit ${limit})`);

      let result;

      if (query.search) {
        result = await this.templateRepository.searchTemplates(
          query.search,
          query.active !== false,
          skip,
          limit,
        );
      } else {
        result = await this.templateRepository.getAllTemplates(skip, limit, query.active !== false);
      }

      return EmailTemplateMapper.toResponseList(result.items, result.total, page, limit);
    } catch (error) {
      this.logger.error(`✗ Failed to fetch templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, dto: UpdateEmailTemplateDto): Promise<any> {
    try {
      this.logger.log(`📝 Updating template: ${templateId}`);

      const template = await this.templateRepository.findByTemplateId(templateId);

      if (!template) {
        throw new NotFoundException(`Template "${templateId}" not found`);
      }

      const updates = EmailTemplateMapper.toUpdateEntity(dto);
      Object.assign(template, updates);
      template.updatedAt = new Date();

      await this.templateRepository.save(template);

      this.logger.log(`✓ Template updated: ${templateId}`);

      return EmailTemplateMapper.toResponse(template);
    } catch (error) {
      this.logger.error(`✗ Failed to update template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete template (soft delete - deactivate)
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      this.logger.log(`📝 Deleting template: ${templateId}`);

      const template = await this.templateRepository.findByTemplateId(templateId);

      if (!template) {
        throw new NotFoundException(`Template "${templateId}" not found`);
      }

      await this.templateRepository.deactivateTemplate(templateId);

      this.logger.log(`✓ Template deactivated: ${templateId}`);
    } catch (error) {
      this.logger.error(`✗ Failed to delete template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test template rendering (validate variables)
   */
  async testTemplate(templateId: string, data: Record<string, any>): Promise<any> {
    try {
      this.logger.log(`🧪 Testing template: ${templateId}`);

      const template = await this.templateRepository.findByTemplateId(templateId);

      if (!template) {
        throw new NotFoundException(`Template "${templateId}" not found`);
      }

      // Validate that all required variables are provided
      const requiredVariables = Object.keys(template.variables);
      const missingVariables = requiredVariables.filter(v => !(v in data));

      if (missingVariables.length > 0) {
        throw new BadRequestException(`Missing required variables: ${missingVariables.join(', ')}`);
      }

      this.logger.log(`✓ Template validation passed`);

      return {
        valid: true,
        templateId,
        requiredVariables,
        providedVariables: Object.keys(data),
      };
    } catch (error) {
      this.logger.error(`✗ Template test failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get templates by type
   */
  async getActiveTemplates(): Promise<any> {
    try {
      this.logger.log(`📝 Fetching active templates`);

      const { items, total } = await this.templateRepository.findAllActive(0, 100);

      return {
        items: items.map(t => EmailTemplateMapper.toResponse(t)),
        total,
      };
    } catch (error) {
      this.logger.error(`✗ Failed to fetch active templates: ${error.message}`);
      throw error;
    }
  }
}
