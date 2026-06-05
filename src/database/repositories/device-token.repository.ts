import { DataSource, Repository, Not, LessThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DeviceTokenEntity } from '../entities';
import { DevicePlatform } from '../../common/enums';

@Injectable()
export class DeviceTokenRepository extends Repository<DeviceTokenEntity> {
  constructor(private dataSource: DataSource) {
    super(DeviceTokenEntity, dataSource.createEntityManager());
  }

  async findActiveTokensByUserId(userId: string): Promise<string[]> {
    const tokens = await this.find({
      where: { userId, active: true },
      select: ['token'],
    });
    return tokens.map(t => t.token);
  }

  async findByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<DeviceTokenEntity | null> {
    return this.findOne({ where: { userId, deviceId } });
  }

  async findDevicesByUserId(
    userId: string,
    skip: number = 0,
    take: number = 20,
    filters?: {
      active?: boolean;
      platform?: DevicePlatform;
    },
  ) {
    let query = this.createQueryBuilder('device')
      .where('device.userId = :userId', { userId })
      .orderBy('device.updatedAt', 'DESC')
      .skip(skip)
      .take(take);

    if (filters?.active !== undefined) {
      query = query.andWhere('device.active = :active', { active: filters.active });
    }

    if (filters?.platform) {
      query = query.andWhere('device.platform = :platform', { platform: filters.platform });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async countDevicesByUserId(userId: string): Promise<number> {
    return this.count({ where: { userId } });
  }

  async updateLastUsed(deviceId: string, userId: string): Promise<void> {
    await this.update({ deviceId, userId }, { lastUsedAt: new Date() });
  }

  async deactivateOldTokens(userId: string, keepDeviceId: string): Promise<void> {
    await this.update({ userId, id: Not(keepDeviceId) }, { active: false });
  }

  async deleteInactiveTokens(daysInactive: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    await this.delete({
      active: false,
      updatedAt: LessThan(cutoffDate),
    });
  }

  async findTokensByPlatform(
    platform: DevicePlatform,
    activeOnly: boolean = true,
  ): Promise<string[]> {
    let query = this.createQueryBuilder('device')
      .where('device.platform = :platform', { platform })
      .select('device.token');

    if (activeOnly) {
      query = query.andWhere('device.active = :active', { active: true });
    }

    const results = await query.getRawMany();
    return results.map(r => r.device_token);
  }
}
