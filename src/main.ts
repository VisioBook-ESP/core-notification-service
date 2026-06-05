import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect NATS microservice (listens to events from other services)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://localhost:4222'],
      queue: 'notifications', // queue group for horizontal scaling
    },
  });

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Core Notification Service')
    .setDescription(
      'Microservice for managing notifications (email, push, in-app) in VisioBook platform',
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token for user authentication',
    })
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api_key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start NATS microservice transport then HTTP server
  await app.startAllMicroservices();
  const port = process.env.PORT || 8088;
  await app.listen(port);
  console.log(`🚀 Core Notification Service running on port ${port}`);
  console.log(`📡 NATS listener connected to ${process.env.NATS_URL || 'nats://localhost:4222'}`);
}

bootstrap();
