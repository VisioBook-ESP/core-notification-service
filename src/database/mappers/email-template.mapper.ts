import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from '../dto';
import { EmailTemplateEntity } from '../entities';

export class EmailTemplateMapper {
  static toEntity(dto: CreateEmailTemplateDto): Partial<EmailTemplateEntity> {
    return {
      templateId: dto.templateId,
      name: dto.name,
      subject: dto.subject,
      body: dto.body,
      variables: dto.variables,
      active: dto.active ?? true,
    };
  }

  static toUpdateEntity(dto: UpdateEmailTemplateDto): Partial<EmailTemplateEntity> {
    const updates: Partial<EmailTemplateEntity> = {};
    if (dto.name) updates.name = dto.name;
    if (dto.subject) updates.subject = dto.subject;
    if (dto.body) updates.body = dto.body;
    if (dto.variables) updates.variables = dto.variables;
    if (dto.active !== undefined) updates.active = dto.active;
    return updates;
  }

  static toResponse(entity: EmailTemplateEntity) {
    return {
      id: entity.id,
      templateId: entity.templateId,
      name: entity.name,
      subject: entity.subject,
      body: entity.body,
      variables: entity.variables,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(
    entities: EmailTemplateEntity[],
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
