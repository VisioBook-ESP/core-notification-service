import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module, Logger } from '@nestjs/common';
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

const logger = new Logger('TestSetup');

// Set test environment variables
process.env.VALID_API_KEYS = 'test-key-123';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Determine database host; default to localhost unless explicitly configured.
const getDatabaseHost = (): string => {
  // Priority: TEST_DATABASE_HOST > DATABASE_HOST > localhost (default)
  if (process.env.TEST_DATABASE_HOST) return process.env.TEST_DATABASE_HOST;
  if (process.env.DATABASE_HOST && process.env.DATABASE_HOST !== 'postgres') {
    return process.env.DATABASE_HOST;
  }
  return 'localhost';
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.test', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: getDatabaseHost(),
      port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
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
      retryAttempts: 5,
      retryDelay: 3000,
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
  try {
    logger.log(`Creating test app with database host: ${getDatabaseHost()}`);
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

    await app.init();
    logger.log('Test app initialized successfully');
    return app;
  } catch (error) {
    logger.error('Failed to initialize test app:', error);
    throw error;
  }
}
