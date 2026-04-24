import {
  Controller,
  Post,
  Get,
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
import { EmailService } from './email.service';
import {
  SendEmailDto,
  SendTemplateEmailDto,
  SendEmailResponseDto,
  BatchSendEmailDto,
  BatchSendResponseDto,
} from './email.dto';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Email')
@Controller('email')
@UseFilters(AllExceptionsFilter)
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private emailService: EmailService) {}

  @Post('send')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send email (queued) - Service only' })
  @ApiSecurity('api_key')
  @ApiResponse({
    status: 202,
    description: 'Email queued successfully',
    type: SendEmailResponseDto,
  })
  async sendEmail(@Body() dto: SendEmailDto): Promise<SendEmailResponseDto> {
    this.logger.log(
      `📧 POST /email/send - Sending email to ${Array.isArray(dto.to) ? dto.to.join(', ') : dto.to}`,
    );
    return this.emailService.sendEmailQueued(dto);
  }

  @Post('send-template')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send email using template' })
  @ApiResponse({
    status: 202,
    description: 'Template email queued successfully',
    type: SendEmailResponseDto,
  })
  async sendTemplateEmail(@Body() dto: SendTemplateEmailDto): Promise<SendEmailResponseDto> {
    this.logger.log(`📧 POST /email/send-template - Sending template email: ${dto.templateId}`);
    return this.emailService.sendTemplateEmail(dto);
  }

  @Post('send-batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send batch emails' })
  @ApiResponse({
    status: 202,
    description: 'Batch emails queued successfully',
    type: BatchSendResponseDto,
  })
  async sendBatchEmails(@Body() dto: BatchSendEmailDto): Promise<BatchSendResponseDto> {
    this.logger.log(`📧 POST /email/send-batch - Sending ${dto.emails.length} emails`);
    return this.emailService.sendBatchEmails(dto);
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get email queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats() {
    this.logger.log('📊 GET /email/queue/stats - Fetching queue stats');
    return this.emailService.getQueueStats();
  }

  @Get('verify/:email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiParam({ name: 'email', description: 'Email to verify' })
  @ApiResponse({ status: 200, description: 'Email verification result' })
  async verifyEmail(@Param('email') email: string) {
    this.logger.log(`🔍 GET /email/verify/${email} - Verifying email`);
    const isValid = await this.emailService.verifyEmail(email);
    return { email, isValid };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List email templates' })
  @ApiResponse({ status: 200, description: 'List of available templates' })
  async getTemplates(@Query('activeOnly') activeOnly: boolean = true) {
    this.logger.log('📋 GET /email/templates - Fetching templates');
    return this.emailService.getTemplates(activeOnly);
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get email template details' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  async getTemplate(@Param('templateId') templateId: string) {
    this.logger.log(`📄 GET /email/templates/${templateId} - Fetching template`);
    return this.emailService.getTemplate(templateId);
  }
}
