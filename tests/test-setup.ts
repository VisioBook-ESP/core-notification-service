import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { DatabaseModule } from '../src/database/database.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { TemplatesModule } from '../src/modules/templates/templates.module';
import {
  NotificationEntity,
  EmailTemplateEntity,
  DeviceTokenEntity,
} from '../src/database/entities';

// Set test environment variables
process.env.VALID_API_KEYS = 'test-key-123';
process.env.JWT_SECRET = 'test-jwt-secret-key';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TEST_DATABASE_HOST || process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.TEST_DATABASE_PORT || process.env.DATABASE_PORT || '5432'),
      username: process.env.TEST_DATABASE_USER || process.env.DATABASE_USER || 'visiobook',
      password:
        process.env.TEST_DATABASE_PASSWORD ||
        process.env.DATABASE_PASSWORD ||
        'visiobook_dev_password',
      database: process.env.TEST_DATABASE_NAME || process.env.DATABASE_NAME || 'notifications_db',
      entities: [NotificationEntity, EmailTemplateEntity, DeviceTokenEntity],
      synchronize: true,
      logging: false,
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([NotificationEntity, EmailTemplateEntity, DeviceTokenEntity]),
    DatabaseModule,
    NotificationsModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule {}

export async function createTestingApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  try {
    await app.init();
  } catch (error) {
    console.error('Failed to initialize test app:', error);
    throw error;
  }

  return app;
}
