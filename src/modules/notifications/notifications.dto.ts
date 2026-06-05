import { IsString, IsOptional, IsObject, IsBoolean, IsEnum } from 'class-validator';
import { NotificationType } from '../../common/enums';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class ListNotificationsQueryDto {
  @IsOptional()
  page?: string | number;

  @IsOptional()
  limit?: string | number;

  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  search?: string;
}

export class NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ListNotificationsResponseDto {
  items: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
