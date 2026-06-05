import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity, EmailTemplateEntity, DeviceTokenEntity } from './entities';
import {
  NotificationRepository,
  EmailTemplateRepository,
  DeviceTokenRepository,
} from './repositories';
import { DatabaseService } from './database.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, EmailTemplateEntity, DeviceTokenEntity])],
  providers: [
    NotificationRepository,
    EmailTemplateRepository,
    DeviceTokenRepository,
    DatabaseService,
  ],
  exports: [
    NotificationRepository,
    EmailTemplateRepository,
    DeviceTokenRepository,
    DatabaseService,
  ],
})
export class DatabaseModule {}
