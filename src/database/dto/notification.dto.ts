import { IsUUID, IsEnum, IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationStatus } from '../../common/enums';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'Optional data payload', required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Mark as read', required: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  data: Record<string, any> | null;

  @ApiProperty()
  status: NotificationStatus;

  @ApiProperty()
  read: boolean;

  @ApiProperty()
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListNotificationsQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by read status', required: false })
  @IsOptional()
  read?: boolean;

  @ApiProperty({ description: 'Filter by notification type', required: false })
  @IsOptional()
  type?: NotificationType;
}

export class ListNotificationsResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
