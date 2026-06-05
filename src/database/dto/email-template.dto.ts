import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailTemplateDto {
  @ApiProperty({ description: 'Template identifier' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email body (HTML)' })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Template variables schema',
    example: { to: 'string', username: 'string' },
  })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({ description: 'Is template active', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateEmailTemplateDto {
  @ApiProperty({ description: 'Template name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Email subject', required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Email body (HTML)', required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ description: 'Template variables schema', required: false })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiProperty({ description: 'Is template active', required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class EmailTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  variables: Record<string, any>;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListEmailTemplatesQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  active?: boolean;

  @ApiProperty({ description: 'Search by name or templateId', required: false })
  @IsOptional()
  search?: string;
}

export class ListEmailTemplatesResponseDto {
  @ApiProperty({ type: [EmailTemplateResponseDto] })
  items: EmailTemplateResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
