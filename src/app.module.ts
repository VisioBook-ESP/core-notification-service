import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './modules/queue/queue.module';
import { EmailModule } from './modules/email/email.module';
import { PushModule } from './modules/push/push.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { NatsModule } from './modules/nats/nats.module';
import { NotificationEntity, EmailTemplateEntity, DeviceTokenEntity } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'visiobook',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'notifications_db',
      entities: [NotificationEntity, EmailTemplateEntity, DeviceTokenEntity],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      // Migrations disabled in development (using synchronize: true)
      // In production, use compiled migrations: dist/database/migrations/*.js
      migrations: process.env.NODE_ENV === 'production' ? ['dist/database/migrations/*.js'] : [],
      migrationsRun: false,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    TypeOrmModule.forFeature([NotificationEntity, EmailTemplateEntity, DeviceTokenEntity]),
    DatabaseModule,
    QueueModule,
    EmailModule,
    PushModule,
    NotificationsModule,
    TemplatesModule,
    NatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
