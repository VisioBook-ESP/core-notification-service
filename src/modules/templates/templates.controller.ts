import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseFilters,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateResponseDto,
  ListEmailTemplatesResponseDto,
} from '../../database/dto';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Email Templates')
@Controller('templates')
@UseFilters(AllExceptionsFilter)
export class TemplatesController {
  private readonly logger = new Logger(TemplatesController.name);

  constructor(private templatesService: TemplatesService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Create email template - Admin only' })
  @ApiResponse({ status: 201, description: 'Template created', type: EmailTemplateResponseDto })
  async createTemplate(@Body() dto: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    this.logger.log(`📝 POST /templates - Creating template`);
    return this.templatesService.createTemplate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List email templates (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of templates',
    type: ListEmailTemplatesResponseDto,
  })
  async listTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('active') active?: boolean,
    @Query('search') search?: string,
  ): Promise<ListEmailTemplatesResponseDto> {
    this.logger.log(`📝 GET /templates - Listing templates`);
    return this.templatesService.listTemplates({ page, limit, active, search });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active templates (public)' })
  @ApiResponse({ status: 200, description: 'Active templates' })
  async getActiveTemplates(): Promise<any> {
    this.logger.log(`📝 GET /templates/active - Fetching active templates`);
    return this.templatesService.getActiveTemplates();
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'Get template by ID (public)' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template details', type: EmailTemplateResponseDto })
  async getTemplate(@Param('templateId') templateId: string): Promise<EmailTemplateResponseDto> {
    this.logger.log(`📝 GET /templates/${templateId} - Fetching template`);
    return this.templatesService.getTemplate(templateId);
  }

  @Patch(':templateId')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Update email template - Admin only' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template updated', type: EmailTemplateResponseDto })
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateResponseDto> {
    this.logger.log(`📝 PATCH /templates/${templateId} - Updating template`);
    return this.templatesService.updateTemplate(templateId, dto);
  }

  @Delete(':templateId')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Delete email template - Admin only' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  async deleteTemplate(@Param('templateId') templateId: string): Promise<void> {
    this.logger.log(`📝 DELETE /templates/${templateId} - Deleting template`);
    return this.templatesService.deleteTemplate(templateId);
  }

  @Post(':templateId/test')
  @ApiOperation({ summary: 'Test template (validate variables - public)' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template test result' })
  async testTemplate(
    @Param('templateId') templateId: string,
    @Body() data: Record<string, any>,
  ): Promise<any> {
    this.logger.log(`🧪 POST /templates/${templateId}/test - Testing template`);
    return this.templatesService.testTemplate(templateId, data);
  }
}
