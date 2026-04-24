import { IsString, IsUUID, IsEnum, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '../../common/enums';

export class SubscribeDeviceDto {
  @ApiProperty({ description: 'Device token for push notifications' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  deviceId: string;

  @ApiProperty({ enum: DevicePlatform, description: 'Device platform' })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}

export class UnsubscribeDeviceDto {
  @ApiProperty({ description: 'Device ID to unsubscribe' })
  @IsString()
  deviceId: string;
}

export class SendPushDto {
  @ApiProperty({ description: 'User ID to send push to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Push notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Push notification body' })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Optional data payload',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @ApiProperty({
    description: 'Image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class SendPushResponseDto {
  @ApiProperty({ description: 'Job ID in queue' })
  jobId: string | number;

  @ApiProperty({ description: 'Push job status' })
  status: 'queued' | 'sent' | 'failed';

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class SendTopicPushDto {
  @ApiProperty({ description: 'Firebase topic name' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Push notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Push notification body' })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Optional data payload',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class SubscribeTopicDto {
  @ApiProperty({ description: 'Topic name' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Device IDs to subscribe' })
  @IsArray()
  @IsString({ each: true })
  deviceIds: string[];
}

export class ListDevicesQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    enum: DevicePlatform,
    description: 'Filter by platform',
    required: false,
  })
  @IsOptional()
  platform?: DevicePlatform;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  active?: boolean;
}

export class DeviceListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  platform: DevicePlatform;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListDevicesResponseDto {
  @ApiProperty({ type: [DeviceListResponseDto] })
  items: DeviceListResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
