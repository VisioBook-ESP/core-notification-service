import { CreateNotificationDto } from '../dto';
import { NotificationEntity } from '../entities';

export class NotificationMapper {
  static toEntity(dto: CreateNotificationDto): Partial<NotificationEntity> {
    return {
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data || null,
    };
  }

  static toResponse(entity: NotificationEntity) {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      body: entity.body,
      data: entity.data,
      status: entity.status,
      read: entity.read,
      readAt: entity.readAt || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(
    entities: NotificationEntity[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      items: entities.map(e => this.toResponse(e)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
