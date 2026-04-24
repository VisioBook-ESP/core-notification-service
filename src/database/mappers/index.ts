import { SubscribeDeviceDto, UpdateDeviceTokenDto } from '../dto';
import { DeviceTokenEntity } from '../entities';

export class DeviceTokenMapper {
  static toEntity(userId: string, dto: SubscribeDeviceDto): Partial<DeviceTokenEntity> {
    return {
      userId,
      deviceId: dto.deviceId,
      token: dto.token,
      platform: dto.platform,
      active: true,
    };
  }

  static toUpdateEntity(dto: UpdateDeviceTokenDto): Partial<DeviceTokenEntity> {
    return {
      token: dto.token,
      active: dto.active ?? true,
    };
  }

  static toResponse(entity: DeviceTokenEntity) {
    return {
      id: entity.id,
      userId: entity.userId,
      deviceId: entity.deviceId,
      token: entity.token,
      platform: entity.platform,
      active: entity.active,
      lastUsedAt: entity.lastUsedAt || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(entities: DeviceTokenEntity[], total: number, page: number, limit: number) {
    return {
      items: entities.map(e => this.toResponse(e)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
