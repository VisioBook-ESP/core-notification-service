import { Module } from '@nestjs/common';
import { NatsController } from './nats.controller';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmailModule, PushModule, NotificationsModule],
  controllers: [NatsController],
})
export class NatsModule {}
