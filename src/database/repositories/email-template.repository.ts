import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EmailTemplateEntity } from '../entities';

@Injectable()
export class EmailTemplateRepository extends Repository<EmailTemplateEntity> {
  constructor(private dataSource: DataSource) {
    super(EmailTemplateEntity, dataSource.createEntityManager());
  }

  async findByTemplateId(templateId: string): Promise<EmailTemplateEntity | null> {
    return this.findOne({ where: { templateId } });
  }

  async findAllActive(skip: number = 0, take: number = 20) {
    const [items, total] = await this.findAndCount({
      where: { active: true },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async searchTemplates(
    search: string,
    activeOnly: boolean = true,
    skip: number = 0,
    take: number = 20,
  ) {
    let query = this.createQueryBuilder('template')
      .where('template.name ILIKE :search', { search: `%${search}%` })
      .orWhere('template.templateId ILIKE :search', { search: `%${search}%` })
      .orderBy('template.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (activeOnly) {
      query = query.andWhere('template.active = :active', { active: true });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async getAllTemplates(skip: number = 0, take: number = 20, activeOnly: boolean = true) {
    let query = this.createQueryBuilder('template')
      .orderBy('template.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (activeOnly) {
      query = query.where('template.active = :active', { active: true });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async deactivateTemplate(templateId: string): Promise<void> {
    await this.update({ templateId }, { active: false });
  }
}
