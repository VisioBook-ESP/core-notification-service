import { IsEmail, IsString, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email(s)',
    example: 'user@example.com',
  })
  @IsEmail({}, { each: true, message: 'Each email must be valid' })
  to: string | string[];

  @ApiProperty({ description: 'Email subject', example: 'Welcome to VisioBook' })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Email body (HTML)',
    example: '<h1>Welcome</h1><p>Hello user!</p>',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Optional attachments',
    required: false,
  })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class SendTemplateEmailDto {
  @ApiProperty({ description: 'Recipient email(s)' })
  @IsEmail({}, { each: true, message: 'Each email must be valid' })
  to: string | string[];

  @ApiProperty({
    description: 'Email template ID',
    example: 'email_verification',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Template variables',
    example: { verificationLink: 'https://visiobook.com/verify?token=abc123' },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({
    description: 'Optional attachments',
    required: false,
  })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class SendEmailResponseDto {
  @ApiProperty({ description: 'Job ID in queue' })
  jobId: string | number;

  @ApiProperty({ description: 'Job status' })
  status: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Message ID (when sent)' })
  messageId?: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class EmailStatusDto {
  @ApiProperty({ description: 'Message ID' })
  messageId: string;

  @ApiProperty({ description: 'Current status' })
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';

  @ApiProperty({ description: 'Status details' })
  details: string;

  @ApiProperty({ description: 'Last updated' })
  updatedAt: string;
}

export class BatchSendEmailDto {
  @ApiProperty({
    type: [SendEmailDto],
    description: 'Array of emails to send',
  })
  @IsArray()
  emails: SendEmailDto[];

  @ApiProperty({
    description: 'Priority (higher = sent first)',
    default: 100,
    required: false,
  })
  @IsOptional()
  priority?: number;
}

export class BatchSendResponseDto {
  @ApiProperty({ description: 'Number of jobs created' })
  jobsCreated: number;

  @ApiProperty({ description: 'Job IDs' })
  jobIds: (string | number)[];

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}
