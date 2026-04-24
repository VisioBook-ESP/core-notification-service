import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { DevicePlatform } from '../../common/enums';

@Entity('device_tokens')
@Unique(['deviceId', 'userId'])
@Index(['userId'])
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  deviceId: string;

  @Column()
  token: string;

  @Column('enum', { enum: DevicePlatform })
  platform: DevicePlatform;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastUsedAt?: Date;
}
