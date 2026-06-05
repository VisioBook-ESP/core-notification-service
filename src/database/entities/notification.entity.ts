import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationStatus, NotificationType } from '../../common/enums';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['read', 'userId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('enum', { enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column('jsonb', { nullable: true, default: null })
  data: Record<string, any> | null;

  @Column('enum', { enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  readAt?: Date;
}
