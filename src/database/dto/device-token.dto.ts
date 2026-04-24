import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '../../common/enums';

export class SubscribeDeviceDto {
  @ApiProperty({ description: 'Device token for push notifications' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Device ID' })
  @IsString()
  deviceId: string;

  @ApiProperty({ enum: DevicePlatform, description: 'Device platform' })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}

export class UnsubscribeDeviceDto {
  @ApiProperty({ description: 'Device ID' })
  @IsString()
  deviceId: string;
}

export class UpdateDeviceTokenDto {
  @ApiProperty({ description: 'Device token for push notifications' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Is device active', required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class DeviceTokenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  platform: DevicePlatform;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  lastUsedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListDeviceTokensQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  active?: boolean;

  @ApiProperty({ enum: DevicePlatform, description: 'Filter by platform', required: false })
  @IsOptional()
  platform?: DevicePlatform;
}

export class ListDeviceTokensResponseDto {
  @ApiProperty({ type: [DeviceTokenResponseDto] })
  items: DeviceTokenResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
