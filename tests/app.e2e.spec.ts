import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-setup';

describe('Notifications Module Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/notifications', () => {
    it('should require JWT token', () => {
      return request(app.getHttpServer()).get('/api/v1/notifications').expect(401);
    });
  });

  describe('POST /api/v1/notifications', () => {
    it('should require API key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/notifications')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'system_announcement',
          title: 'Test',
          body: 'Test notification',
        })
        .expect(401);
    });
  });
});

describe('Templates Module Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/templates', () => {
    it('should return templates without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/templates').expect(200);
    });
  });

  describe('POST /api/v1/templates', () => {
    it('should require API key for create', () => {
      return request(app.getHttpServer())
        .post('/api/v1/templates')
        .send({
          templateId: 'new-template',
          name: 'New Template',
          subject: 'Subject',
          body: 'Body',
          variables: {},
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/templates/:templateId/test', () => {
    it('should test template without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/templates/welcome-email/test')
        .send({ name: 'John' })
        .expect([200, 404]); // Ok or not found, but not 401
    });
  });
});
